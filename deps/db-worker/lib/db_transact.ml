(* Port of ldb/transact! (deps/db/src/logseq/db.cljs) and
   logseq.db.common.delete-blocks — the worker-side transact wrapper and
   its deletion cleanup machinery.

   Tx-data items are represented as Wire.t values (cljs maps / vectors)
   and rendered to EDN for Datascript.transact_conn_string. tx_meta is a
   (attr * value) list, as built by Ds_wire.tx_meta_of_transit. *)

open Datascript

(* ---------- tx item helpers ---------- *)

let kw (s : string) : Wire.t = Wire.Keyword s

let vec args : Wire.t = Wire.Array args

(* EDN rendering of Float leaves uses %.17g which loses the decimal point
   for whole numbers ("3"), so the string round-trip would store Int. Render
   them through Symbol so the EDN reader keeps a float. *)
let rec float_leaves_as_symbols (t : Wire.t) : Wire.t =
  match t with
  | Wire.Float f ->
      let s = Printf.sprintf "%.17g" f in
      Wire.Symbol
        (if String.exists (fun c -> c = '.' || c = 'e' || c = 'E') s
         then s
         else s ^ ".0")
  | Wire.Map kvs ->
      Wire.Map
        (List.map
           (fun (k, v) -> float_leaves_as_symbols k, float_leaves_as_symbols v)
           kvs)
  | Wire.Array xs -> Wire.Array (List.map float_leaves_as_symbols xs)
  | Wire.List xs -> Wire.List (List.map float_leaves_as_symbols xs)
  | Wire.Set xs -> Wire.Set (List.map float_leaves_as_symbols xs)
  | Wire.Tagged (tag, v) -> Wire.Tagged (tag, float_leaves_as_symbols v)
  | _ -> t

let tx_item_edn (item : Wire.t) : string =
  Ds_wire.edn_of_transit (float_leaves_as_symbols item)

let tx_edn (items : Wire.t list) : string =
  "[" ^ String.concat " " (List.map tx_item_edn items) ^ "]"

let attr_namespace (k : string) : string option =
  match String.index_opt k '/' with
  | Some i -> Some (String.sub k 0 i)
  | None -> None

let is_temp_ns (k : string) : bool =
  match attr_namespace k with
  | Some ns -> String.equal ns "block.temp"
  | None -> false

(* db.cljs entity->db-id — resolves datascript/Entity tagged values to
   their :db/id. *)
let rec entity_to_db_id (w : Wire.t) : Wire.t =
  match w with
  | Wire.Tagged ("datascript/Entity", (Wire.Map _ as m)) ->
      (match Wire.get "db/id" m with
       | Some v -> v
       | None ->
           invalid_arg "ldb/transact! doesn't support Entity")
  | Wire.Array xs -> Wire.Array (List.map entity_to_db_id xs)
  | Wire.List xs -> Wire.List (List.map entity_to_db_id xs)
  | Wire.Map kvs ->
      Wire.Map (List.map (fun (k, v) -> (k, entity_to_db_id v)) kvs)
  | Wire.Set xs -> Wire.Set (List.map entity_to_db_id xs)
  | _ -> w

let wire_map_pred (w : Wire.t) : bool =
  match w with Wire.Map _ -> true | _ -> false

(* common-util/remove-nils-non-nested *)
let remove_nils_non_nested (m : Wire.t) : Wire.t =
  match m with
  | Wire.Map kvs ->
      Wire.Map
        (List.filter
           (fun (_, v) -> match v with Wire.Nil -> false | _ -> true)
           kvs)
  | _ -> m

