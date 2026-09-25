(* logseq.outliner.op.construct — canonical forward and reverse outliner
   ops for history actions. Faithful port of
   deps/outliner/src/logseq/outliner/op/construct.cljc.

   cljs maps/vectors/sets/keywords travel here as Wire.t transit values:
   map -> Wire.Map, vector -> Wire.Array, seq -> Wire.List, set -> Wire.Set,
   keyword -> Wire.Keyword, uuid -> Wire.Uuid, inst -> Wire.Date_ms,
   entity id -> Wire.Int, lookup ref [:a v] -> Wire.Array [Keyword a; v],
   touched entity -> Wire.Tagged ("datascript/Entity", {:db/id ref}). *)

open Datascript

(* ---------- constants ---------- *)

(* op-construct/semantic-outliner-ops *)
let semantic_outliner_ops =
  [ "save-block"; "insert-blocks"; "apply-template"; "move-blocks"
  ; "move-blocks-up-down"; "indent-outdent-blocks"; "delete-blocks"
  ; "create-page"; "rename-page"; "delete-page"; "restore-recycled"
  ; "recycle-delete-permanently"; "upsert-property" ]

let transient_block_keys =
  [ "db/id"; "block/tx-id"; "block/created-at"; "block/updated-at"
  ; "block/meta"; "block/unordered"; "block/level"; "block.temp/ast-title"
  ; "block.temp/ast-body"; "block.temp/load-status"; "block.temp/has-children?"
  ; "logseq.property/created-by-ref" ]

(* delete-restore-transient-block-keys = transient-block-keys disj
   created-by-ref *)
let delete_restore_transient_block_keys =
  List.filter
    (fun k -> k <> "logseq.property/created-by-ref")
    transient_block_keys

let rebase_refs_key = "block.temp/sync-rebase-refs"
let rebase_created_refs_key = "block.temp/sync-created-refs"

(* ---------- wire helpers ---------- *)

let kw s = Wire.Keyword s
let op_entry op args = Wire.Array [ kw op; Wire.Array args ]

(* map get that also sees through the Tagged entity stub rep *)
let mget (k : string) (w : Wire.t) : Wire.t option =
  match w with
  | Wire.Tagged ("datascript/Entity", rep) -> Wire.get k rep
  | _ -> Wire.get k w

let truthy (w : Wire.t) : bool =
  match w with
  | Wire.Bool b -> b
  | Wire.Nil -> false
  | _ -> true

let truthy_opt = function Some w -> truthy w | None -> false

let arg (args : Wire.t list) (n : int) : Wire.t =
  match List.nth_opt args n with Some x -> x | None -> Wire.Nil

let or_map (w : Wire.t) : Wire.t =
  match w with Wire.Map _ -> w | _ -> Wire.Map []

let nth_wire (item : Wire.t) (n : int) : Wire.t option =
  match item with
  | Wire.Array xs | Wire.List xs -> List.nth_opt xs n
  | _ -> None

let is_qualified_kw = function
  | Wire.Keyword s -> String.contains s '/'
  | _ -> false

(* cljs namespace — prefix before the last '/' *)
let kw_namespace (s : string) : string option =
  match String.rindex_opt s '/' with
  | Some i -> Some (String.sub s 0 i)
  | None -> None

(* cljs name — segment after the last '/' *)
let kw_name (s : string) : string =
  match String.rindex_opt s '/' with
  | Some i -> String.sub s (i + 1) (String.length s - i - 1)
  | None -> s


(* cljs distinct — keeps first occurrence order *)
(* cljs distinct — hash-seen set, O(n) *)
let distinct (xs : Wire.t list) : Wire.t list =
  let seen = Hashtbl.create 101 in
  List.filter
    (fun x ->
       if Hashtbl.mem seen x then false
       else (Hashtbl.replace seen x (); true))
    xs

(* cljs (map f xs ys) — truncates to the shorter list *)
let map2_trunc f xs ys =
  let rec go acc xs ys =
    match xs, ys with
    | x :: xs, y :: ys -> go (f x y :: acc) xs ys
    | _ -> List.rev acc
  in
  go [] xs ys

let split_at n xs =
  let rec go i acc = function
    | x :: tl when i < n -> go (i + 1) (x :: acc) tl
    | rest -> (List.rev acc, rest)
  in
  go 0 [] xs

(* tx-data items: wire datoms are [e a v tx added] vectors; d/with-style
   items can also be {:e :a :v :tx :added} maps; entity maps are plain
   Wire.Map. item_get gives cljs (:k item) semantics across all three. *)
let is_datom_item = function
  | Wire.Array [ Wire.Int _; Wire.Keyword _; _; Wire.Int _; Wire.Bool _ ]
  | Wire.List [ Wire.Int _; Wire.Keyword _; _; Wire.Int _; Wire.Bool _ ] ->
      true
  | _ -> false

let item_get (k : string) (item : Wire.t) : Wire.t option =
  match item with
  | (Wire.Array [ e; a; v; tx; added ] | Wire.List [ e; a; v; tx; added ])
    when is_datom_item item ->
      (match k with
       | "e" -> Some e
       | "a" -> Some a
       | "v" -> Some v
       | "tx" -> Some tx
       | "added" -> Some added
       | _ -> None)
  | Wire.Tagged ("datascript/Datom", rep) ->
      (match rep with
       | Wire.Array [ e; a; v; tx ] | Wire.List [ e; a; v; tx ] ->
           (match k with
            | "e" -> Some e
            | "a" -> Some a
            | "v" -> Some v
            | "tx" -> Some tx
            | "added" ->
                (match tx with
                 | Wire.Int t -> Some (Wire.Bool (t >= 0))
                 | _ -> None)
            | _ -> None)
       | _ -> None)
  | _ -> Wire.get k item

(* cljs (d/entity db ref) — resolves entity refs to live entities.
   Tagged entity stubs resolve through their :db/id. *)
let rec entity_of_ref_wire (db : db) (w : Wire.t) : entity option =
  match w with
  | Wire.Tagged ("datascript/Entity", rep) ->
      (match mget "db/id" rep with
       | Some id -> entity_of_ref_wire db id
       | None -> None)
  | Wire.Uuid _ | Wire.Map _ | Wire.Set _ -> None
  | _ ->
      (try entity db (Ds_wire.entity_ref_of_transit w)
       with Invalid_argument _ -> None)

(* entity attr -> wire. cljs entity reads yield entity objects for ref
   attrs; wire rep is the Tagged stub holding {:db/id ref}. *)
let ent_attr_wire (e : entity) (a : attr) : Wire.t option =
  match a with
  | "db/id" -> Some (Wire.Int e.id)
  | _ ->
      (match entity_attr e a with
       | Some (One_value v) -> Some (Ds_wire.transit_of_value v)
       | Some (Many_values vs) ->
           Some (Wire.Set (List.map Ds_wire.transit_of_value vs))
       | Some (One_entity te) ->
           Option.map Ds_wire.transit_of_entity_stub te.db_id
       | Some (Many_entities tes) ->
           Some
             (Wire.Set
                (List.filter_map
                   (fun te -> Option.map Ds_wire.transit_of_entity_stub te.db_id)
                   tes))
       | None -> None)

(* cljs (into {} entity) -> wire map; db/id included like cljs callers
   that assoc it explicitly *)
let wire_map_of_entity (e : entity) : Wire.t =
  Wire.Map
    (List.map
       (fun (a, v) -> (Wire.Keyword a, Ds_wire.transit_of_value v))
       (Block_map.of_entity e))

let wire_map_of_block_map (m : Block_map.t) : Wire.t =
  Wire.Map
    (List.map
       (fun (a, v) -> (Wire.Keyword a, Ds_wire.transit_of_value v))
       m)

let uuid_wire_of_entity (e : entity) : Wire.t option =
  match Ldb.value e "block/uuid" with
  | Some (Uuid u) -> Some (Wire.Uuid u)
  | _ -> None

(* op-construct/ref-attr? — cljs (:db/valueType (d/entity db a)) — attr
   ident entity only, no schema lookup *)
let ref_attr (db : db) (a : attr) : bool =
  match entity db (Ident a) with
  | Some e -> Ldb.value e "db/valueType" = Some (Keyword "db.type/ref")
  | None -> false

(* ---------- stable refs ---------- *)

(* op-construct/stable-entity-ref *)
let rec stable_entity_ref (db : db) (x : Wire.t) : Wire.t =
  match x with
  | Wire.Map _ | Wire.Tagged ("datascript/Entity", _) ->
      (match
         (match mget "db/id" x with
          | Some v -> Some v
          | None ->
              (match mget "block/uuid" x with
               | Some u ->
                   (match entity db (Lookup_ref ("block/uuid", Ds_wire.value_of_transit u)) with
                    | Some e -> Some (Wire.Int e.id)
                    | None -> None)
               | None -> None))
       with
       | Some eid -> stable_entity_ref db eid
       | None -> Wire.Nil)
  | Wire.Uuid _ -> Wire.Array [ kw "block/uuid"; x ]
  | Wire.Int n when n >= 0 ->
      (match entity db (Entity_id n) with
       | Some ent ->
           (match Ldb.value ent "block/uuid" with
            | Some (Uuid u) -> Wire.Array [ kw "block/uuid"; Wire.Uuid u ]
            | _ ->
                (match Ldb.ident_of ent with
                 | Some ident -> kw ident
                 | None -> x))
       | None -> x)
  | Wire.Int64 n when n >= 0L -> stable_entity_ref db (Wire.Int (Int64.to_int n))
  | _ -> x

(* op-construct/tx-data-block-uuid-ref *)
let tx_data_block_uuid_ref (tx_data : Wire.t list) (entity_ref : Wire.t)
    : Wire.t option =
  List.find_map
    (fun item ->
       match
         (item_get "e" item, item_get "a" item, item_get "v" item)
       with
       | Some e, Some (Wire.Keyword "block/uuid"), Some (Wire.Uuid u)
         when e = entity_ref ->
           Some (Wire.Array [ kw "block/uuid"; Wire.Uuid u ])
       | _ -> None)
    tx_data

(* op-construct/stable-entity-ref-with-tx-data *)
let stable_entity_ref_with_tx_data db tx_data x : Wire.t =
  let entity_ref = stable_entity_ref db x in
  match entity_ref with
  | Wire.Int n when n >= 0 ->
      Option.value
        (tx_data_block_uuid_ref tx_data entity_ref)
        ~default:entity_ref
  | _ -> entity_ref

