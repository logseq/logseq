(* deps/outliner block maps — cljs { :block/uuid u :block/parent <ref> ... }
   entities threaded through the outliner write ops. Ported as immutable
   assoc lists of attr -> value (Jane-Street style: closed value type,
   no dynamic maps). *)

open Datascript

type t = (attr * value) list

let empty : t = []

let attr_value (m : t) (a : attr) : value option =
  match List.find_opt (fun (k, _) -> k = a) m with
  | Some (_, v) -> Some v
  | None -> None

let mem (m : t) (a : attr) : bool =
  List.exists (fun (k, _) -> k = a) m

let put (m : t) (a : attr) (v : value) : t =
  (a, v) :: List.remove_assoc a m

let remove_attr (m : t) (a : attr) : t =
  List.remove_assoc a m

let merge (base : t) (over : t) : t =
  List.fold_left (fun acc (k, v) -> put acc k v) base over

(* cljs (dissoc m k1 k2 ...) *)
let dissoc (m : t) (attrs : attr list) : t =
  List.filter (fun (k, _) -> not (List.mem k attrs)) m

let keys (m : t) : attr list = List.map fst m

(* ---- typed getters (cljs keyword get semantics) ---- *)

let string_attr (m : t) (a : attr) : string option =
  match attr_value m a with Some (String s) -> Some s | _ -> None

let int_attr (m : t) (a : attr) : int option =
  match attr_value m a with Some (Int n) -> Some n | _ -> None

let bool_attr (m : t) (a : attr) : bool option =
  match attr_value m a with Some (Bool b) -> Some b | _ -> None

let uuid_attr (m : t) (a : attr) : string option =
  match attr_value m a with Some (Uuid s) -> Some s | _ -> None

let blank_title (m : t) : bool =
  match string_attr m "block/title" with
  | Some s -> Unicode.trim s = ""
  | None -> false

(* Values that act as entity refs: Ref, Ref_to, Int, Map{db/id},
   lookup vectors [ :block/uuid u ], and idents (Keyword). *)
(* Negative ids are cljs datascript tempids; the engine takes them as
   Temp_id, never Entity_id *)
let id_ref_of (n : entity_id) : entity_ref =
  if n < 0 then Temp_id (string_of_int n) else Entity_id n