(* db.cljs remove-temp-block-data *)
let remove_temp_block_data (tx_data : Wire.t list) : Wire.t list =
  let remove_block_temp_f (m : Wire.t) : Wire.t =
    match m with
    | Wire.Map kvs ->
        Wire.Map
          (List.filter
             (fun (k, _) ->
                match k with
                | Wire.Keyword s | Wire.String s -> not (is_temp_ns s)
                | _ -> true)
             kvs)
    | _ -> m
  in
  List.filter_map
    (fun data ->
       match data with
       | Wire.Map _ ->
           let m = remove_block_temp_f data in
           (match Wire.get "block/refs" m with
            | Some (Wire.Array refs | Wire.List refs) ->
                let refs' =
                  Wire.Array
                    (List.map
                       (fun r -> if wire_map_pred r then remove_block_temp_f r else r)
                       refs)
                in
                Some (Cljs_map.assoc m "block/refs" refs')
            | _ -> Some m)
       | Wire.Array xs ->
           (match xs with
            | Wire.Keyword op :: _
              when (String.equal op "db/add" || String.equal op "db/retract")
                   && List.length xs > 2
                   && (match List.nth_opt xs 2 with
                       | Some (Wire.Keyword a) -> is_temp_ns a
                       | _ -> false) ->
                None
            | _ -> Some data)
       | _ -> Some data)
    tx_data

let is_empty_item (w : Wire.t) : bool =
  match w with
  | Wire.Map [] | Wire.Array [] | Wire.List [] | Wire.Set [] -> true
  | Wire.Nil -> true
  | _ -> false

(* ---------- delete-blocks machinery ---------- *)

(* delete-blocks/tx-entity-id — resolves int eids and lookup-vec refs *)
let tx_entity_id db (v : Wire.t) : int option =
  match v with
  | Wire.Int n -> Some n
  | Wire.Int64 n -> Some (Int64.to_int n)
  | Wire.Array [ Wire.Keyword a; v ] ->
      (match Ldb.ent_of_ref db (Lookup_ref (a, Ds_wire.value_of_transit v)) with
       | Some e -> Some e.id
       | None -> None)
  | _ -> None

let entity_ref_of_wire (v : Wire.t) : entity_ref option =
  match v with
  | Wire.Int n -> Some (Entity_id n)
  | Wire.Int64 n -> Some (Entity_id (Int64.to_int n))
  | Wire.Keyword s -> Some (Ident s)
  | Wire.Uuid s -> Some (Lookup_ref ("block/uuid", Uuid s))
  | Wire.Array [ Wire.Keyword a; v ] ->
      Some (Lookup_ref (a, Ds_wire.value_of_transit v))
  | _ -> None

(* delete-blocks/retracted-entities — entities retracted by
   [:db/retractEntity e] or [:db.fn/retractEntity e] items. *)
let retracted_entities db (txs : Wire.t list) : entity list =
  List.filter_map
    (fun tx ->
       match tx with
       | Wire.Array (Wire.Keyword op :: ref :: _)
         when String.equal op "db.fn/retractEntity"
              || String.equal op "db/retractEntity" ->
           (match entity_ref_of_wire ref with
            | Some r -> Ldb.ent_of_ref db r
            | None -> None)
       | _ -> None)
    txs
  |> fun es ->
     List.fold_left
       (fun acc e ->
          if List.exists (fun x -> x.id = e.id) acc then acc else acc @ [ e ])
       [] es

let property_history_ref_attrs =
  [ "logseq.property.history/block"; "logseq.property.history/property";
    "logseq.property.history/ref-value" ]

(* delete-blocks/property-history-entity? — works on entities and
   plain tx maps alike. *)
let property_history_entity (get_attr : string -> bool) : bool =
  get_attr "logseq.property.history/block"
  || get_attr "logseq.property.history/property"
  || get_attr "logseq.property.history/ref-value"
  || get_attr "logseq.property.history/scalar-value"

let property_history_entity_e (e : entity) : bool =
  property_history_entity (fun a -> Option.is_some (Ldb.value e a))

let property_history_map (m : Wire.t) : bool =
  property_history_entity (fun a -> Cljs_map.contains m a)

(* delete-blocks/property-history-ref-retracted-entities *)
let property_history_ref_retracted_entities db (txs : Wire.t list) : entity list =
  List.filter_map
    (fun tx ->
       match tx with
       | Wire.Array (Wire.Keyword "db/retract" :: e :: a :: _)
         when List.exists
                (fun h ->
                   match a with
                   | Wire.Keyword s -> String.equal s h
                   | _ -> false)
                property_history_ref_attrs ->
           (match entity_ref_of_wire e with
            | Some r ->
                (match Ldb.ent_of_ref db r with
                 | Some ent when property_history_entity_e ent -> Some ent
                 | _ -> None)
            | None -> None)
       | _ -> None)
    txs

(* delete-blocks/vector-adds-by-eid *)
let vector_adds_by_eid (txs : Wire.t list) : (int * (string * Wire.t) list) list =
  List.fold_left
    (fun acc tx ->
       match tx with
       | Wire.Array
           [ Wire.Keyword "db/add"; Wire.Int e; Wire.Keyword a; v ] ->
           let prev =
             match List.assoc_opt e acc with Some m -> m | None -> []
           in
           (e, (a, v) :: List.remove_assoc a prev)
           :: List.remove_assoc e acc
       | Wire.Array
           [ Wire.Keyword "db/add"; Wire.Int64 e; Wire.Keyword a; v ] ->
           let e = Int64.to_int e in
           let prev =
             match List.assoc_opt e acc with Some m -> m | None -> []
           in
           (e, (a, v) :: List.remove_assoc a prev)
           :: List.remove_assoc e acc
       | _ -> acc)
    [] txs

let property_history_ref_retracted_ids (txs : Wire.t list) : int list =
  List.filter_map
    (fun tx ->
       match tx with
       | Wire.Array (Wire.Keyword "db/retract" :: e :: a :: _)
         when List.exists
                (fun h ->
                   match a with
                   | Wire.Keyword s -> String.equal s h
                   | _ -> false)
                property_history_ref_attrs ->
           (match e with
            | Wire.Int n -> Some n
            | Wire.Int64 n -> Some (Int64.to_int n)
            | _ -> None)
       | _ -> None)
    txs

(* delete-blocks/new-property-history-retract-tx *)
let new_property_history_retract_tx db (txs : Wire.t list)
    (retracted_ids : int list) : Wire.t list =
  let referencing_retracted (getv : string -> Wire.t option) : bool =
    List.exists
      (fun a ->
         match getv a with
         | Some v ->
             (match tx_entity_id db v with
              | Some id -> List.mem id retracted_ids
              | None -> false)
         | None -> false)
      property_history_ref_attrs
  in
  let map_retract_tx =
    List.filter_map
      (fun tx ->
         match tx with
         | Wire.Map _ ->
             let getv a = Wire.get a tx in
             (match getv "block/uuid" with
              | Some u
                when property_history_map tx && referencing_retracted getv ->
                  Some
                    (vec
                       [ kw "db/retractEntity";
                         Wire.Array [ kw "block/uuid"; u ] ])
              | _ -> None)
         | _ -> None)
      txs
  in
  let retracted_history_ref_ids = property_history_ref_retracted_ids txs in
  let vector_retract_tx =
    List.filter_map
      (fun (eid, attrs) ->
         let m = Wire.Map (List.map (fun (k, v) -> (Wire.Keyword k, v)) attrs) in
         let getv a = Wire.get a m in
         if Wire.get "block/uuid" m <> None
            && property_history_map m
            && (List.mem eid retracted_history_ref_ids
                || referencing_retracted getv)
         then Some (vec [ kw "db/retractEntity"; Wire.Int eid ])
         else None)
      (vector_adds_by_eid txs)
  in
  List.fold_left
    (fun acc t -> if List.exists (fun x -> x = t) acc then acc else acc @ [ t ])
    [] (map_retract_tx @ vector_retract_tx)

(* delete-blocks/block-entity? *)
let block_entity (e : entity) : bool =
  Option.is_some (Ldb.value e "block/uuid")
  && Option.is_some (Ldb.value e "block/page")
  && not (Ldb.is_page e)

(* delete-blocks/block-subtree-entities — BFS over raw children
   (:block/_raw-parent = all :block/parent children). *)
let block_subtree_entities (root : entity) : entity list =
  let rec go pending seen acc =
    match pending with
    | [] -> List.rev acc
    | e :: rest ->
        if e.id = 0 || List.mem e.id seen then go rest seen acc
        else
          let children =
            List.of_seq
              (datoms e.db Aevt ~a:"block/parent"
                 ~v:(Ref e.id) ())
            |> List.filter_map (fun d -> Ldb.ent_of_id e.db d.e)
            |> List.filter block_entity
          in
          go (rest @ children) (e.id :: seen) (e :: acc)
  in
  go [ root ] [] []

(* delete-blocks/expand-delete-blocks-tx *)
let expand_delete_blocks_tx db (txs : Wire.t list) (tx_meta : tx_meta)
    : Wire.t list =
  let outliner_op =
    match List.assoc_opt "outliner-op" tx_meta with
    | Some (Keyword k) -> Some k
    | _ -> None
  in
  if outliner_op = Some "delete-blocks" then
    let subtree_tx =
      retracted_entities db txs
      |> List.filter block_entity
      |> List.map block_subtree_entities
      |> List.concat
      |> List.map (fun e -> vec [ kw "db/retractEntity"; Wire.Int e.id ])
    in
    List.fold_left
      (fun acc t -> if List.exists (fun x -> x = t) acc then acc else acc @ [ t ])
      [] (txs @ subtree_tx)
  else txs

(* delete-blocks/replace-ref-with-deleted-block-title *)
let replace_ref_with_deleted_block_title (block : entity)
    (raw_title : string) : string =
  let block_content =
    if Ldb.asset block then ""
    else
      match Ldb.raw_title block.db block with
      | Some (String s) -> s
      | _ -> ""
  in
  let uuid_str =
    match Ldb.value block "block/uuid" with
    | Some (Uuid u) -> u
    | Some (String s) -> s
    | _ -> ""
  in
  let title = raw_title in
  let escape s =
    String.concat ""
      (List.map
         (fun c ->
            if String.contains "()[]{}^$.|?*+\\" c then
              Printf.sprintf "\\%c" c
            else String.make 1 c)
         (List.of_seq (String.to_seq s)))
  in
  let sub_first pat s =
    Regexp.replace (Regexp.compile pat)
      ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> block_content)
      s
  in
  (* cljs string/replace on a string replaces every occurrence in one
     pass over the original (inserted text is not re-scanned) *)
  let sub_all needle s =
    let nl = String.length needle in
    let buf = Buffer.create (String.length s) in
    let rec scan i =
      if i + nl > String.length s then
        Buffer.add_string buf (String.sub s i (String.length s - i))
      else if String.sub s i nl = needle then begin
        Buffer.add_string buf block_content;
        scan (i + nl)
      end else begin
        Buffer.add_char buf s.[i];
        scan (i + 1)
      end
    in
    scan 0;
    Buffer.contents buf
  in
  (* embed uses a regex (first match; caseless Regexp covers (?i));
     block-ref and page-ref use plain strings (all matches) *)
  let title =
    sub_first
      (Printf.sprintf "\\{\\{embed \\(\\(%s\\)\\)\\s?\\}\\}" (escape uuid_str))
      title
  in
  let title = sub_all ("((" ^ uuid_str ^ "))") title in
  let title = sub_all ("[[" ^ uuid_str ^ "]]") title in
  title

