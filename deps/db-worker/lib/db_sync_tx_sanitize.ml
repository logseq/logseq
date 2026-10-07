(* logseq.db-sync.tx-sanitize — sanitize raw tx items (entity-op vectors and
   entity maps, as datascript `value`s) before applying remote txs. *)

open Datascript

let retract_entity_ops = [ "db/retractEntity"; "db.fn/retractEntity" ]
let entity_op_kinds = [ "db/add"; "db/retract"; "db/cas"; "db.fn/cas" ]
let encrypted_attrs = [ "block/title"; "block/name" ]

let migration_deleted_attrs =
  [ "block/path-refs"; "block/pre-block?"
  ; "logseq.property.embedding/hnsw-label"
  ; "logseq.property.embedding/hnsw-label-updated-at" ]

let vec_items = function
  | Vector xs | List xs -> Some xs
  | _ -> None

let item_op = function
  | Vector (Keyword op :: _) | List (Keyword op :: _) -> Some op
  | _ -> None

let retract_entity_op item =
  match vec_items item with
  | Some [ op; _e ] ->
      (match op with Keyword k -> List.mem k retract_entity_ops | _ -> false)
  | _ -> false

let entity_op item =
  match vec_items item with
  | Some ((Keyword op :: _) as xs) ->
      List.length xs >= 4 && List.mem op entity_op_kinds
  | _ -> false

let nth_opt xs i = List.nth_opt xs i

let map_get (k : string) = function
  | Map kvs ->
      List.assoc_opt k
        (List.filter_map
           (fun (k, v) -> match k with Keyword s -> Some (s, v) | _ -> None)
           kvs)
  | _ -> None

let entity_ref_of_value = function
  | Int64 n -> Option.map (fun n -> Entity_id n) (Datascript.Util.int64_to_int n)
  | Ref n -> Some (Entity_id n)
  | Keyword s -> Some (Ident s)
  | Vector [ Keyword a; v ] | List [ Keyword a; v ] -> Some (Lookup_ref (a, v))
  | _ -> None

let entity_ref_to_eid (db : db) (r : value) : entity_id option =
  match r with
  | Int64 n when Int64.compare n 0L < 0 -> None
  | v ->
      (match entity_ref_of_value v with
       | Some r ->
           (match (try entity db r with _ -> None) with
            | Some e -> Some e.id
            | None -> None)
       | None -> None)

module Value_set = Set.Make (struct
  type t = value
  let compare = compare
end)

module Int_set = Set.Make (Int)

let ignored_kv_entities : Value_set.t =
  Value_set.of_list
    (List.map (fun s -> Keyword s)
       Sync_const.ignore_entities_when_init_upload)

let is_ignored_ident v = Value_set.mem v ignored_kv_entities

let tx_ignored_kv_entity_refs (tx_data : value list) : Value_set.t =
  List.fold_left
    (fun acc item ->
       match item with
       | Map _ ->
           (match map_get "db/ident" item with
            | Some ident when is_ignored_ident ident ->
                (match map_get "db/id" item with
                 | Some id -> Value_set.add id acc
                 | None -> acc)
            | _ -> acc)
       | _ ->
           if entity_op item then
             match vec_items item with
             | Some (_op :: e :: Keyword "db/ident" :: v :: _)
               when is_ignored_ident v -> Value_set.add e acc
             | _ -> acc
           else acc)
    ignored_kv_entities tx_data

let entity_ident db eid =
  match entity db (Entity_id eid) with
  | Some ent ->
      (match Ldb.value ent "db/ident" with Some (Keyword s) -> Some s | _ -> None)
  | None -> None

let ignored_kv_entity_ref db ignored_refs (r : value) : bool =
  Value_set.mem r ignored_refs
  || (match entity_ref_to_eid db r with
      | Some eid ->
          (match entity_ident db eid with
           | Some ident -> is_ignored_ident (Keyword ident)
           | None -> false)
      | None -> false)

let ignored_kv_entity_op db ignored_refs item : bool =
  match item with
  | Map _ ->
      (match map_get "db/id" item with
       | Some id -> ignored_kv_entity_ref db ignored_refs id
       | None -> false)
  | _ ->
      if retract_entity_op item then
        match vec_items item with
        | Some [ _; e ] -> ignored_kv_entity_ref db ignored_refs e
        | _ -> false
      else if entity_op item then
        match vec_items item with
        | Some (_ :: e :: _) -> ignored_kv_entity_ref db ignored_refs e
        | _ -> false
      else false