(* op-construct/stable-block-ref-with-tx-data *)
let stable_block_ref_with_tx_data = stable_entity_ref_with_tx_data

(* op-construct/sanitize-ref-value *)
let sanitize_ref_value db ?(tx_data : Wire.t list = []) (v : Wire.t) : Wire.t =
  match v with
  | Wire.Array _ -> stable_entity_ref_with_tx_data db tx_data v
  | Wire.Set xs | Wire.List xs ->
      Wire.Set
        (distinct (List.map (stable_entity_ref_with_tx_data db tx_data) xs))
  | _ -> stable_entity_ref_with_tx_data db tx_data v

(* op-construct/sanitize-upsert-property-schema *)
let sanitize_upsert_property_schema db (schema : Wire.t) : Wire.t =
  match schema with
  | Wire.Map entries ->
      Wire.Map
        (List.map
           (fun (k, v) ->
              match k with
              | Wire.Keyword "logseq.property/classes" ->
                  (k, sanitize_ref_value db v)
              | _ -> (k, v))
           entries)
  | _ -> Wire.Map []

(* attr of a block/refs item — plain map keys or stub-entity attrs *)
let ref_entity_attr (db : db) (k : string) (w : Wire.t) : Wire.t option =
  match w with
  | Wire.Tagged ("datascript/Entity", rep) ->
      (match mget "db/id" rep with
       | Some id ->
           (match entity_of_ref_wire db id with
            | Some e -> ent_attr_wire e k
            | None -> None)
       | None -> None)
  | _ -> Wire.get k w

(* op-construct/sanitize-block-refs *)
let sanitize_block_refs db (refs : Wire.t list) : Wire.t list =
  List.filter_map
    (fun ref_entity ->
       match ref_entity_attr db "block/uuid" ref_entity with
       | Some _ ->
           Some
             (Wire.Map
                (List.filter_map
                   (fun k ->
                      match ref_entity_attr db k ref_entity with
                      | Some v -> Some (kw k, v)
                      | None -> None)
                   [ "block/uuid"; "block/title"; "db/ident" ]))
       | None -> None)
    refs

(* op-construct/sanitize-block-payload *)
let sanitize_block_payload db ?(created_uuids : Wire.t list = [])
    ?(tx_data : Wire.t list = []) (block : Wire.t) : Wire.t =
  match block with
  | Wire.Map entries ->
      let refs =
        sanitize_block_refs db
          (match mget "block/refs" block with
           | Some w -> Wire.as_seq w
           | None -> [])
      in
      let created_ref_uuids =
        if created_uuids = [] || refs = [] then []
        else
          distinct
            (List.filter_map
               (fun r ->
                  match ref_entity_attr db "block/uuid" r with
                  | Some u when List.mem u created_uuids -> Some u
                  | _ -> None)
               refs)
      in
      let m =
        Wire.Map
          (List.filter_map
             (fun (k, v) ->
                match k with
                | Wire.Keyword name | Wire.String name ->
                    if List.mem name transient_block_keys then None
                    else if kw_namespace name = Some "block.temp" then None
                    else if ref_attr db name then
                      Some (k, sanitize_ref_value db ~tx_data v)
                    else Some (k, v)
                | _ -> Some (k, v))
             entries)
      in
      let m =
        if refs <> [] then
          Cljs_map.assoc m rebase_refs_key (Wire.Array refs)
        else m
      in
      if created_ref_uuids <> [] then
        Cljs_map.assoc m rebase_created_refs_key (Wire.Array created_ref_uuids)
      else m
  | _ -> block

(* op-construct/get-missing-ref-by-lookup *)
let get_missing_ref_by_lookup (missing_refs : Wire.t list)
    (tag_lookups : Wire.t list) : (Wire.t * Wire.t) list =
  (* cljs writes (common-util/time-ms) — a plain number; Wire.Int64
     serializes as a raw transit number (never ~t) *)
  let now = Wire.Int64 (Common_util.time_ms ()) in
  List.filter_map
    (fun block ->
       match mget "block/uuid" block with
       | Some block_id when block_id <> Wire.Nil ->
           let lookup = Wire.Array [ kw "block/uuid"; block_id ] in
           let tag_ref = List.exists (fun l -> l = lookup) tag_lookups in
           let title = mget "block/title" block in
           let base =
             Wire.Map
               [ kw "block/uuid", block_id
               ; ( kw "block/title"
                 , match title with Some t -> t | None -> Wire.String "" )
               ; kw "block/created-at", now
               ; kw "block/updated-at", now
               ; ( kw "block/tags"
                 , kw
                     (if tag_ref then "logseq.class/Tag"
                      else "logseq.class/Page") ) ]
           in
           let base =
             match title with
             | Some (Wire.String t) ->
                 Cljs_map.assoc base "block/name"
                   (Wire.String (Common_util.page_name_sanity_lc t))
             | _ -> base
           in
           let base =
             if tag_ref then
               Cljs_map.assoc base "logseq.property.class/extends"
                 (kw "logseq.class/Root")
             else base
           in
           let base =
             match mget "db/ident" block with
             | Some ident -> Cljs_map.assoc base "db/ident" ident
             | None -> base
           in
           Some (lookup, base)
       | _ -> None)
    missing_refs

(* db-content/content-id-ref->page over rebase ref wire maps — refs are
   {:block/uuid :block/title :db/ident} maps, not entities. *)
let content_id_ref_to_page_wire (content : string) (refs : Wire.t list)
    : string =
  List.fold_left
    (fun c ref_entity ->
       match
         ( mget "block/title" ref_entity
         , mget "block/uuid" ref_entity )
       with
       | Some (Wire.String title), Some u ->
           (match Wire.as_uuid u with
            | Some uuid ->
                Db_content.replace_all c ~pattern:(Db_content.page_ref uuid)
                  ~replacement:title
            | None -> c)
       | _ -> c)
    content refs

(* op-construct/rewrite-block-title-with-retracted-refs *)
let rewrite_block_title_with_retracted_refs (db : db) (block : Wire.t)
    : Wire.t =
  let refs =
    match mget rebase_refs_key block with
    | Some w -> Wire.as_seq w
    | None -> []
  in
  let created_ref_uuids =
    match mget rebase_created_refs_key block with
    | Some w -> Wire.as_seq w
    | None -> []
  in
  let missing_refs =
    List.filter
      (fun ref_entity ->
         match ref_entity_attr db "block/uuid" ref_entity with
         | Some uuid ->
             Option.is_none
               (entity db (Lookup_ref ("block/uuid", Uuid (Option.value (Wire.as_uuid uuid) ~default:""))))
         | None -> false)
      refs
  in
  let retracted_refs =
    List.filter
      (fun block ->
         match mget "block/uuid" block with
         | Some u -> not (List.mem u created_ref_uuids)
         | None -> true)
      missing_refs
  in
  let tag_lookups =
    List.filter_map
      (fun v ->
         match v with
         | Wire.Array [ Wire.Keyword "block/uuid"; _ ] -> Some v
         | _ -> None)
      (match mget "block/tags" block with
       | Some w -> Wire.as_seq w
       | None -> [])
  in
  let missing_ref_by_lookup = get_missing_ref_by_lookup missing_refs tag_lookups in
  let rewrite_retracted_refs (v : Wire.t) : Wire.t =
    let items = Wire.as_seq v in
    Wire.Array
      (List.map
         (fun block_ref ->
            match List.find_opt (fun (lookup, _) -> lookup = block_ref)
                    missing_ref_by_lookup with
            | Some (_, entity_map) -> entity_map
            | None -> block_ref)
         items)
  in
  let block' =
    let block =
      if retracted_refs = [] then block
      else
        match mget "block/title" block with
        | Some (Wire.String title) ->
            Cljs_map.assoc block "block/title"
              (Wire.String
                 (content_id_ref_to_page_wire title retracted_refs))
        | _ -> block
    in
    if missing_ref_by_lookup = [] then block
    else
      let block =
        Cljs_map.assoc block "block/refs"
          (rewrite_retracted_refs
             (match mget "block/refs" block with
              | Some v -> v
              | None -> Wire.Nil))
      in
      Cljs_map.assoc block "block/tags"
        (rewrite_retracted_refs
           (match mget "block/tags" block with
            | Some v -> v
            | None -> Wire.Nil))
  in
  Cljs_map.dissoc_list block' [ rebase_refs_key; rebase_created_refs_key ]

(* op-construct/sanitize-insert-block-payload *)
let sanitize_insert_block_payload db tx_data (block : Wire.t) : Wire.t =
  let block' = sanitize_block_payload db ~tx_data block in
  match block' with
  | Wire.Map _ ->
      Cljs_map.dissoc_list block'
        [ "block/page"; "block/order"; rebase_refs_key ]
  | _ -> block'

(* op-construct/stable-id-coll — returns the wire vector *)
let stable_id_coll db (ids : Wire.t) : Wire.t =
  Wire.Array (List.map (stable_entity_ref db) (Wire.as_seq ids))

(* op-construct/stable-block-uuid *)
let stable_block_uuid db (x : Wire.t) : Wire.t =
  let entity_ref = stable_entity_ref db x in
  match entity_ref with
  | Wire.Uuid _ -> entity_ref
  | Wire.Array [ Wire.Keyword "block/uuid"; (Wire.Uuid _ as u) ] -> u
  | _ -> entity_ref

(* op-construct/resolve-target-and-sibling — [target-id sibling?] *)
let resolve_target_and_sibling (block : entity) : (entity_id * bool) option =
  match Ldb.get_left_sibling block with
  | Some left -> Some (left.id, true)
  | None ->
      (match Ldb.ref_ent block "block/parent" with
       | Some parent -> Some (parent.id, false)
       | None -> None)

(* op-construct/resolve-move-target *)
let resolve_move_target db (ids : Wire.t) : (entity_id * bool) option =
  match Wire.as_seq ids with
  | [] -> None
  | first :: _ ->
      (match entity_of_ref_wire db first with
       | Some block -> resolve_target_and_sibling block
       | None -> None)