(* delete-blocks/build-retracted-tx *)
let build_retracted_tx ?(extra_retract_ids : int list = [])
    (retracted_blocks : entity list) : Wire.t list =
  let refs =
    retracted_blocks
    |> List.map (fun b ->
           List.of_seq
             (datoms b.db Aevt ~a:"block/refs" ~v:(Ref b.id) ())
           |> List.map (fun d -> d.e))
    |> List.concat
    |> List.filter_map (fun id ->
           match retracted_blocks with
           | [] -> None
           | b :: _ -> Ldb.ent_of_id b.db id)
    |> List.fold_left
         (fun acc e ->
            if List.exists (fun x -> x.id = e.id) acc then acc else acc @ [ e ])
         []
  in
  let retract_ids =
    List.sort_uniq compare
      (List.map (fun b -> b.id) retracted_blocks @ extra_retract_ids)
  in
  List.concat_map
    (fun ref_e ->
       let id = ref_e.id in
       let replaced_title =
         if List.mem id retract_ids then None
         else
           match Ldb.raw_title ref_e.db ref_e with
           | Some (String rt) ->
               Some
                 (List.fold_left
                    (fun rt block ->
                       replace_ref_with_deleted_block_title block rt)
                    rt retracted_blocks)
           | _ -> None
       in
       let tx =
         List.concat_map
           (fun block ->
              [ vec
                  [ kw "db/retract"; Wire.Int id; kw "block/refs";
                    Wire.Int block.id ] ])
           retracted_blocks
       in
       match replaced_title with
       | Some t -> tx @ [ vec [ kw "db/add"; Wire.Int id; kw "block/title";
                                Wire.String t ] ]
       | None -> tx)
    refs