let strip_ignored_kv_entity_ops db tx_data =
  let ignored = tx_ignored_kv_entity_refs tx_data in
  List.filter (fun item -> not (ignored_kv_entity_op db ignored item)) tx_data

let drop_ops_on_retracted_entities db tx_data =
  let retract_eids =
    List.fold_left
      (fun acc item ->
         match vec_items item with
         | Some [ op; e ] when
             (match op with
              | Keyword k -> List.mem k retract_entity_ops
              | _ -> false) ->
             (match entity_ref_to_eid db e with
              | Some eid -> Int_set.add eid acc
              | None -> acc)
         | _ -> acc)
      Int_set.empty tx_data
  in
  if Int_set.is_empty retract_eids then tx_data
  else
    List.filter
      (fun item ->
         not
           (entity_op item
            && (match vec_items item with
                | Some (_ :: e :: _) ->
                    (match entity_ref_to_eid db e with
                     | Some eid -> Int_set.mem eid retract_eids
                     | None -> false)
                | _ -> false)))
      tx_data

let strip_migration_deleted_attrs tx_data =
  List.filter
    (fun item ->
       not
         (entity_op item
          && (match vec_items item with
              | Some (_ :: _ :: Keyword a :: _) ->
                  List.mem a migration_deleted_attrs
              | _ -> false)))
    tx_data

let drop_conflicted_encrypted_retracts tx_data =
  let groups = Hashtbl.create 31 in
  List.iter
    (fun item ->
       match vec_items item with
       (* cljs (<= 4 (count item)) — 5+ element tx items count too *)
       | Some (Keyword op :: e :: Keyword a :: v :: _)
         when List.mem op entity_op_kinds && List.mem a encrypted_attrs ->
           let key = (e, a, v) in
           let entry =
             match Hashtbl.find_opt groups key with
             | Some (s, l) -> (s, l)
             | None -> ([], [])
           in
           Hashtbl.replace groups key (op :: fst entry, item :: snd entry)
       | _ -> ())
    tx_data;
  let conflicted =
    Hashtbl.fold
      (fun k (ops, _) acc ->
         if List.mem "db/add" ops && List.mem "db/retract" ops then
           k :: acc
         else acc)
      groups []
  in
  match conflicted with
  | [] -> tx_data
  | _ ->
      List.filter
        (fun item ->
           match vec_items item with
           | Some (Keyword "db/retract" :: e :: Keyword a :: v :: _) ->
               not (List.mem (e, a, v) conflicted)
           | _ -> true)
        tx_data

(* cljs bookkeeping-attrs — safe to drop when their target entity
   doesn't exist on the server. Stamping them on a retracted eid would
   resurrect an invalid ghost entity (e.g. only {:block/updated-at}),
   which then fails validation and rejects the tx. *)
let bookkeeping_stamp_attrs =
  [ "block/created-at"; "block/updated-at"; "block/order" ]

(* cljs missing-positive-eid? *)
let missing_positive_eid db = function
  | Int64 n ->
      Int64.compare n 0L > 0
      && (match Datascript.Util.int64_to_int n with
          | Some i ->
              (match entity db (Entity_id i) with
               | Some _ -> false
               | None -> true)
          | None -> true)
  | _ -> false

(* cljs drop-stamps-on-missing-entities — drops stamp ops (`[:db/add e
   bookkeeping-attr v]` and entity maps carrying only bookkeeping attrs)
   whose target eid has no entity in db. Synced txs carry raw eids that
   can go stale when another client deleted the entity; writing them
   would resurrect a ghost entity that fails validation. *)
let drop_stamps_on_missing_entities db tx_data =
  List.filter
    (fun item ->
       not
         (match item with
          | Map kvs ->
              (match map_get "db/id" item with
               | Some id ->
                   missing_positive_eid db id
                   && List.for_all
                        (fun (k, _v) ->
                           match k with
                           | Keyword s ->
                               s = "db/id"
                               || List.mem s bookkeeping_stamp_attrs
                           | _ -> false)
                        kvs
               | None -> false)
          | _ ->
              (match vec_items item with
               | Some (Keyword "db/add" :: e :: Keyword a :: _ :: _rest)
                 when List.mem a bookkeeping_stamp_attrs ->
                   missing_positive_eid db e
               | _ -> false)))
    tx_data