(* op-construct/created-block-uuids-from-tx-data *)
let created_block_uuids_from_tx_data (tx_data : Wire.t list) : Wire.t list =
  tx_data
  |> List.filter_map (fun item ->
       match item with
       | Wire.Map _ ->
           (match mget "block/uuid" item with
            | Some u when u <> Wire.Nil -> Some u
            | _ ->
                (* d/with-style datom maps {:e :a :v :added} *)
                (match (item_get "a" item, item_get "added" item) with
                 | Some (Wire.Keyword "block/uuid"), Some (Wire.Bool true) ->
                     item_get "v" item
                 | _ -> None))
       | Wire.Tagged ("datascript/Datom", _) ->
           (match (item_get "a" item, item_get "added" item) with
            | Some (Wire.Keyword "block/uuid"), Some (Wire.Bool true) ->
                item_get "v" item
            | _ -> None)
       | _ when is_datom_item item ->
           (match (item_get "a" item, item_get "added" item) with
            | Some (Wire.Keyword "block/uuid"), Some (Wire.Bool true) ->
                item_get "v" item
            | _ -> None)
       | Wire.Array xs | Wire.List xs ->
           (match xs with
            | Wire.Keyword "db/add" :: _ :: Wire.Keyword "block/uuid" :: u :: _
              when List.length xs >= 4 -> Some u
            | _ -> None)
       | _ -> None)
  |> distinct

(* op-construct/created-page-uuid-from-tx-data *)
let created_page_uuid_from_tx_data (tx_data : Wire.t list) (title : Wire.t)
    : Wire.t option =
  match
    List.find_map
      (fun item ->
         match item with
         | Wire.Map _ ->
             (match (item_get "block/title" item, item_get "block/uuid" item) with
              | Some t, Some u when t = title -> Some u
              | _ -> None)
         | _ -> None)
      tx_data
  with
  | Some u -> Some u
  | None ->
      (* cljs group-by :e — hash-grouped, not assoc-list *)
      let by_e = Hashtbl.create 101 in
      List.iter
        (fun item ->
           match item_get "e" item with
           | Some e ->
               let prev = Option.value (Hashtbl.find_opt by_e e) ~default:[] in
               Hashtbl.replace by_e e (item :: prev)
           | None -> ())
        tx_data;
      (* datoms consed reversed — List.rev restores tx order per group *)
      let groups =
        Hashtbl.fold (fun e datoms acc -> (e, List.rev datoms) :: acc) by_e []
      in
      List.find_map
        (fun (_, datoms) ->
           let title' =
             List.find_map
               (fun datom ->
                  match (item_get "a" datom, item_get "added" datom) with
                  | Some (Wire.Keyword "block/title"), Some (Wire.Bool true) ->
                      item_get "v" datom
                  | _ -> None)
               datoms
           and uuid' =
             List.find_map
               (fun datom ->
                  match (item_get "a" datom, item_get "added" datom) with
                  | Some (Wire.Keyword "block/uuid"), Some (Wire.Bool true) ->
                      item_get "v" datom
                  | _ -> None)
               datoms
           in
           match title', uuid' with
           | Some t, Some (Wire.Uuid _ as u) when t = title -> Some u
           | _ -> None)
        groups

(* op-construct/created-db-ident-from-tx-data *)
let created_db_ident_from_tx_data (tx_data : Wire.t list) : Wire.t option =
  let or_else next = function Some v -> Some v | None -> next () in
  List.find_map
    (fun item ->
       match item with
       | Wire.Map _ ->
           (match mget "db/ident" item with
            | Some (Wire.Keyword _ as i) when is_qualified_kw i -> Some i
            | _ -> None)
       | _ -> None)
    tx_data
  |> or_else (fun () ->
       List.find_map
         (fun item ->
            match item with
            | Wire.Map _ ->
                (match (item_get "a" item, item_get "v" item) with
                 | Some (Wire.Keyword "db/ident"), Some (Wire.Keyword _ as i)
                   when is_qualified_kw i -> Some i
                 | _ -> None)
            | _ -> None)
         tx_data)
  |> or_else (fun () ->
       List.find_map
         (fun item ->
            match (nth_wire item 1, nth_wire item 2) with
            | Some (Wire.Keyword "db/ident"), Some (Wire.Keyword _ as i)
              when is_qualified_kw i -> Some i
            | _ -> None)
         tx_data)
  |> or_else (fun () ->
       List.find_map
         (fun item ->
            match item with
            | Wire.Array xs | Wire.List xs ->
                (match xs with
                 | Wire.Keyword "db/add" :: _ :: Wire.Keyword "db/ident"
                   :: (Wire.Keyword _ as i) :: _
                   when List.length xs >= 4 && is_qualified_kw i -> Some i
                 | _ -> None)
            | _ -> None)
         tx_data)

(* op-construct/property-ident-by-title *)
let property_ident_by_title db (property_name : Wire.t) : Wire.t option =
  match property_name with
  | Wire.String title ->
      (match
         q_string db
           ~inputs:[ Arg_scalar (Result_value (String title)) ]
           "[:find ?ident . :in $ ?title :where [?e :block/title ?title] \
            [?e :block/tags :logseq.class/Property] [?e :db/ident ?ident]]"
       with
       | [ [ Result_attr ident ] ] when String.contains ident '/' ->
           Some (kw ident)
       | [ [ Result_value (Keyword ident) ] ] when String.contains ident '/' ->
           Some (kw ident)
       | _ -> None)
  | _ -> None

(* op-construct/maybe-rewrite-delete-block-ids — returns wire id coll *)
let maybe_rewrite_delete_block_ids db tx_data (ids : Wire.t) : Wire.t =
  let deleted_ids_from_tx_data =
    tx_data
    |> List.filter_map (fun item ->
         match item with
         | Wire.Array xs | Wire.List xs ->
             (match xs with
              | Wire.Keyword "db/retractEntity" :: e :: _
                when List.length xs >= 2 -> Some e
              | _ ->
                  (match (item_get "added" item, item_get "a" item) with
                   | Some (Wire.Bool false), Some (Wire.Keyword "block/uuid") ->
                       item_get "e" item
                   | _ -> None))
         | Wire.Map _ ->
             (match (item_get "added" item, item_get "a" item) with
              | Some (Wire.Bool false), Some (Wire.Keyword "block/uuid") ->
                  item_get "e" item
              | _ -> None)
         | _ -> None)
    |> distinct
  in
  let ids_from_tx_data' =
    match deleted_ids_from_tx_data with
    | [] -> None
    | xs ->
        let stable = List.map (stable_entity_ref db) xs in
        (match stable with [] -> None | _ -> Some (Wire.Array stable))
  in
  let ids' = List.map (stable_entity_ref db) (Wire.as_seq ids) in
  let created_uuids = created_block_uuids_from_tx_data tx_data in
  let unresolved_created_lookups =
    created_uuids <> []
    && List.length ids' = List.length created_uuids
    && List.for_all
         (fun id ->
            match id with
            | Wire.Array [ Wire.Keyword "block/uuid"; _ ] ->
                Option.is_none (entity_of_ref_wire db id)
            | _ -> false)
         ids'
  in
  match ids_from_tx_data' with
  | Some stable -> stable
  | None ->
      if unresolved_created_lookups then
        Wire.Array
          (List.map (fun u -> Wire.Array [ kw "block/uuid"; u ]) created_uuids)
      else Wire.Array ids'

(* op-construct/moved-block-ids-from-tx-data — destructure [e a _v _t added?]
   only on sequential items *)
let moved_block_ids_from_tx_data (tx_data : Wire.t list) : Wire.t list =
  tx_data
  |> List.filter_map (fun item ->
       match item with
       | Wire.Array [ _e; a; _v; _t; added ]
       | Wire.List [ _e; a; _v; _t; added ] ->
           (match (a, added) with
            | Wire.Keyword "block/parent", Wire.Bool true -> item_get "e" item
            | _ -> None)
       | Wire.Array xs | Wire.List xs ->
           (* 5+ seqs where destructure yields a/added anyway *)
           (match (List.nth_opt xs 1, List.nth_opt xs 4) with
            | Some (Wire.Keyword "block/parent"), Some (Wire.Bool true) ->
                item_get "e" item
            | _ -> None)
       | _ -> None)
  |> distinct

(* op-construct/remap-lookup-ref-by-uuid-map — uuid-map : (old,new) assoc *)
let rec remap_lookup_ref_by_uuid_map (uuid_map : (string * string) list)
    (v : Wire.t) : Wire.t =
  match v with
  | Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid u ] ->
      Wire.Array
        [ kw "block/uuid"
        ; Wire.Uuid
            (match List.assoc_opt u uuid_map with Some n -> n | None -> u) ]
  | Wire.Set xs -> Wire.Set (List.map (remap_lookup_ref_by_uuid_map uuid_map) xs)
  | Wire.List xs -> Wire.List (List.map (remap_lookup_ref_by_uuid_map uuid_map) xs)
  | Wire.Array xs -> Wire.Array (List.map (remap_lookup_ref_by_uuid_map uuid_map) xs)
  | _ -> v

(* op-construct/remap-block-lookup-values-by-uuid-map *)
let remap_block_lookup_values_by_uuid_map (block : Wire.t)
    (uuid_map : (string * string) list) : Wire.t =
  match block with
  | Wire.Map entries ->
      Wire.Map
        (List.map (fun (k, v) -> (k, remap_lookup_ref_by_uuid_map uuid_map v))
           entries)
  | _ -> block

(* op-construct/template-children-blocks-for-history *)
let template_children_blocks_for_history db (template_ref : Wire.t) : Wire.t list =
  match entity_of_ref_wire db template_ref with
  | Some template ->
      (match Ldb.value template "block/uuid" with
       | Some (Uuid u) ->
           (match Ldb.get_block_and_children db ~include_property_block:true u with
            | _root :: first :: rest ->
                Cljs_map.assoc_list (wire_map_of_entity first)
                  [ "db/id", Wire.Int first.id
                  ; "logseq.property/used-template", Wire.Int template.id ]
                :: List.map
                     (fun b ->
                        Cljs_map.assoc (wire_map_of_entity b) "db/id"
                          (Wire.Int b.id))
                     rest
            | _ -> [])
       | _ -> [])
  | None -> []