(* reverse-ref scans: entities whose [a] points at e *)
let reverse_refs (db : db) (attr : string) (target : entity_id) : entity list =
  List.of_seq (datoms db Aevt ~a:attr ~v:(Ref target) ())
  |> List.filter_map (fun d -> Ldb.ent_of_id db d.e)

(* delete-blocks/direct-cleanup-tx *)
let direct_cleanup_tx db (entities : entity list) : Wire.t list =
  let retracted_blocks = List.filter block_entity entities in
  let history_self = List.filter property_history_entity_e entities in
  let history_self_tx =
    List.map
      (fun e -> vec [ kw "db/retractEntity"; Wire.Int e.id ])
      history_self
  in
  let reaction_entities =
    List.concat_map
      (fun e -> reverse_refs db "logseq.property.reaction/target" e.id)
      entities
    |> List.fold_left
         (fun acc e ->
            if List.exists (fun x -> x.id = e.id) acc then acc else acc @ [ e ])
         []
  in
  let retract_reactions_tx =
    List.map
      (fun e -> vec [ kw "db/retractEntity"; Wire.Int e.id ])
      reaction_entities
  in
  let view_entities =
    List.concat_map
      (fun e -> reverse_refs db "logseq.property/view-for" e.id)
      entities
    |> List.fold_left
         (fun acc e ->
            if List.exists (fun x -> x.id = e.id) acc then acc else acc @ [ e ])
         []
  in
  let history_entities =
    List.concat_map
      (fun e ->
         reverse_refs db "logseq.property.history/block" e.id
         @ reverse_refs db "logseq.property.history/property" e.id
         @ reverse_refs db "logseq.property.history/ref-value" e.id)
      entities
    |> List.fold_left
         (fun acc e ->
            if List.exists (fun x -> x.id = e.id) acc then acc else acc @ [ e ])
         []
  in
  let retract_history_tx =
    List.map
      (fun e -> vec [ kw "db/retractEntity"; Wire.Int e.id ])
      history_entities
  in
  let cleanup_retract_ids =
    history_self @ reaction_entities @ view_entities @ history_entities
    |> List.map (fun e -> e.id)
  in
  let retracted_tx =
    build_retracted_tx ~extra_retract_ids:cleanup_retract_ids retracted_blocks
  in
  let delete_views =
    List.map
      (fun e -> vec [ kw "db/retractEntity"; Wire.Int e.id ])
      view_entities
  in
  retracted_tx @ delete_views @ history_self_tx @ retract_history_tx
  @ retract_reactions_tx