let touched_entity_eid db item : entity_id option =
  match item with
  | Map _ ->
      (match map_get "db/id" item with
       | Some id -> entity_ref_to_eid db id
       | None ->
           (match map_get "block/uuid" item with
            | Some u -> entity_ref_to_eid db (Vector [ Keyword "block/uuid"; u ])
            | None -> None))
  | _ ->
      if entity_op item then
        match vec_items item with
        | Some (_ :: e :: _) -> entity_ref_to_eid db e
        | _ -> None
      else None

(* cljs (when (:block/uuid entity) ...) — any truthy block/uuid counts *)
let entity_has_uuid db eid =
  match entity db (Entity_id eid) with
  | Some ent ->
      (match Ldb.value ent "block/uuid" with
       | Some (Bool false) | None -> false
       | Some _ -> true)
  | None -> false

(* :block/page is a materialized denormalization of the :block/parent
   chain. Concurrent clients produce verbatim writes whose page no
   longer matches the converged parent chain — a child created under a
   block while a cross-page move of that block was still in flight ships
   the ancestor's pre-move page, and nothing ever re-derives it, so the
   stale value lands identically on every replica while the block
   disappears from :avet :block/page queries. The parent chain is
   authoritative, so derive each touched entity's page from its
   effective (post-tx) parent — parent's own correction first, then its
   verbatim attr, then the parent entity itself (the
   get_target_block_page :db/id fallback used for non-page parents like
   properties) — and append correction datoms. Every apply boundary
   (server ingest, client pull, pending-tx confirm) runs the same
   derivation on the same (tx, db-before) inputs, so replicas stay
   identical and checksums keep matching the server image. *)