(* op-construct/inserted-block-uuids-from-tx-data — created uuids of the
   inserted tree only: entity-ids that received a :block/parent write.
   Saving a reference and inserting a sibling creates both a page and a
   block; only the inserted tree has parent writes in that transaction. *)
let inserted_block_uuids_from_tx_data (tx_data : Wire.t list) : Wire.t list =
  (* cljs entity-id — (some? (:a item)) -> (:e item); (vector? item) ->
     (second item); else (:db/id item) or [:block/uuid (:block/uuid item)] *)
  let entity_id (item : Wire.t) : Wire.t =
    match item with
    | Wire.Map _ ->
        (match Wire.get "a" item with
         | Some _ -> Option.value (Wire.get "e" item) ~default:Wire.Nil
         | None ->
             (match Wire.get "db/id" item with
              | Some id -> id
              | None ->
                  Wire.Array
                    [ kw "block/uuid"
                    ; Option.value (Wire.get "block/uuid" item)
                        ~default:Wire.Nil ]))
    | Wire.Tagged ("datascript/Datom", _) ->
        Option.value (item_get "e" item) ~default:Wire.Nil
    | _ when is_datom_item item ->
        (match item with
         | Wire.Array (e :: _) | Wire.List (e :: _) -> e
         | _ -> Wire.Nil)
    | Wire.Array (_ :: e :: _) | Wire.List (_ :: e :: _) -> e
    | _ -> Wire.Nil
  in
  let has_parent_write (item : Wire.t) : bool =
    match item with
    | Wire.Map _ ->
        (match Wire.get "block/parent" item with
         | Some v when truthy v -> true
         | _ ->
             (match (item_get "a" item, item_get "added" item) with
              | Some (Wire.Keyword "block/parent"), Some (Wire.Bool true) ->
                  true
              | _ -> false))
    (* d/with-style datom vectors [e :block/parent v tx added] *)
    | Wire.Tagged ("datascript/Datom", _) ->
        (match (item_get "a" item, item_get "added" item) with
         | Some (Wire.Keyword "block/parent"), Some (Wire.Bool true) -> true
         | _ -> false)
    | _ when is_datom_item item ->
        (match (item_get "a" item, item_get "added" item) with
         | Some (Wire.Keyword "block/parent"), Some (Wire.Bool true) -> true
         | _ -> false)
    | Wire.Array (Wire.Keyword "db/add" :: _ :: Wire.Keyword "block/parent" :: _)
    | Wire.List (Wire.Keyword "db/add" :: _ :: Wire.Keyword "block/parent" :: _)
      -> true
    | _ -> false
  in
  (* cljs (into #{} ...) — a set, not List.mem, so this stays O(n) on
     large tx_data *)
  let parent_ids = Hashtbl.create 101 in
  List.iter
    (fun item ->
       if has_parent_write item then
         Hashtbl.replace parent_ids (entity_id item) ())
    tx_data;
  created_block_uuids_from_tx_data
    (List.filter
       (fun item -> Hashtbl.mem parent_ids (entity_id item))
       tx_data)

(* op-construct/replaces-empty-target? *)
let replaces_empty_target db (tx_data : Wire.t list)
    (source_uuids : Wire.t list) (target_ref : Wire.t) (opts : Wire.t) : bool =
  (truthy_opt (mget "replace-empty-target?" opts)
   || (truthy_opt (mget "sibling?" opts) && List.length source_uuids > 1))
  && ((match source_uuids with
       | u :: _ ->
           (match entity_of_ref_wire db target_ref with
            | Some t ->
                (match uuid_wire_of_entity t with
                 | Some tu -> u = tu
                 | None -> false)
            | None -> false)
       | [] ->
           (* cljs (= nil (:block/uuid missing-entity)) *)
           (match entity_of_ref_wire db target_ref with
            | Some t -> uuid_wire_of_entity t = None
            | None -> true))
      || List.exists
           (fun item ->
              let e, a, v, added =
                match item with
                | _ when is_datom_item item ->
                    ( Option.value (item_get "e" item) ~default:Wire.Nil
                    , Option.value (item_get "a" item) ~default:Wire.Nil
                    , Option.value (item_get "v" item) ~default:Wire.Nil
                    , match item_get "added" item with
                      | Some (Wire.Bool true) -> true
                      | _ -> false )
                | Wire.Array (_ :: e :: a :: v :: _)
                | Wire.List (_ :: e :: a :: v :: _) ->
                    let added =
                      match item with
                      | Wire.Array (Wire.Keyword "db/add" :: _)
                      | Wire.List (Wire.Keyword "db/add" :: _) -> true
                      | _ -> false
                    in
                    (e, a, v, added)
                | _ ->
                    ( Option.value (mget "e" item) ~default:Wire.Nil
                    , Option.value (mget "a" item) ~default:Wire.Nil
                    , Option.value (mget "v" item) ~default:Wire.Nil
                    , match mget "added" item with
                      | Some (Wire.Bool true) -> true
                      | _ -> false )
              in
              a = Wire.Keyword "block/title" && not added
              && (match v with Wire.String s -> String.trim s = "" | _ -> false)
              && stable_entity_ref db e = target_ref)
           tx_data)

(* op-construct/canonicalize-insert-blocks-op — returns [blocks' target-ref opts'] *)
let canonicalize_insert_blocks_op db tx_data (args : Wire.t list)
    (available_uuids : Wire.t list) : Wire.t list =
  let blocks = arg args 0 and target_id = arg args 1 and opts = arg args 2 in
  let source_blocks =
    List.map (sanitize_insert_block_payload db tx_data) (Wire.as_seq blocks)
  in
  let source_uuids =
    List.map
      (fun b -> match mget "block/uuid" b with Some u -> u | None -> Wire.Nil)
      source_blocks
  in
  let target_ref = stable_entity_ref db target_id in
  let target = entity_of_ref_wire db target_ref in
  (* cljs available-set = (set available-uuids) — hash membership, O(n) *)
  let available_set = Hashtbl.create 101 in
  List.iter (fun u -> Hashtbl.replace available_set u ()) available_uuids;
  let in_available u = Hashtbl.mem available_set u in
  let replaced_target =
    (not (List.for_all in_available source_uuids))
    && replaces_empty_target db tx_data source_uuids target_ref opts
  in
  let new_source_uuids =
    if replaced_target then
      match source_uuids with _ :: tl -> tl | [] -> []
    else source_uuids
  in
  let created_uuids =
    if List.for_all in_available new_source_uuids
    then new_source_uuids
    else
      let rec take n = function
        | _ when n <= 0 -> []
        | [] -> []
        | x :: tl -> x :: take (n - 1) tl
      in
      take (List.length new_source_uuids) available_uuids
  in
  let block_with_new_id block block_uuid =
    let parent_uuid =
      match entity_of_ref_wire db (Wire.Array [ kw "block/uuid"; block_uuid ]) with
      | Some e -> Ldb.ref_ent e "block/parent"
      | None -> None
    in
    Cljs_map.assoc_list block
      [ "block/uuid", block_uuid
      ; ( "block/parent"
        , Wire.Array
            [ kw "block/uuid"
            ; (match parent_uuid with
               | Some p ->
                   (match uuid_wire_of_entity p with
                    | Some u -> u
                    | None -> Wire.Nil)
               | None -> Wire.Nil) ] ) ]
  in
  let blocks' =
    if not (replaced_target || created_uuids <> []) then source_blocks
    else if
      replaced_target
      || (truthy_opt (mget "replace-empty-target?" opts)
          && List.length created_uuids + 1 = List.length source_blocks)
    then
      match source_blocks with
      | fst_block :: rst_blocks ->
          let target_uuid =
            match target with
            | Some t -> Option.value (uuid_wire_of_entity t) ~default:Wire.Nil
            | None -> Wire.Nil
          in
          Cljs_map.assoc fst_block "block/uuid" target_uuid
          :: (if created_uuids = [] then rst_blocks
              else map2_trunc block_with_new_id rst_blocks created_uuids)
      | [] ->
          (* cljs [fst-block & rst-blocks] on [] binds nils; (assoc nil ...) =
             {:block/uuid _} *)
          let target_uuid =
            match target with
            | Some t -> Option.value (uuid_wire_of_entity t) ~default:Wire.Nil
            | None -> Wire.Nil
          in
          [ Cljs_map.assoc (Wire.Map []) "block/uuid" target_uuid ]
    else map2_trunc block_with_new_id source_blocks created_uuids
  in
  let uuid_remap =
    List.filter_map
      (fun (old_u, new_u) ->
         match old_u, new_u with
         | Wire.Uuid o, Wire.Uuid n when o <> n -> Some (o, n)
         | _ -> None)
      (map2_trunc (fun a b -> (a, b)) source_uuids
         (List.map
            (fun b ->
               match mget "block/uuid" b with Some u -> u | None -> Wire.Nil)
            blocks'))
  in
  let blocks'' =
    if uuid_remap = [] then blocks'
    else List.map (fun b -> remap_block_lookup_values_by_uuid_map b uuid_remap) blocks'
  in
  [ Wire.Array blocks''
  ; target_ref
  ; Cljs_map.assoc
      (Cljs_map.dissoc (or_map opts) "outliner-op")
      "keep-uuid?" (Wire.Bool true) ]

(* op-construct/canonicalize-template-op *)
let canonicalize_template_op db tx_data (args : Wire.t list)
    (available_uuids : Wire.t list) : Wire.t =
  let template_ref = stable_entity_ref db (arg args 0) in
  let target_ref = stable_entity_ref db (arg args 1) in
  let opts = arg args 2 in
  let template_blocks =
    match mget "template-blocks" opts with
    | Some w when Wire.as_seq w <> [] -> Wire.as_seq w
    | _ -> template_children_blocks_for_history db template_ref
  in
  let opts_base =
    Cljs_map.dissoc_list (or_map opts) [ "template-id"; "outliner-op" ]
  in
  let opts' =
    match template_blocks with
    | [] -> Cljs_map.dissoc opts_base "template-blocks"
    | _ ->
        (match
           canonicalize_insert_blocks_op db tx_data
             [ Wire.Array template_blocks; arg args 1; opts_base ]
             available_uuids
         with
         | [ blocks'; _target_ref; insert_opts ] ->
             Cljs_map.assoc insert_opts "template-blocks" blocks'
         | _ -> invalid_arg "canonicalize-insert-blocks-op arity")
  in
  (match template_ref, target_ref with
   | Wire.Nil, _ | _, Wire.Nil ->
       invalid_arg
         ("Invalid apply-template args: "
          ^ Transit_codec.to_string (Wire.Array args))
   | _ -> ());
  op_entry "apply-template" [ template_ref; target_ref; opts' ]

(* op-construct/canonicalize-insert-ops — ^:api; threads the
   available-uuid pool across insert ops in one transaction. *)
let canonicalize_insert_ops db tx_data (ops : Wire.t list) : Wire.t list =
  let rec loop (available : Wire.t list) (acc : Wire.t list) = function
    | [] -> List.rev acc
    | entry :: rest ->
        (match Outliner_op.op_of_entry entry with
         | Some (("insert-blocks" | "apply-template") as op, args) ->
             let entry' =
               if op = "insert-blocks" then
                 op_entry "insert-blocks"
                   (canonicalize_insert_blocks_op db tx_data args
                      available)
               else canonicalize_template_op db tx_data args available
             in
             let blocks =
               match Outliner_op.op_of_entry entry' with
               | Some ("insert-blocks", args') -> arg args' 0
               | Some ("apply-template", args') ->
                   Option.value
                     (mget "template-blocks" (arg args' 2)) ~default:Wire.Nil
               | _ -> Wire.Nil
             in
             (* cljs inserted-uuids = (set (map :block/uuid blocks)) *)
             let inserted = Hashtbl.create 101 in
             List.iter
               (fun b ->
                  match mget "block/uuid" b with
                  | Some u -> Hashtbl.replace inserted u ()
                  | None -> ())
               (Wire.as_seq blocks);
             let available' =
               List.filter
                 (fun u -> not (Hashtbl.mem inserted u))
                 available
             in
             loop available' (entry' :: acc) rest
         | _ -> loop available (entry :: acc) rest)
  in
  loop (inserted_block_uuids_from_tx_data tx_data) [] ops

(* op-construct/canonical-move-op-for-block *)
let canonical_move_op_for_block db (block_id : Wire.t) (opts : Wire.t)
    : Wire.t option =
  match resolve_move_target db (Wire.Array [ block_id ]) with
  | Some (target_id, sibling) ->
      Some
        (op_entry "move-blocks"
           [ Wire.Array [ stable_entity_ref db block_id ]
           ; stable_entity_ref db (Wire.Int target_id)
           ; Cljs_map.assoc
               (Cljs_map.dissoc (or_map opts) "outliner-op")
               "sibling?" (Wire.Bool sibling) ])
  | None -> None

(* op-construct/canonicalize-indent-outdent-op — returns vec of ops *)
let canonicalize_indent_outdent_op db tx_data (ids : Wire.t) (indent : Wire.t)
    (opts : Wire.t) : Wire.t list =
  let moved_ids = moved_block_ids_from_tx_data tx_data in
  if moved_ids <> [] then begin
    let move_ops =
      List.filter_map
        (fun id -> canonical_move_op_for_block db id opts)
        moved_ids
    in
    if List.length moved_ids = List.length move_ops then move_ops
    else
      [ op_entry "indent-outdent-blocks"
          [ stable_id_coll db ids; indent; opts ] ]
  end
  else
    [ op_entry "indent-outdent-blocks"
        [ stable_id_coll db ids; indent; opts ] ]

(* op-construct/save-block-keys *)
let save_block_keys (key_names : string list) (transient_keys : string list)
    : string list =
  List.filter
    (fun k -> (not (List.mem k transient_keys)) && k <> "db/other-tx")
    key_names

let wire_map_keys (m : Wire.t) : string list =
  match m with
  | Wire.Map entries ->
      List.filter_map
        (fun (k, _) ->
           match k with
           | Wire.Keyword s | Wire.String s -> Some s
           | _ -> None)
        entries
  | _ -> []

let entity_key_names (e : entity) : string list =
  List.map (fun (a, _) -> a) (Block_map.of_entity e)

(* op-construct/block-entity *)
let block_entity (db : db) (block : Wire.t) : entity option =
  match block with
  | Wire.Map _ | Wire.Tagged ("datascript/Entity", _) ->
      (match mget "block/uuid" block with
       | Some u ->
           (match
              entity db (Lookup_ref ("block/uuid", Ds_wire.value_of_transit u))
            with
            | Some _ as e -> e
            | None ->
                (match mget "db/id" block with
                 | Some id -> entity_of_ref_wire db id
                 | None -> None))
       | None ->
           (match mget "db/id" block with
            | Some id -> entity_of_ref_wire db id
            | None -> None))
  | Wire.Int n when n >= 0 -> entity db (Entity_id n)
  | Wire.Uuid u -> entity db (Lookup_ref ("block/uuid", Uuid u))
  | Wire.Array _ | Wire.List _ -> entity_of_ref_wire db block
  | _ -> None

(* entity attr -> wire map entry, sanitized when the attr is a ref *)
let sanitized_entry_of_entity db_before (ent : entity) (k : string)
    : Wire.t * Wire.t =
  let v = Option.value (ent_attr_wire ent k) ~default:Wire.Nil in
  ( kw k
  , if ref_attr db_before k then sanitize_ref_value db_before v else v )

(* like sanitized_entry_of_entity but :block/title restores
   :block/raw-title (op-construct/build-inverse-save-block) *)
let inverse_entry_of_entity db_before (ent : entity) (k : string)
    : Wire.t * Wire.t =
  let v =
    (if k = "block/title" then
       (* cljs entity-plus/lookup-kv-then-entity :block/raw-title — journal
          pages get their formatted journal title, everything else falls back
          to :block/title *)
       (match Ldb.raw_title db_before ent with
        | Some v -> Some (Ds_wire.transit_of_value v)
        | None -> None)
     else ent_attr_wire ent k)
    |> Option.value ~default:Wire.Nil
  in
  ( kw k
  , if ref_attr db_before k then sanitize_ref_value db_before v else v )

(* op-construct/build-inverse-save-block *)
let build_inverse_save_block db_before (block : Wire.t) (opts : Wire.t)
    : Wire.t option =
  match block_entity db_before block with
  | None -> None
  | Some before_ent ->
      let keys_to_restore =
        save_block_keys (wire_map_keys block) transient_block_keys
      in
      let inverse_block =
        Wire.Map
          (( kw "block/uuid"
           , Option.value (uuid_wire_of_entity before_ent) ~default:Wire.Nil )
          :: List.map (inverse_entry_of_entity db_before before_ent)
               keys_to_restore)
      in
      Some (op_entry "save-block" [ inverse_block; opts ])

(* op-construct/build-insert-block-payload *)
let build_insert_block_payload db_before (ent : entity) : Wire.t option =
  match uuid_wire_of_entity ent with
  | None -> None
  | Some block_uuid ->
      let keys =
        save_block_keys (entity_key_names ent)
          delete_restore_transient_block_keys
        |> List.filter (fun k ->
             let name = kw_name k in
             not (String.length name > 0 && name.[0] = '_'))
      in
      Some
        (Wire.Map
           ((kw "block/uuid", block_uuid)
           :: List.map (sanitized_entry_of_entity db_before ent) keys))

(* op-construct/selected-block-roots — returns [roots incomplete] *)
let selected_block_roots db_before (ids : Wire.t) : entity list * bool =
  let resolved = List.map (block_entity db_before) (Wire.as_seq ids) in
  let incomplete = List.exists Option.is_none resolved in
  let entities =
    resolved
    |> List.fold_left
         (fun acc e ->
            match e with
            | Some e when List.exists (fun a -> a.id = e.id) acc -> acc
            | Some e -> e :: acc
            | None -> acc)
         []
    |> List.rev
  in
  let selected_ids = List.map (fun e -> e.id) entities in
  let rec has_selected_ancestor (parent : entity option) : bool =
    match parent with
    | Some p ->
        if List.mem p.id selected_ids then true
        else has_selected_ancestor (Ldb.ref_ent p "block/parent")
    | None -> false
  in
  ( List.filter
      (fun ent -> not (has_selected_ancestor (Ldb.ref_ent ent "block/parent")))
      entities
  , incomplete )

(* op-construct/block-restore-target — [target-id sibling?] *)
let block_restore_target (ent : entity) : (entity_id * bool) option =
  match Ldb.get_left_sibling ent with
  | Some left -> Some (left.id, true)
  | None ->
      (match Ldb.ref_ent ent "block/parent" with
       | Some parent -> Some (parent.id, false)
       | None ->
           (match Ldb.ref_ent ent "block/page" with
            | Some page -> Some (page.id, false)
            | None -> None))

(* op-construct/created-from-property-ref *)
let created_from_property_ref db_before (root : entity) : Wire.t option =
  match Ldb.ref_ent root "logseq.property/created-from-property" with
  | Some prop ->
      (match Ldb.ident_of prop with
       | Some ident -> Some (kw ident)
       | None ->
           Some
             (stable_entity_ref db_before
                (Ds_wire.transit_of_entity_stub (Entity_id prop.id))))
  | None -> None

(* op-construct/to-insert-op — plan is a wire map *)
let to_insert_op db_before (plan : Wire.t) : Wire.t =
  let blocks =
    match mget "blocks" plan with Some b -> b | None -> Wire.Nil
  in
  let target_id =
    match mget "target-id" plan with Some t -> t | None -> Wire.Nil
  in
  let sibling = truthy_opt (mget "sibling?" plan) in
  let created = mget "created-from-property" plan in
  let opts =
    Wire.Map
      ([ (kw "sibling?", Wire.Bool sibling)
       ; (kw "keep-uuid?", Wire.Bool true)
       ; (kw "keep-block-order?", Wire.Bool true) ]
       @ (match created with
          | Some c -> [ (kw "created-from-property", c) ]
          | None -> []))
  in
  op_entry "insert-blocks"
    [ blocks; stable_entity_ref db_before target_id; opts ]

(* op-construct/delete-root->restore-plan *)
let delete_root_to_restore_plan db_before (root : entity) : Wire.t option =
  let root_id = root.id in
  let blocks =
    match Ldb.value root "block/uuid" with
    | Some (Uuid u) ->
        List.filter_map
          (build_insert_block_payload db_before)
          (Ldb.get_block_and_children db_before ~include_property_block:true u)
    | _ -> []
  in
  let target_sibling =
    match block_restore_target root with
    | Some (target_id, _) when target_id = root_id ->
        (match Ldb.ref_ent root "block/parent" with
         | Some p -> Some (p.id, false)
         | None ->
             (match Ldb.ref_ent root "block/page" with
              | Some p -> Some (p.id, false)
              | None -> None))
    | other -> other
  in
  let created = created_from_property_ref db_before root in
  match blocks, target_sibling with
  | _ :: _, Some (target_id, sibling) ->
      Some
        (Wire.Map
           ([ (kw "blocks", Wire.Array blocks)
            ; ( kw "target-id"
              , stable_entity_ref db_before (Wire.Int target_id) )
            ; (kw "sibling?", Wire.Bool sibling) ]
            @ (match created with
               | Some c -> [ (kw "created-from-property", c) ]
               | None -> [])))
  | _ -> None

(* op-construct/build-inverse-delete-blocks — vec of restore insert ops *)
let build_inverse_delete_blocks db_before (ids : Wire.t) : Wire.t list option =
  let roots, incomplete = selected_block_roots db_before ids in
  let plans = List.map (delete_root_to_restore_plan db_before) roots in
  if (not incomplete) && roots <> [] && List.for_all Option.is_some plans then
    match List.map (to_insert_op db_before) (List.filter_map Fun.id plans) with
    | [] -> None
    | ops -> Some ops
  else None

(* op-construct/move-root->restore-op *)
let move_root_to_restore_op db_before (root : entity) : Wire.t option =
  match block_restore_target root with
  | Some (target_id, sibling) ->
      let created = created_from_property_ref db_before root in
      Some
        (op_entry "move-blocks"
           [ Wire.Array [ stable_entity_ref db_before (Wire.Int root.id) ]
           ; stable_entity_ref db_before (Wire.Int target_id)
           ; Wire.Map
               ([ (kw "sibling?", Wire.Bool sibling) ]
                @ (match created with
                   | Some c -> [ (kw "created-from-property", c) ]
                   | None -> [])) ])
  | None -> None

(* op-construct/build-inverse-move-blocks *)
let build_inverse_move_blocks db_before (ids : Wire.t) : Wire.t list option =
  let roots, incomplete = selected_block_roots db_before ids in
  let restore_ops = List.map (move_root_to_restore_op db_before) roots in
  if (not incomplete) && roots <> [] && List.for_all Option.is_some restore_ops
  then
    match List.filter_map Fun.id restore_ops with
    | [] -> None
    | ops -> Some ops
  else None

(* op-construct/page-top-level-blocks *)
let page_top_level_blocks (page : entity) : entity list =
  let page_id = page.id in
  Ldb.ref_ents page "block/_page"
  |> List.filter (fun b ->
       match Ldb.ref_ent b "block/parent" with
       | Some p -> p.id = page_id
       | None -> false)
  |> Ldb.sort_by_order

(* op-construct/entity->save-op *)
let entity_to_save_op db_before (ent : entity) : Wire.t option =
  build_inverse_save_block db_before (wire_map_of_entity ent) Wire.Nil

(* op-construct/build-inverse-delete-page *)
let build_inverse_delete_page db_before (page_uuid : Wire.t)
    : Wire.t list option =
  match
    entity db_before
      (Lookup_ref ("block/uuid", Ds_wire.value_of_transit page_uuid))
  with
  | None -> None
  | Some page ->
      let class_or_property = Ldb.is_class page || Ldb.is_property page in
      let today_page =
        match Ldb.int_value page "block/journal-day" with
        | Some day ->
            Date_time_util.ms_to_journal_day (Common_util.time_ms ()) = day
        | None -> false
      in
      let root_plans =
        List.map
          (delete_root_to_restore_plan db_before)
          (page_top_level_blocks page)
      in
      if class_or_property then begin
        let ident =
          match Ldb.ident_of page with Some i -> kw i | None -> Wire.Nil
        in
        let page_save_op =
          build_inverse_save_block db_before
            (Cljs_map.assoc (wire_map_of_entity page) "db/ident" ident)
            Wire.Nil
        in
        let create_op =
          if Ldb.is_class page then begin
            let ident_ns =
              match Ldb.ident_of page with
              | Some i -> Option.map kw (kw_namespace i)
              | None -> None
            in
            Some
              (op_entry "create-page"
                 [ Option.value
                     (ent_attr_wire page "block/title") ~default:Wire.Nil
                 ; Wire.Map
                     ([ (kw "uuid", page_uuid)
                      ; (kw "class?", Wire.Bool true)
                      ; (kw "redirect?", Wire.Bool false)
                      ; (kw "split-namespace?", Wire.Bool true) ]
                      @ (match ident_ns with
                         | Some n -> [ (kw "class-ident-namespace", n) ]
                         | None -> [])) ])
          end
          else
            Some
              (op_entry "upsert-property"
                 [ ident
                 ; wire_map_of_block_map
                     (Db_property.get_property_schema
                        (Block_map.of_entity page))
                 ; Wire.Map
                     [ ( kw "property-name"
                       , Option.value
                           (ent_attr_wire page "block/title")
                           ~default:Wire.Nil ) ] ])
        in
        let restore_root_ops =
          if List.for_all Option.is_some root_plans then
            List.map (to_insert_op db_before) (List.filter_map Fun.id root_plans)
          else []
        in
        match
          (match create_op with Some c -> [ c ] | None -> [])
          @ (match page_save_op with Some s -> [ s ] | None -> [])
          @ restore_root_ops
        with
        | [] -> None
        | ops -> Some ops
      end
      else if today_page then begin
        if List.for_all Option.is_some root_plans then
          match
            List.map (to_insert_op db_before) (List.filter_map Fun.id root_plans)
          with
          | [] -> None
          | ops -> Some ops
        else None
      end
      else Some [ op_entry "restore-recycled" [ page_uuid ] ]

(* op-construct/restore-target-insert-op *)
let restore_target_insert_op db_before db_after target_id opts : Wire.t list =
  match mget "replace-empty-target?" opts with
  | Some w when truthy w ->
      let target_ref = stable_entity_ref db_before target_id in
      (match entity_of_ref_wire db_after target_ref with
       | Some _ ->
           (match entity_of_ref_wire db_before target_ref with
            | Some target ->
                let insert_block =
                  Option.value
                    (build_insert_block_payload db_before target)
                    ~default:Wire.Nil
                in
                let tid, sibling =
                  match resolve_target_and_sibling target with
                  | Some (t, s) -> (Wire.Int t, s)
                  | None -> (Wire.Nil, false)
                in
                [ op_entry "delete-blocks"
                    [ Wire.Array [ target_ref ]; Wire.Map [] ]
                ; to_insert_op db_before
                    (Wire.Map
                       [ (kw "blocks", Wire.Array [ insert_block ])
                       ; ( kw "target-id"
                         , stable_entity_ref db_before tid )
                       ; (kw "sibling?", Wire.Bool sibling) ]) ]
            | None -> [])
       | None -> [])
  | _ -> []

(* op-construct/build-inverse-insert-like *)
let build_inverse_insert_like db_before db_after tx_data (args : Wire.t list)
    : Wire.t list option =
  let target_id = arg args 1 and opts = arg args 2 in
  let new_block_refs =
    List.filter_map
      (fun d ->
         match
           ( item_get "a" d
           , item_get "added" d
           , item_get "e" d
           , item_get "v" d )
         with
         | Some (Wire.Keyword "block/uuid"), Some (Wire.Bool true), Some e, Some v
           when Option.is_none (entity_of_ref_wire db_before e) ->
             Some (Wire.Array [ kw "block/uuid"; v ])
         | _ -> None)
      tx_data
  in
  let restore_ops =
    restore_target_insert_op db_before db_after target_id opts
  in
  match
    (match new_block_refs with
     | [] -> []
     | _ ->
         [ op_entry "delete-blocks"
             [ Wire.Array new_block_refs; Wire.Map [] ] ])
    @ restore_ops
  with
  | [] -> None
  | ops -> Some ops

(* op-construct/canonicalize-semantic-outliner-op — returns a single op
   entry or a vector of op entries (indent-outdent may expand) *)
let canonicalize_semantic_outliner_op db tx_data (entry : Wire.t) : Wire.t =
  match Outliner_op.op_of_entry entry with
  | None -> entry
  | Some (op, args) ->
      (match op with
       | "save-block" ->
           let created_uuids = created_block_uuids_from_tx_data tx_data in
           op_entry "save-block"
             [ sanitize_block_payload db ~created_uuids ~tx_data (arg args 0)
             ; arg args 1 ]
       | "insert-blocks" ->
           op_entry "insert-blocks"
             (canonicalize_insert_blocks_op db tx_data args
                (inserted_block_uuids_from_tx_data tx_data))
       | "apply-template" ->
           canonicalize_template_op db tx_data args
             (inserted_block_uuids_from_tx_data tx_data)
       | "move-blocks-up-down" ->
           op_entry "move-blocks-up-down"
             [ stable_id_coll db (arg args 0); arg args 1 ]
       | "indent-outdent-blocks" ->
           Wire.Array
             (canonicalize_indent_outdent_op db tx_data (arg args 0)
                (arg args 1) (arg args 2))
       | "move-blocks" ->
           op_entry "move-blocks"
             [ stable_id_coll db (arg args 0)
             ; stable_block_ref_with_tx_data db tx_data (arg args 1)
             ; arg args 2 ]
       | "delete-blocks" ->
           op_entry "delete-blocks"
             [ maybe_rewrite_delete_block_ids db tx_data (arg args 0)
             ; arg args 1 ]
       | "create-page" ->
           let title = arg args 0 and opts = arg args 1 in
           let page_uuid = created_page_uuid_from_tx_data tx_data title in
           op_entry "create-page"
             [ title
             ; (match page_uuid with
                | Some u -> Cljs_map.assoc (or_map opts) "uuid" u
                | None -> or_map opts) ]
       | "rename-page" ->
           op_entry "save-block"
             [ Wire.Map
                 [ (kw "block/uuid", stable_block_uuid db (arg args 0))
                 ; (kw "block/title", arg args 1) ]
             ; Wire.Map [] ]
       | "delete-page" ->
           op_entry "delete-page"
             [ stable_block_uuid db (arg args 0); arg args 1 ]
       | "restore-recycled" ->
           op_entry "restore-recycled" [ stable_block_uuid db (arg args 0) ]
       | "recycle-delete-permanently" ->
           op_entry "recycle-delete-permanently"
             [ stable_block_uuid db (arg args 0) ]
       | "upsert-property" ->
           let property_id = arg args 0 in
           let property_id' =
             match stable_entity_ref db property_id with
             | Wire.Nil ->
                 (match
                    property_ident_by_title db
                      (match mget "property-name" (arg args 2) with
                       | Some v -> v
                       | None -> Wire.Nil)
                  with
                  | Some ident -> ident
                  | None ->
                      Option.value
                        (created_db_ident_from_tx_data tx_data)
                        ~default:Wire.Nil)
             | r -> r
           in
           op_entry "upsert-property"
             [ property_id'; arg args 1; arg args 2 ]
       | _ -> entry)

(* op-construct/build-strict-inverse-outliner-ops *)
let build_strict_inverse_outliner_ops db_before db_after tx_data
    (forward_ops : Wire.t list) (forward_op_group_sizes : int list)
    : Wire.t list option =
  if forward_ops = [] then None
  else begin
    let inverse_entries =
      List.map
        (fun op_wire ->
           match Outliner_op.op_of_entry op_wire with
           | None -> None
           | Some (op, args) ->
               (match op with
                | "save-block" ->
                    Option.map
                      (fun o -> [ o ])
                      (build_inverse_save_block db_before (arg args 0)
                         (arg args 1))
                | "insert-blocks" | "apply-template" ->
                    build_inverse_insert_like db_before db_after tx_data args
                | "move-blocks" ->
                    build_inverse_move_blocks db_before (arg args 0)
                | "indent-outdent-blocks" ->
                    Some
                      [ op_entry "indent-outdent-blocks"
                          [ stable_id_coll db_before (arg args 0)
                          ; Wire.Bool (not (truthy (arg args 1)))
                          ; arg args 2 ] ]
                | "move-blocks-up-down" ->
                    Some
                      [ op_entry "move-blocks-up-down"
                          [ stable_id_coll db_before (arg args 0)
                          ; Wire.Bool (not (truthy (arg args 1))) ] ]
                | "delete-blocks" ->
                    build_inverse_delete_blocks db_before (arg args 0)
                | "create-page" ->
                    (match mget "uuid" (arg args 1) with
                     | Some page_uuid ->
                         Some
                           [ op_entry "delete-page"
                               [ page_uuid; Wire.Map [] ] ]
                     | None -> None)
                | "delete-page" ->
                    build_inverse_delete_page db_before (arg args 0)
                | "upsert-property" ->
                    (match arg args 0 with
                     | Wire.Keyword ident when String.contains ident '/' ->
                         (match entity db_before (Ident ident) with
                          | Some property ->
                              Some
                                [ op_entry "upsert-property"
                                    [ kw ident
                                    ; sanitize_upsert_property_schema
                                        db_before
                                        (wire_map_of_block_map
                                           (Db_property.get_property_schema
                                              (Block_map.of_entity property)))
                                    ; Wire.Map
                                        [ ( kw "property-name"
                                          , Option.value
                                              (ent_attr_wire property
                                                 "block/title")
                                              ~default:Wire.Nil ) ] ] ]
                          | None ->
                              Some
                                [ op_entry "delete-page"
                                    [ Wire.Uuid
                                        (Common_uuid.gen_uuid
                                           "db-ident-block-uuid" ident)
                                    ; Wire.Map [] ] ])
                     | _ -> None)
                | _ -> None))
        forward_ops
    in
    (* any missing inverse entry means the whole semantic inverse is
       incomplete — the caller falls back to raw reversed tx *)
    if List.for_all Option.is_some inverse_entries then begin
      let entries = List.map Option.get inverse_entries in
      let rec partition entries sizes acc =
        match sizes with
        | size :: rest ->
            let group, remaining = split_at size entries in
            partition remaining rest (group :: acc)
        | [] -> acc
      in
      match
        partition entries forward_op_group_sizes []
        |> List.concat |> List.concat
      with
      | [] -> None
      | ops -> Some ops
    end
    else None
  end

(* op-construct/has-replace-empty-target-insert-op? *)
let has_replace_empty_target_insert_op (forward_ops : Wire.t list) : bool =
  List.exists
    (fun w ->
       match Outliner_op.op_of_entry w with
       | Some (("insert-blocks" | "apply-template"), args) ->
           truthy_opt (mget "replace-empty-target?" (arg args 2))
       | _ -> false)
    forward_ops

(* op-construct/contains-transact-op? *)
let contains_transact_op (ops : Wire.t) : bool =
  let entries =
    match ops with
    | Wire.Nil -> []
    | (Wire.Array xs | Wire.List xs) as w ->
        (match xs with
         | Wire.Keyword _ :: _ -> [ w ]
         | _ -> xs)
    | _ -> [ ops ]
  in
  List.exists
    (fun entry ->
       match entry with
       | Wire.Array (Wire.Keyword "transact" :: _)
       | Wire.List (Wire.Keyword "transact" :: _) -> true
       | _ -> false)
    entries

(* op-construct/normalize-op-entries *)
let normalize_op_entries (ops : Wire.t) : Wire.t list option =
  match Wire.as_seq ops with
  | [] -> None
  | xs ->
      (match xs with
       | Wire.Keyword _ :: Wire.Array _ :: _ -> Some [ ops ]
       | _ -> Some xs)

(* op-construct/canonical-block-id *)
let canonical_block_id db (block_id : Wire.t) : Wire.t =
  match block_id with
  | Wire.Uuid _ -> block_id
  | Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid _ ] ->
      Option.value (nth_wire block_id 1) ~default:Wire.Nil
  | Wire.Int n when n >= 0 -> stable_block_uuid db block_id
  | _ -> block_id

(* op-construct/canonical-property-id *)
let canonical_property_id db (property_id : Wire.t) : Wire.t =
  match property_id with
  | Wire.Keyword _ when is_qualified_kw property_id -> property_id
  | Wire.Int n when n >= 0 ->
      (match entity db (Entity_id n) with
       | Some e ->
           (match Ldb.ident_of e with
            | Some i -> kw i
            | None -> property_id)
       | None -> property_id)
  | _ -> property_id

(* op-construct/normalize-block-op-entry-ids *)
let normalize_block_op_entry_ids id ids (op : string) (args : Wire.t list)
    : Wire.t option =
  match op with
  | "save-block" -> Some (op_entry op [ arg args 0; arg args 1 ])
  | "insert-blocks" ->
      Some (op_entry op [ arg args 0; id (arg args 1); List.nth args 2 ])
  | "apply-template" ->
      Some (op_entry op [ id (arg args 0); id (arg args 1); List.nth args 2 ])
  | "delete-blocks" ->
      Some (op_entry op [ ids (arg args 0); arg args 1 ])
  | "move-blocks" ->
      Some (op_entry op [ ids (arg args 0); id (arg args 1); List.nth args 2 ])
  | "move-blocks-up-down" ->
      Some (op_entry op [ ids (arg args 0); arg args 1 ])
  | "indent-outdent-blocks" ->
      Some (op_entry op [ ids (arg args 0); arg args 1; List.nth args 2 ])
  | _ -> None

(* op-construct/normalize-property-op-entry-ids *)
let normalize_property_op_entry_ids id ids pid (op : string)
    (args : Wire.t list) : Wire.t option =
  match op with
  | "set-block-property" ->
      Some (op_entry op [ id (arg args 0); pid (arg args 1); List.nth args 2 ])
  | "remove-block-property" ->
      Some (op_entry op [ id (arg args 0); pid (arg args 1) ])
  | "delete-property-value" ->
      Some (op_entry op [ id (arg args 0); pid (arg args 1); List.nth args 2 ])
  | "create-property-text-block" ->
      Some
        (op_entry op
           [ id (arg args 0); pid (arg args 1); List.nth args 2
           ; List.nth args 3 ])
  | "batch-set-property" ->
      Some
        (op_entry op
           [ ids (arg args 0); pid (arg args 1); List.nth args 2
           ; List.nth args 3 ])
  | "batch-remove-property" ->
      Some (op_entry op [ ids (arg args 0); pid (arg args 1) ])
  | "batch-delete-property-value" ->
      Some (op_entry op [ ids (arg args 0); pid (arg args 1); List.nth args 2 ])
  | "class-add-property" ->
      Some (op_entry op [ id (arg args 0); pid (arg args 1) ])
  | "class-remove-property" ->
      Some (op_entry op [ id (arg args 0); pid (arg args 1) ])
  | "upsert-property" ->
      Some (op_entry op [ pid (arg args 0); arg args 1; List.nth args 2 ])
  | "upsert-closed-value" ->
      Some (op_entry op [ pid (arg args 0); arg args 1 ])
  | "delete-closed-value" ->
      Some (op_entry op [ pid (arg args 0); id (arg args 1) ])
  | "add-existing-values-to-closed-values" ->
      Some (op_entry op [ pid (arg args 0); arg args 1 ])
  | _ -> None

(* op-construct/normalize-op-entry-ids *)
let normalize_op_entry_ids db (entry : Wire.t) : Wire.t =
  match Outliner_op.op_of_entry entry with
  | Some (op, args) ->
      let id v = canonical_block_id db v in
      let pid v = canonical_property_id db v in
      let ids vs = Wire.Array (List.map id (Wire.as_seq vs)) in
      (match normalize_block_op_entry_ids id ids op args with
       | Some w -> w
       | None ->
           (match normalize_property_op_entry_ids id ids pid op args with
            | Some w -> w
            | None -> entry))
  | None -> entry

(* op-construct/canonicalize-explicit-outliner-op-groups *)
let canonicalize_explicit_outliner_op_groups db tx_data (ops : Wire.t)
    : Wire.t list list option =
  match normalize_op_entries ops with
  | Some (_ :: _ as entries) ->
      (* master: share the inserted-uuid pool across insert ops, and
         skip re-canonicalization of insert-blocks/apply-template *)
      let entries = canonicalize_insert_ops db tx_data entries in
      Some
        (List.map
           (fun entry ->
              let canonical =
                match Outliner_op.op_of_entry entry with
                | Some (("insert-blocks" | "apply-template"), _) -> entry
                | _ -> canonicalize_semantic_outliner_op db tx_data entry
              in
              match canonical with
              | Wire.Array ((Wire.Array _ | Wire.List _) :: _)
              | Wire.List ((Wire.Array _ | Wire.List _) :: _) ->
                  Wire.as_seq canonical
              | _ -> [ canonical ])
           entries)
  | _ -> None

(* op-construct/canonicalize-explicit-outliner-ops *)
let canonicalize_explicit_outliner_ops db tx_data (ops : Wire.t)
    : Wire.t list option =
  match canonicalize_explicit_outliner_op_groups db tx_data ops with
  | Some groups -> Some (List.concat groups)
  | None -> None

(* op-construct/patch-inverse-delete-block-ops *)
let patch_inverse_delete_block_ops (inverse_ops : Wire.t list)
    (forward_ops : Wire.t list) : Wire.t list =
  let forward_insert_ops =
    ref
      (forward_ops
       |> List.rev
       |> List.filter (fun w ->
            match Outliner_op.op_of_entry w with
            | Some (("insert-blocks" | "apply-template"), _) -> true
            | _ -> false))
  in
  let inserted_ids_of (w : Wire.t) : Wire.t list =
    match Outliner_op.op_of_entry w with
    | Some (op, args) ->
        let blocks =
          match op with
          | "insert-blocks" -> arg args 0
          | "apply-template" ->
              Option.value
                (mget "template-blocks" (arg args 2)) ~default:Wire.Nil
          | _ -> Wire.Nil
        in
        List.filter_map
          (fun block ->
             match mget "block/uuid" block with
             | Some u -> Some (Wire.Array [ kw "block/uuid"; u ])
             | None -> None)
          (Wire.as_seq blocks)
    | None -> []
  in
  List.map
    (fun w ->
       match Outliner_op.op_of_entry w with
       | Some ("delete-blocks", args) when !forward_insert_ops <> [] ->
           let ids = inserted_ids_of (List.hd !forward_insert_ops) in
           forward_insert_ops := List.tl !forward_insert_ops;
           if ids <> [] then
             op_entry "delete-blocks" [ Wire.Array ids; arg args 1 ]
           else w
       | _ -> w)
    inverse_ops

(* op-construct/patch-forward-delete-block-op-ids *)
let patch_forward_delete_block_op_ids db_before (ops : Wire.t list)
    : Wire.t list =
  List.map
    (fun w ->
       match Outliner_op.op_of_entry w with
       | Some ("delete-blocks", args) ->
           op_entry "delete-blocks"
             [ stable_id_coll db_before (arg args 0); arg args 1 ]
       | _ -> w)
    ops

(* op-construct/canonicalize-outliner-op-groups *)
let meta_get (k : string) (tx_meta : (Wire.t * Wire.t) list) : Wire.t option =
  List.assoc_opt (kw k) tx_meta

let canonicalize_outliner_op_groups db (tx_meta : (Wire.t * Wire.t) list)
    (tx_data : Wire.t list) : Wire.t list list option =
  let explicit_forward =
    match meta_get "db-sync/forward-outliner-ops" tx_meta with
    | Some w -> normalize_op_entries w
    | None -> None
  in
  let outliner_ops =
    match meta_get "outliner-ops" tx_meta with
    | Some w -> normalize_op_entries w
    | None -> None
  in
  match explicit_forward, outliner_ops with
  | Some (_ :: _ as e), _ ->
      canonicalize_explicit_outliner_op_groups db tx_data (Wire.Array e)
  | _, Some (_ :: _ as o) ->
      canonicalize_explicit_outliner_op_groups db tx_data (Wire.Array o)
  | _ -> None

(* ---- stale numeric id checks ---- *)

(* op-construct/unresolved-numeric-entity-id? *)
let unresolved_numeric_entity_id (x : Wire.t) : bool =
  match x with Wire.Int n -> n >= 0 | _ -> false

(* op-construct/numeric-id-in-ref-value? *)
let rec numeric_id_in_ref_value (v : Wire.t) : bool =
  match v with
  | Wire.Int _ -> unresolved_numeric_entity_id v
  | Wire.Set xs | Wire.List xs | Wire.Array xs ->
      List.exists numeric_id_in_ref_value xs
  | _ -> false

(* op-construct/numeric-id-in-block-ref-attrs? *)
let numeric_id_in_block_ref_attrs db (block : Wire.t) : bool =
  match block with
  | Wire.Map entries ->
      List.exists
        (fun (k, v) ->
           match k with
           | Wire.Keyword name | Wire.String name ->
               ref_attr db name && numeric_id_in_ref_value v
           | _ -> false)
        entries
  | _ -> false

(* op-construct/stale-numeric-id-in-page-ops? *)
let stale_numeric_id_in_page_ops db (op : string) (args : Wire.t list) : bool =
  match op with
  | "save-block" -> numeric_id_in_block_ref_attrs db (arg args 0)
  | "insert-blocks" ->
      List.exists
        (numeric_id_in_block_ref_attrs db)
        (Wire.as_seq (arg args 0))
      || unresolved_numeric_entity_id (arg args 1)
  | "create-page" ->
      unresolved_numeric_entity_id
        (match mget "uuid" (arg args 1) with Some v -> v | None -> Wire.Nil)
  | "rename-page" -> unresolved_numeric_entity_id (arg args 0)
  | "delete-page" -> unresolved_numeric_entity_id (arg args 0)
  | "restore-recycled" -> unresolved_numeric_entity_id (arg args 0)
  | "apply-template" ->
      unresolved_numeric_entity_id (arg args 0)
      || unresolved_numeric_entity_id (arg args 1)
      || List.exists
           (numeric_id_in_block_ref_attrs db)
           (Wire.as_seq
              (Option.value
                 (mget "template-blocks" (arg args 2)) ~default:Wire.Nil))
  | "recycle-delete-permanently" -> unresolved_numeric_entity_id (arg args 0)
  | _ -> false

(* op-construct/stale-numeric-id-in-schema-ops? *)
let stale_numeric_id_in_schema_ops (op : string) (args : Wire.t list) : bool =
  match op with
  | "upsert-property" -> unresolved_numeric_entity_id (arg args 0)
  | _ -> false

(* op-construct/stale-numeric-id-in-op? *)
let stale_numeric_id_in_op db (entry : Wire.t) : bool =
  match Outliner_op.op_of_entry entry with
  | Some ("transact", _) -> false
  | Some (op, args) ->
      stale_numeric_id_in_page_ops db op args
      || stale_numeric_id_in_schema_ops op args
  | None -> false

(* op-construct/assert-no-stale-numeric-ids! *)
let assert_no_stale_numeric_ids db (ops : Wire.t list) (stage : string)
    : unit =
  match
    List.find_mapi
      (fun idx entry ->
         if stale_numeric_id_in_op db entry then Some (idx, entry) else None)
      ops
  with
  | Some (idx, entry) ->
      (* cljs ex-info message; stage/index/op detail goes in ex-data *)
      raise
        (Dispatcher.Exn_info
           ( "Non-transact outliner ops contain numeric entity ids"
           , [ Wire.Keyword "stage", Wire.String stage
             ; Wire.Keyword "index", Wire.Int idx
             ; Wire.Keyword "op", entry ] ))
  | None -> ()

(* op-construct/assert-no-numeric-entity-ids! *)
let assert_no_numeric_entity_ids db (ops : Wire.t list) (stage : string)
    : unit =
  assert_no_stale_numeric_ids db ops stage

(* op-construct/derive-history-outliner-ops *)
let derive_history_outliner_ops db_before db_after tx_data tx_meta
    : Wire.t * Wire.t =
  let canonical_forward_op_groups =
    match canonicalize_outliner_op_groups db_after tx_meta tx_data with
    | None -> []
    | Some groups ->
        List.map
          (fun group ->
             group
             |> patch_forward_delete_block_op_ids db_before
             |> List.map (normalize_op_entry_ids db_after))
          groups
  in
  let forward_ops = List.concat canonical_forward_op_groups in
  assert_no_stale_numeric_ids db_after forward_ops "forward-outliner-ops";
  let forward_op_group_sizes =
    List.map List.length canonical_forward_op_groups
  in
  let built_inverse_ops =
    match
      build_strict_inverse_outliner_ops db_before db_after tx_data forward_ops
        forward_op_group_sizes
    with
    | None -> []
    | Some ops -> List.map (normalize_op_entry_ids db_before) ops
  in
  assert_no_stale_numeric_ids db_before built_inverse_ops
    "built-inverse-outliner-ops";
  let explicit_inverse_ops =
    match
      (match meta_get "db-sync/inverse-outliner-ops" tx_meta with
       | Some w -> canonicalize_explicit_outliner_ops db_after tx_data w
       | None -> None)
    with
    | None -> []
    | Some ops ->
        ops
        |> (fun o -> patch_inverse_delete_block_ops o forward_ops)
        |> List.map (normalize_op_entry_ids db_after)
  in
  assert_no_stale_numeric_ids db_after explicit_inverse_ops
    "explicit-inverse-outliner-ops";
  let is_apply_template_undo =
    (match meta_get "outliner-op" tx_meta with
     | Some (Wire.Keyword "apply-template") -> true
     | _ -> false)
    && truthy_opt (meta_get "undo?" tx_meta)
    &&
    (match meta_get "db-sync/inverse-outliner-ops" tx_meta with
     | Some w -> Wire.as_seq w <> []
     | None -> false)
  in
  let inverse_ops =
    if is_apply_template_undo then explicit_inverse_ops
    else if has_replace_empty_target_insert_op forward_ops then built_inverse_ops
    else if built_inverse_ops <> [] then built_inverse_ops
    else explicit_inverse_ops
  in
  let inverse_ops = List.map (normalize_op_entry_ids db_before) inverse_ops in
  assert_no_stale_numeric_ids db_before inverse_ops "inverse-outliner-ops";
  ( (match forward_ops with [] -> Wire.Nil | _ -> Wire.Array forward_ops)
  , (match inverse_ops with [] -> Wire.Nil | _ -> Wire.Array inverse_ops) )

(* Sync_deps slots bound from Sync_apply module init — Sync_apply is the
   only caller and keeping the references there keeps this module in the
   link closure (dead-module elimination drops unreferenced units). *)