(* delete-blocks/build-cleanup-tx *)
let build_cleanup_tx db (txs : Wire.t list) : Wire.t list =
  let initial_entities =
    retracted_entities db txs
    @ property_history_ref_retracted_entities db txs
  in
  let initial_ids = List.map (fun e -> e.id) initial_entities in
  let rec loop pending seen cleanup_tx =
    let entities = List.filter (fun e -> not (List.mem e.id seen)) pending in
    match entities with
    | [] -> cleanup_tx
    | _ ->
        let seen' = List.map (fun e -> e.id) entities @ seen in
        let next_tx = direct_cleanup_tx db entities in
        loop (retracted_entities db next_tx) seen' (cleanup_tx @ next_tx)
  in
  loop initial_entities []
    (new_property_history_retract_tx db txs initial_ids)
  |> fun txs ->
     List.fold_left
       (fun acc t -> if List.exists (fun x -> x = t) acc then acc else acc @ [ t ])
       [] txs

(* delete-blocks/update-refs-history *)
let update_refs_history db (txs : Wire.t list) : Wire.t list =
  build_cleanup_tx db txs

(* ---------- transact! ---------- *)

(* db.cljs transact! tx-data normalization, steps in cljs order *)
let normalize_tx_data (tx_data : Wire.t list) : Wire.t list =
  let dissoc_keys =
    [ "block/children"; "block/meta"; "block/top?"; "block/bottom?";
      "block/anchor"; "block/level"; "block/container"; "db/other-tx";
      "block/unordered"; "block.temp/load-status" ]
  in
  tx_data
  |> List.map entity_to_db_id
  |> List.map
       (fun m ->
          match m with
          | Wire.Map _ -> Cljs_map.dissoc_list m dissoc_keys
          | _ -> m)
  |> remove_temp_block_data
  |> List.filter
       (fun m ->
          match m with
          | Wire.Map _ ->
              (match Wire.get "db/ident" m with
               | Some (Wire.Keyword "block/path-refs") -> false
               | _ -> true)
          | _ -> true)
  |> List.map
       (fun m ->
          match m with Wire.Map _ -> remove_nils_non_nested m | _ -> m)
  |> List.filter
       (fun m ->
          match m with
          | Wire.Int _ | Wire.Int64 _ -> false
          | _ -> not (is_empty_item m))