let derive_block_page_fixups (db : db) (tx_data : value list)
    (dead : Int_set.t) : value list =
  (* e-positions in one tx take several forms — bare uuid strings,
     [:block/uuid u] lookup-refs, raw eids — all denoting the same
     entity, and the derive recursion below walks db parents as Ref
     eids. Keying the overlay tables by the raw item value makes an
     in-tx write invisible whenever the same entity shows up under a
     different representation (a reparented parent then falls back to
     its stale db parent and the child derives the pre-move page).
     Key everything by the resolved eid, falling back to the uuid for
     entities not yet in db. *)
  let eid_of (v : value) : entity_id option = entity_ref_to_eid db v in
  let key_of (v : value) : value =
    match eid_of v with
    | Some e -> Ref e
    | None -> (
        match v with
        | Vector [ Keyword "block/uuid"; (Uuid _ as u) ]
        | List [ Keyword "block/uuid"; (Uuid _ as u) ] -> u
        | String s when Ldb.is_uuid_string s -> Uuid s
        | _ -> v)
  in
  let parent_of : (value, value) Hashtbl.t = Hashtbl.create 8 in
  let page_of : (value, value) Hashtbl.t = Hashtbl.create 8 in
  (* retracts mask per attr, not per entity: a page retract (the normal
     retract-then-add shape of every children-page fix) must not make
     the entity's parent look cleared — derive would return None and
     the verbatim page would skip the correction gate *)
  let retracted_parents : (value, unit) Hashtbl.t = Hashtbl.create 8 in
  let retracted_pages : (value, unit) Hashtbl.t = Hashtbl.create 8 in
  let dead_evals : (value, unit) Hashtbl.t = Hashtbl.create 8 in
  let pageish : (value, unit) Hashtbl.t = Hashtbl.create 8 in
  let attr_of (v : value) : string =
    match v with Keyword s | String s -> s | _ -> ""
  in
  let op_of (v : value) : string =
    match v with Keyword s | String s -> s | _ -> ""
  in
  List.iter
    (fun item ->
       match item with
       | Map _ -> (
           match map_get "db/id" item with
           | Some e -> (
               (match map_get "block/parent" item with
                | Some v when entity_ref_of_value v <> None ->
                    Hashtbl.replace parent_of (key_of e) v
                | Some Nil -> Hashtbl.replace retracted_parents (key_of e) ()
                | _ -> ());
               (match map_get "block/page" item with
                | Some v when entity_ref_of_value v <> None ->
                    Hashtbl.replace page_of (key_of e) v
                | Some Nil -> Hashtbl.replace retracted_pages (key_of e) ()
                | _ -> ());
               if map_get "block/name" item <> None
                  || map_get "db/ident" item <> None
               then Hashtbl.replace pageish (key_of e) ())
           | None -> ())
       | Vector l | List l when List.length l >= 2 -> (
           let e = List.nth l 1 in
           if retract_entity_op item then
             Hashtbl.replace dead_evals (key_of e) ()
           else begin
             let op = op_of (List.nth l 0) in
             let a =
               match List.nth_opt l 2 with
               | Some av -> attr_of av
               | None -> ""
             in
             (match a with
              | "block/parent" | "block/page" -> (
                  (* db/cas carries the new value at index 4 *)
                  let idx =
                    if op = "db/cas" || op = "db.fn/cas" then 4 else 3
                  in
                  match List.nth_opt l idx with
                  | Some v -> (
                      if op = "db/retract" then
                        Hashtbl.replace
                          (if a = "block/parent" then retracted_parents
                           else retracted_pages)
                          (key_of e) ()
                      else if entity_ref_of_value v <> None then begin
                        if a = "block/parent" then
                          Hashtbl.replace parent_of (key_of e) v
                        else Hashtbl.replace page_of (key_of e) v
                      end)
                  | None -> ())
              | "block/name" | "db/ident" ->
                  Hashtbl.replace pageish (key_of e) ()
              | _ -> ())
           end)
       | _ -> ())
    tx_data;
  if Hashtbl.length parent_of = 0 && Hashtbl.length page_of = 0 then []
  else begin
    let is_page_eff (v : value) : bool =
      Hashtbl.mem pageish (key_of v)
      || (match eid_of v with
          | Some e -> (
              match entity db (Entity_id e) with
              | Some ent ->
                  Ldb.is_page ent
                  (* name/ident-bearing entities are page anchors too —
                     a resurrected page shell can lack its class tags
                     yet still own children via :db/id fallback *)
                  || Ldb.value ent "block/name" <> None
                  || Ldb.ident_of ent <> None
              | None -> false)
          | None -> false)
    in
    let is_dead (v : value) : bool =
      Hashtbl.mem dead_evals (key_of v)
      || (match eid_of v with Some e -> Int_set.mem e dead | None -> false)
    in
    let eff_parent (v : value) : value option =
      match Hashtbl.find_opt parent_of (key_of v) with
      | Some _ as r -> r
      | None -> (
          (* a retract unmasked by a later in-tx add only marks the
             attr gone when nothing re-wrote it — retract-then-add in
             one tx is the normal move shape and must yield the add *)
          if Hashtbl.mem retracted_parents (key_of v) then None
          else
            match eid_of v with
            | Some e -> (
                match entity db (Entity_id e) with
                | Some ent -> (
                    match Ldb.ref_ent ent "block/parent" with
                    | Some p -> Some (Ref p.id)
                    | None -> None)
                | None -> None)
            | None -> None)
    in
    (* the verbatim page an entity carries post-tx: in-tx write wins,
       an in-tx retract drops it, else the db attr *)
    let verbatim_page (v : value) : value option =
      match Hashtbl.find_opt page_of (key_of v) with
      | Some _ as r -> r
      | None -> (
          if Hashtbl.mem retracted_pages (key_of v) then None
          else
            match eid_of v with
            | Some e -> (
                match entity db (Entity_id e) with
                | Some ent -> (
                    match Ldb.ref_ent ent "block/page" with
                    | Some p -> Some (Ref p.id)
                    | None -> None)
                | None -> None)
            | None -> None)
    in
    let page_ref_value (v : value) : value =
      match eid_of v with Some e -> Ref e | None -> v
    in
    let is_candidate (v : value) : bool =
      Hashtbl.mem parent_of (key_of v) || Hashtbl.mem page_of (key_of v)
    in
    let memo : (value, value option) Hashtbl.t = Hashtbl.create 16 in
    let rec derive (v : value) (seen : value list) : value option =
      let k = key_of v in
      match Hashtbl.find_opt memo k with
      | Some r -> r
      | None ->
          let r =
            if List.mem k seen then None
            else
              match eff_parent v with
              | None -> None
              | Some p when is_page_eff p -> Some (page_ref_value p)
              | Some p when List.mem (key_of p) seen -> None
              | Some p -> (
                  (* the child's page is its parent's own block/page
                     attr — face value — or the parent itself when it
                     has none (cljs `(or (:block/page parent) parent)`).
                     Only when the parent is itself being reparented or
                     re-paged in this tx is its *corrected* page the
                     authoritative one, so only then recurse. *)
                  match is_candidate p with
                  | true -> (
                      match derive p (k :: seen) with
                      | Some _ as r -> r
                      | None -> (
                          match verbatim_page p with
                          | Some _ as r -> r
                          | None -> Some (page_ref_value p)))
                  | false -> (
                      match verbatim_page p with
                      | Some _ as r -> r
                      | None -> Some (page_ref_value p)))
          in
          Hashtbl.replace memo k r;
          r
    in
    let corrections = ref [] in
    let corrected_evals : (value, unit) Hashtbl.t = Hashtbl.create 8 in
    (* every candidate whose post-tx page is known — corrected or
       already right — mapped to that page. db-side descendants share
       their ancestor's new page (chains walk through it), so the
       sweep below keys off the whole set, not only corrected
       entities: a verbatim tx that already writes the mover's page
       correctly emits nothing for it, yet its children may still
       carry the old page. *)
    let derived_eids : (entity_id, entity_id) Hashtbl.t = Hashtbl.create 8 in
    (* table keys are canonical (Ref eid | Uuid | raw) — emit needs a
       form transact accepts: an eid or a lookup-ref *)
    let emit_eid (e : value) : value =
      match eid_of e with
      | Some eid -> Ref eid
      | None -> (
          match e with
          | Uuid _ -> Vector [ Keyword "block/uuid"; e ]
          | String s when Ldb.is_uuid_string s ->
              Vector [ Keyword "block/uuid"; Uuid s ]
          | _ -> e)
    in
    let emit (e : value) (d : value) =
      let d' = page_ref_value d in
      Hashtbl.replace corrected_evals (key_of e) ();
      corrections :=
        Vector [ Keyword "db/add"; emit_eid e; Keyword "block/page"; d' ]
        :: !corrections
    in
    let norm (v : value) : entity_id option = eid_of v in
    let candidates =
      let s = Hashtbl.create 16 in
      Hashtbl.iter (fun e _ -> Hashtbl.replace s e ()) parent_of;
      Hashtbl.iter (fun e _ -> Hashtbl.replace s e ()) page_of;
      Hashtbl.fold (fun e () acc -> e :: acc) s []
    in
    List.iter
      (fun e ->
         if not (is_dead e || is_page_eff e) then
           match derive e [] with
           | Some d ->
               (match eid_of e, norm d with
                | Some ee, Some dd -> Hashtbl.replace derived_eids ee dd
                | _ -> ());
               if norm (match verbatim_page e with
                        | Some v -> v
                        | None -> Nil)
                  <> norm d
               then emit e d
           | None -> ())
      candidates;
    (* db-side descendants of a corrected entity share its new page —
       their chains walk through it. Candidates already emitted or
       resolved keep their own derivation. *)
    let swept = Hashtbl.fold (fun e _ acc -> e :: acc) derived_eids [] in
    let candidate_eids =
      List.fold_left
        (fun acc e ->
           match eid_of e with Some ee -> Int_set.add ee acc | None -> acc)
        Int_set.empty candidates
    in
    List.iter
      (fun ee ->
         match Hashtbl.find_opt derived_eids ee with
         | Some np ->
             let kids = Ldb.get_block_full_children_ids db ee in
             List.iter
               (fun cid ->
                  let cv = Ref cid in
                  if (not (Int_set.mem cid dead))
                     && not (Int_set.mem cid candidate_eids)
                     && not (Hashtbl.mem corrected_evals cv)
                  then
                    let current =
                      match verbatim_page cv with
                      | Some v -> norm v
                      | None -> None
                    in
                    if current <> Some np then emit cv (Ref np))
               kids
         | None -> ())
      swept;
    List.rev !corrections
  end

(* A verbatim retractEntity of a property entity carries only the entity
   retract — the semantic delete-page path computes the matching
   property-value retracts from the issuer's db, but a concurrent
   value write can land on the issuer after that computation, so the
   verbatim tx never covers it. Derive the value retracts here from
   the local db before the tx applies — same (tx, db-before) inputs on
   every ingest boundary, so replicas stay identical — otherwise the
   value datoms orphan onto an attr whose property entity is gone and
   the db fails validate. *)
let derive_property_value_retracts (db : db) (tx_data : value list)
    (dead : Int_set.t) : value list =
  let already_retracted : (int * string, unit) Hashtbl.t =
    Hashtbl.create 8
  in
  List.iter
    (fun item ->
       match item_op item, vec_items item with
       | Some ("db/retract" | "db.fn/retract"), Some (_ :: e :: a :: _) ->
           (match entity_ref_to_eid db e, a with
            | Some eid, (Keyword ident | String ident) ->
                Hashtbl.replace already_retracted (eid, ident) ()
            | _ -> ())
       | _ -> ())
    tx_data;
  List.concat_map
    (fun item ->
       if not (retract_entity_op item) then []
       else
         match vec_items item with
         | Some [ _; e ] -> (
             match entity_ref_to_eid db e with
             | None -> []
             | Some eid -> (
                 match entity db (Entity_id eid) with
                 | Some ent when Ldb.is_property ent -> (
                     match Ldb.ident_of ent with
                     | Some ident ->
                         List.filter_map
                           (fun (d : datom) ->
                             if Int_set.mem d.e dead
                                || Hashtbl.mem already_retracted (d.e, ident)
                             then None
                             else
                               Some
                                 (Vector
                                    [ Keyword "db/retract"; Ref d.e
                                    ; Keyword ident; d.v ]))
                           (List.of_seq (datoms db Avet ~a:ident ()))
                     | None -> [])
                 | _ -> []))
         | _ -> [])
    tx_data

let sanitize_tx ?(drop_missing_retract_ops = false)
    ?(drop_ops_targeting_retracted_entities = false)
    ?(retract_touched_descendants = false) (db : db) (tx_data : value list)
    : value list =
  let tx_data = strip_migration_deleted_attrs tx_data in
  let tx_data = drop_stamps_on_missing_entities db tx_data in
  let tx_data =
    if not (Value_set.is_empty ignored_kv_entities) then
      strip_ignored_kv_entity_ops db tx_data
    else tx_data
  in
  let tx_data =
    if drop_missing_retract_ops then
      List.filter
        (fun item ->
           not
             (retract_entity_op item
              && (match vec_items item with
                  | Some [ _; e ] -> entity_ref_to_eid db e = None
                  | _ -> false)))
        tx_data
    else tx_data
  in
  let tx_data =
    if drop_ops_targeting_retracted_entities then
      drop_ops_on_retracted_entities db tx_data
    else tx_data
  in
  let tx_data = drop_conflicted_encrypted_retracts tx_data in
  let retract_eids =
    List.fold_left
      (fun acc item ->
         if retract_entity_op item then
           match vec_items item with
           | Some [ _; e ] ->
               (match entity_ref_to_eid db e with
                | Some eid -> Int_set.add eid acc
                | None -> acc)
           | _ -> acc
         else acc)
      Int_set.empty tx_data
  in
  let touched_eids =
    List.fold_left
      (fun acc item ->
         if retract_entity_op item then acc
         else
           match touched_entity_eid db item with
           | Some eid -> Int_set.add eid acc
           | None -> acc)
      Int_set.empty tx_data
  in
  let descendant_retract_eids =
    Int_set.fold
      (fun eid acc ->
         if entity_has_uuid db eid then
           List.fold_left (fun s id -> Int_set.add id s) acc
             (Ldb.get_block_full_children_ids db eid)
         else acc)
      retract_eids Int_set.empty
  in
  let preserved_eids =
    if retract_touched_descendants then retract_eids
    else Int_set.union retract_eids touched_eids
  in
  let missing_retract_eids =
    Int_set.diff descendant_retract_eids preserved_eids
    |> Int_set.elements |> List.sort compare
  in
  let dead_eids = Int_set.union retract_eids descendant_retract_eids in
  tx_data
  @ List.map
      (fun eid -> Vector [ Keyword "db/retractEntity"; Ref eid ])
      missing_retract_eids
  @ derive_block_page_fixups db tx_data dead_eids
  @ derive_property_value_retracts db tx_data dead_eids