let rec entity_ref_of_value (v : value) : entity_ref option =
  match v with
  | Ref n -> Some (id_ref_of n)
  | Int n -> Some (id_ref_of n)
  | Ref_to r -> Some r
  | Keyword s -> Some (Ident s)
  | String s -> Some (Temp_id s)
  | Vector [ Keyword a; v' ] | List [ Keyword a; v' ] ->
    Some (Lookup_ref (a, v'))
  | Map kvs ->
    (match List.find_opt (fun (k, _) -> k = Keyword "db/id") kvs with
     | Some (_, v) ->
         (match entity_ref_of_value v with
          | Some r -> Some r
          | None ->
            (match List.find_opt (fun (k, _) -> k = Keyword "block/uuid") kvs with
             | Some (_, Uuid u) -> Some (Lookup_ref ("block/uuid", Uuid u))
             | Some (_, String u) -> Some (Lookup_ref ("block/uuid", Uuid u))
             | _ -> None))
     | None ->
       (match List.find_opt (fun (k, _) -> k = Keyword "block/uuid") kvs with
        | Some (_, Uuid u) -> Some (Lookup_ref ("block/uuid", Uuid u))
        | Some (_, String u) -> Some (Lookup_ref ("block/uuid", Uuid u))
        | _ -> None))
  | _ -> None

let ref_attr (m : t) (a : attr) : entity_ref option =
  match attr_value m a with
  | Some v -> entity_ref_of_value v
  | None -> None

let id_attr (m : t) (a : attr) : entity_id option =
  match ref_attr m a with
  | Some (Entity_id n) -> Some n
  | _ -> None

(* Many-valued ref position (:block/parent lists, :block/refs). *)
let ref_list_attr (m : t) (a : attr) : entity_ref list =
  match attr_value m a with
  | Some (List vs) | Some (Vector vs) | Some (Set vs) ->
    List.filter_map entity_ref_of_value vs
  | _ -> []

(* ---- conversions ---- *)

(* Normalize a decoded transit value into a block-map value: entity
   shapes ({:db/id n}, lookup vectors) collapse to Ref/Ref_to so getters
   see refs. Plain Maps stay Maps (nested tx entities). *)
let rec normalize_value (v : value) : value =
  match v with
  | Map kvs ->
    let is_kw_key name (k, _) = k = Keyword name in
    let has_only_db_id =
      List.length kvs = 1 && List.exists (is_kw_key "db/id") kvs
    in
    if has_only_db_id then
      (match entity_ref_of_value (Map kvs) with
       | Some (Entity_id n) -> Ref n
       | Some r -> Ref_to r
       | None -> Map kvs)
    else Map (List.map (fun (k, x) -> (k, normalize_value x)) kvs)
  | Vector [ Keyword a; x ] | List [ Keyword a; x ] ->
    (match x with
     | Uuid _ | String _ | Int _ | Keyword _
       when Db_schema.is_unique_identity_attr a ->
       (* lookup-ref like [:block/uuid u]; a non-unique head makes the
          pair an ordinary collection value (datascript
          maybe-wrap-multival), resolved later against the live schema *)
       Ref_to (Lookup_ref (a, x))
     | _ -> Vector [ Keyword a; normalize_value x ])
  | Vector vs -> Vector (List.map normalize_value vs)
  | List vs -> List (List.map normalize_value vs)
  | Set vs -> Set (List.map normalize_value vs)
  | _ -> v

let of_transit (t : Wire.t) : t =
  match t with
  | Wire.Map kvs ->
    List.filter_map
      (fun (k, v) ->
        match k with
        | Wire.Keyword a -> Some (a, normalize_value (Ds_wire.value_of_transit v))
        | Wire.String a -> Some (a, normalize_value (Ds_wire.value_of_transit v))
        | _ -> None)
      kvs
  | _ -> invalid_arg "block-map expects a transit map"

(* entity -> block map (cljs (into {} e) + {:db/id ...} callers add
   db/id separately where needed) *)
let of_entity (e : entity) : t =
  let attrs =
    List.filter_map
      (fun (a, tv) ->
        (* cljs (into {} entity) yields forward attrs only *)
        if
          String.length a > 1
          && String.contains a '/'
          && a.[String.index a '/' + 1] = '_'
        then None
        else
        match tv with
        | One_value v -> Some (a, v)
        | Many_values vs -> Some (a, List vs)
        | One_entity te ->
          (match te.db_id with
           | Some r -> Some (a, Ref_to r)
           | None -> None)
        | Many_entities tes ->
          Some (a, List (List.filter_map (fun te ->
              match te.db_id with Some r -> Some (Ref_to r) | None -> None) tes)))
      (entity_attrs e)
  in
  ("db/id", Ref e.id) :: attrs

(* Schema attributes declared by entities inside the same tx — cljs
   resolves them on the progressively updated schema during transact, but
   tx values are converted once up front, so the declarations are
   collected beforehand. *)
type schema_hint =
  { ref_attrs : attr list
  ; many_attrs : attr list
  ; unique_attrs : attr list }

let empty_hint = { ref_attrs = []; many_attrs = []; unique_attrs = [] }

let schema_hint_of_bms (ms : t list) : schema_hint =
  List.fold_left
    (fun hint m ->
      match attr_value m "db/ident" with
      | Some (Keyword i) | Some (String i) ->
        let is_ref =
          match attr_value m "db/valueType" with
          | Some (Keyword "db.type/ref") | Some (String "db.type/ref") -> true
          | _ -> false
        and is_many =
          match attr_value m "db/cardinality" with
          | Some (Keyword "db.cardinality/many")
          | Some (String "db.cardinality/many") -> true
          | _ -> false
        and is_unique = attr_value m "db/unique" <> None in
        { ref_attrs = (if is_ref then i :: hint.ref_attrs else hint.ref_attrs)
        ; many_attrs = (if is_many then i :: hint.many_attrs else hint.many_attrs)
        ; unique_attrs =
            (if is_unique then i :: hint.unique_attrs else hint.unique_attrs) }
      | _ -> hint)
    empty_hint ms

(* block map value -> tx_value, resolving refs by attr schema *)
let rec value_to_tx_value
          (db : db) ?(hint : schema_hint option) (a : attr) (v : value)
  : tx_value option =
  let hint = match hint with Some h -> h | None -> empty_hint in
  let tx_entity_of_ref (r : entity_ref) : tx_entity =
    { db_id = Some r; attrs = [] }
  and tx_entity_of_map (kvs : (value * value) list) : tx_entity option =
    (* nested map -> tx_entity with keyword keys *)
    let attrs, db_id =
      List.fold_left
        (fun (attrs, db_id) (k, v) ->
          match k with
          | Keyword "db/id" | String "db/id" ->
            (attrs, entity_ref_of_value (Map [ (k, v) ]) )
          | Keyword a | String a ->
            (match value_to_tx_value db ~hint a (normalize_value v) with
             | Some tv -> ((a, tv) :: attrs, db_id)
             | None -> (attrs, db_id))
          | _ -> (attrs, db_id))
        ([], None) kvs
    in
    if attrs = [] && db_id = None then None
    else Some { db_id; attrs = List.rev attrs }
  in
  let ref_ok = Ldb.ref_attr db a || List.mem a hint.ref_attrs
  and many_ok = Ldb.many_attr db a || List.mem a hint.many_attrs
  and unique_of (a' : attr) : bool =
    Ldb.unique_attr db a' || List.mem a' hint.unique_attrs
  in
  match v with
  | Nil -> None
  | Ref n -> Some (One_entity (tx_entity_of_ref (id_ref_of n)))
  | Ref_to r -> Some (One_entity (tx_entity_of_ref r))
  | Keyword s when ref_ok -> Some (One_entity (tx_entity_of_ref (Ident s)))
  | Int n when ref_ok -> Some (One_entity (tx_entity_of_ref (id_ref_of n)))
  (* datascript maybe-wrap-multival: a 2-element collection in ref position
     is a lookup-ref only when its first element is a :db.unique/identity
     attr — it must reach the engine as Lookup_ref so unresolved ones throw
     "Nothing found for entity id". A 2-element collection of ordinary
     idents (e.g. class/properties idents) expands as a collection. *)
  | (Vector [ Keyword la; _ ] | List [ Keyword la; _ ]) as v
    when ref_ok && Db_schema.is_unique_identity_attr la ->
      Some (One_entity (tx_entity_of_ref (Option.get (entity_ref_of_value v))))
  | Map kvs ->
    (match tx_entity_of_map kvs with
     | Some te -> Some (One_entity te)
     | None -> None)
  (* cljs datascript maybe-wrap-multival: a [:a v] pair stays a single
     (lookup-ref) value unless the outer attr is :db.cardinality/many and
     the head attr is not :db/unique — transact resolves the pair against
     the live schema *)
  | (List [ Keyword a'; _ ] | Vector [ Keyword a'; _ ]) as v
      when unique_of a' || not many_ok ->
    Some (One_value v)
  | (List _ | Vector _ | Set _) when not many_ok ->
    (* cljs maybe-wrap-multival: a non-multival attr keeps the whole
       collection as a single value *)
    Some (One_value v)
  | List vs | Vector vs | Set vs ->
    let items = List.map (normalize_value) vs in
    let te_of_item x =
      match x with
      | Map kvs ->
          (* nested map values are nested entities upstream — a
             {:block/uuid u, ...attrs} map upserts by its unique attrs
             instead of resolving as a strict lookup-ref *)
          tx_entity_of_map kvs
      | _ ->
          (match entity_ref_of_value x with
           | Some r -> Some (tx_entity_of_ref r)
           | None -> None)
    in
    if ref_ok then
      (* cljs maybe-wrap-multival explodes the collection only for a
         multival attr; on a ref attr each item resolves to an entity
         (idents, lookup refs, eids, nested entity maps via upsert). On a
         non-ref attr items are stored literally — e.g. :keyword-typed
         multival props like :logseq.property.table/hidden-columns keep
         raw keyword datoms. *)
      let tes = List.map te_of_item items in
      if List.for_all Option.is_some tes then
        Some (Many_entities (List.filter_map Fun.id tes))
      else Some (Many_values items)
    else
      Some (Many_values items)
  | _ -> Some (One_value v)

let to_tx_entity (db : db) ?(hint : schema_hint option) (m : t) : tx_entity =
  let db_id = ref_attr m "db/id" in
  let attrs =
    List.filter_map
      (fun (a, v) ->
        if a = "db/id" then None
        else
          match value_to_tx_value db ?hint a v with
          | Some tv -> Some (a, tv)
          | None -> None)
      m
  in
  { db_id; attrs }

let to_tx_op (db : db) ?(hint : schema_hint option) (m : t) : tx_op =
  Entity (to_tx_entity db ?hint m)

(* cljs (into {} ...) back to a transit map with keyword keys — the
   wire-map form the outliner op arg decoders (save_opts_of et al)
   consume. *)
let to_transit (m : t) : Wire.t =
  Ds_wire.transit_of_value
    (Map (List.map (fun (a, v) -> (Keyword a, v)) m))