(* cljs datascript transact-add: an explicit-tx [op e a v tx] resolves e
   (and ref-typed v) through entid-strict at apply time — against the
   evolving db-after, so entities created earlier in the same tx resolve.
   The EDN reader only accepts plain entity ids there, so ref-shaped e/v
   are deferred into a Call that resolves them at apply time. A string e
   is a tempid: upstream drops the explicit tx in that branch. *)
let unresolved_entity_ref (w : Wire.t) : 'a =
  invalid_arg
    ("unresolvable entity reference in tx-data: " ^ Ds_wire.edn_of_transit w)

let entid_strict (db : db) (w : Wire.t) : entity_id =
  match entity_ref_of_wire w with
  | Some r -> (
      match Datascript.entid_ref db r with
      | Some id -> id
      | None -> unresolved_entity_ref w)
  | None -> unresolved_entity_ref w

let tx_ref_attr (db : db) (attr : attr) : bool =
  Schema.schema_attr_is_ref (Datascript.schema db) attr
  || Db_normalize.entity_value_type_ref db attr

let datom_form_tx_ops (op : Wire.t) (e : Wire.t) (a : Wire.t) (v : Wire.t)
    (t : Wire.t) : tx_op list option =
  match op, t with
  | Wire.Keyword ("db/add" | "db/retract"), Wire.Int tx -> (
      let added = op = kw "db/add" in
      let attr = match a with Wire.Keyword s -> s | _ -> "" in
      match e with
      | Wire.Int _ | Wire.Int64 _ -> None
      | Wire.String s ->
          Some
            [ (if added
               then Add (Temp_id s, attr, Ds_wire.value_of_transit v)
               else
                 Retract (Temp_id s, attr, Some (Ds_wire.value_of_transit v)))
            ]
      | _ ->
          Some
            [ Call
                (fun db ->
                   (* upstream datascript: [:db/add e a v t] resolves e
                      through entid-strict, but [:db/retract e a v t] uses
                      non-strict entid — an unresolvable e skips the op
                      entirely (if-some ... (recur report entities)). *)
                   let eid_opt =
                     match entity_ref_of_wire e with
                     | Some r -> Datascript.entid_ref db r
                     | None -> None
                   in
                   match eid_opt with
                   | None ->
                       if added then unresolved_entity_ref e else []
                   | Some eid ->
                   let v' =
                     match v with
                     (* cljs (and (ref? db a) (tempid? v)): a value tempid
                        string resolves to its allocated eid — the entity's
                        own add op runs earlier in the same tx, so its
                        block/uuid or db/ident is already searchable *)
                     | Wire.String s when tx_ref_attr db attr -> (
                         match
                           ( Datascript.entid db "block/uuid" (Uuid s)
                           , Datascript.entid db "db/ident" (Keyword s) )
                         with
                         | Some id, _ | _, Some id -> Ref id
                         | _ -> String s)
                     | Wire.Array _ | Wire.List _ | Wire.Keyword _ | Wire.Uuid _
                       when tx_ref_attr db attr -> Ref (entid_strict db v)
                     | _ -> Ds_wire.value_of_transit v
                   in
                   [ Raw_datom
                       (Datascript.datom ~tx ~added ~e:eid ~a:attr ~v:v' ()) ])
            ])
  | _ -> None

let tx_ops_of_tx_data (db : db) (tx_data : Wire.t list) : tx_op list =
  List.concat_map
    (fun item ->
       match item with
       (* cljs raw (d/datom ...) records in tx-data; the sanitize round-trip
          flattens them to [datascript/Datom [e a v tx]] vectors *)
       | Wire.Tagged ("datascript/Datom", _) ->
           [ Raw_datom (Ds_wire.datom_of_transit item) ]
       | Wire.Array [ Wire.Symbol "datascript/Datom"; rep ]
       | Wire.List [ Wire.Symbol "datascript/Datom"; rep ] ->
           [ Raw_datom (Ds_wire.datom_of_transit rep) ]
       | Wire.Map _ ->
           (* cljs maybe-wrap-multival runs schema-aware inside the entity
              expansion: a collection on a card-one attr stays a single
              datom (e.g. :logseq.property.table/sorting keeps its
              vector), only multival attrs explode. Route through
              Block_map.to_tx_op which classifies against the live schema;
              the schema-blind parse_tx_data_string reader would collapse
              every coll-of-maps to nested entities (wrapped as a Set on
              non-ref attrs). *)
           [ Block_map.to_tx_op db (Block_map.of_transit item) ]
       | Wire.Array [ op; e; a; v; t ] | Wire.List [ op; e; a; v; t ] -> (
           match datom_form_tx_ops op e a v t with
           | Some ops -> ops
           | None -> Datascript.parse_tx_data_string (tx_edn [ item ]))
       | _ -> Datascript.parse_tx_data_string (tx_edn [ item ]))
    tx_data

let transact (conn : conn) (tx_data : Wire.t list) (tx_meta : tx_meta)
    : tx_report option =
  let tx_data = normalize_tx_data tx_data in
  let db = Datascript.db conn in
  let tx_data = expand_delete_blocks_tx db tx_data tx_meta in
  let delete_blocks_tx = update_refs_history db tx_data in
  let tx_data = tx_data @ delete_blocks_tx in
  match tx_data with
  | [] -> None
  | _ ->
      let flags = Db_tx.flags_of conn in
      let tx_meta =
        (* cljs transact-sync tags from *batch-tx-report?* (dynamic var
           bound inside batch-transact!), not the conn :batch-tx? attr *)
        (if !Db_tx.inside_batch_tx
         then ("batch-tx-report?", Bool true) :: tx_meta
         else tx_meta)
        |> fun m ->
        if flags.Db_tx.skip_store then ("skip-store?", Bool true) :: m else m
      in
      let tx_ops = tx_ops_of_tx_data db tx_data in
      Some (Db_tx.transact_sync conn tx_ops tx_meta)

(* db.cljs batch-transact-with-temp-conn!. [f] receives the temp conn;
   datoms emitted by its transacts are collected and applied to [conn]
   in a single final transact. *)
let batch_transact_with_temp_conn (conn : conn) (tx_meta : tx_meta)
    (f : conn -> unit) : tx_report option =
  (* cljs temp-conn-from-db: {:skip-store? :skip-validate-db?} — strip
     storage so conn_from_db neither stores on creation nor lets inner
     batch ops write tails to the real storage. *)
  let temp_conn =
    conn_from_db { (Datascript.db conn) with storage_ref = None }
  in
  let fl = Db_tx.flags_of temp_conn in
  fl.Db_tx.batch_tx <- true;
  fl.Db_tx.skip_store <- true;
  fl.Db_tx.skip_validate <- true;
  let collected = ref [] in
  let listener_id =
    listen temp_conn "temp-conn-batch-tx"
      (fun report -> collected := !collected @ report.tx_data)
  in
  (try
     f temp_conn
   with e ->
     unlisten temp_conn listener_id;
     raise e);
  unlisten temp_conn listener_id;
  (match !collected with
   | [] -> None
   | datoms ->
       let items =
         List.map
           (fun (d : datom) ->
              vec
                [ kw (if d.added then "db/add" else "db/retract");
                  Wire.Int d.e; kw d.a;
                  Ds_wire.transit_of_value d.v ])
           datoms
       in
       transact conn items tx_meta)

(* test hook — cljs tests rebind ldb/transact! *)
let transact_fn = ref transact
