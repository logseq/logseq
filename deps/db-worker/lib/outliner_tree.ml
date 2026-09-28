(* logseq.outliner.tree — vec-tree construction over pulled block
   maps (subset: blocks->vec-tree / blocks->vec-tree-data). *)

open Datascript

let kw s = Wire.Keyword s

let pulled_parent_id (p : pulled_entity) : entity_id option =
  match List.assoc_opt (Keyword "block/parent") p.pulled_attrs with
  | Some (Pulled_entity par) -> Some par.pulled_id
  | Some (Pulled_scalar (Ref id)) -> Some id
  | Some (Pulled_scalar (Int64 id)) -> Some (Datascript.Util.int64_to_int_exn "entity id" id)
  | _ -> None

let pulled_order (p : pulled_entity) : string =
  match List.assoc_opt (Keyword "block/order") p.pulled_attrs with
  | Some (Pulled_scalar (String s)) -> s
  | _ -> ""

let drop_key (k : string) (pairs : (Wire.t * Wire.t) list) =
  List.filter (fun (key, _) -> key <> kw k) pairs

let assoc_wire k v pairs = (kw k, v) :: pairs

(* otree/blocks->vec-tree-data — recursive :block/children assembly on
   pulled maps; emits transit-ready wire maps. cljs opt
   :keep-block-tx-id? keeps :block/tx-id on each emitted map
   (default drops it). *)
let vec_tree_data ~(include_root : bool) ?(keep_block_tx_id = false)
    ~(root : pulled_entity option) ~(root_id : entity_id)
    (blocks : pulled_entity list) : Wire.t list =
  let drop_tx_id pairs =
    if keep_block_tx_id then pairs else drop_key "block/tx-id" pairs
  in
  let parent_children : (entity_id, pulled_entity list) Hashtbl.t =
    Hashtbl.create 64
  in
  List.iter
    (fun b ->
      match pulled_parent_id b with
      | Some parent ->
          Hashtbl.replace parent_children parent
            (b :: Option.value
                   (Hashtbl.find_opt parent_children parent)
                   ~default:[])
      | None -> ())
    blocks;
  let sorted_children parent =
    match Hashtbl.find_opt parent_children parent with
    | Some cs -> List.sort (fun a b -> compare (pulled_order a) (pulled_order b)) cs
    | None -> []
  in
  let rec block_wire (m : pulled_entity) (parent : entity_id) (level : int)
      : Wire.t =
    let children = children_of m.pulled_id (level + 1) in
    let pairs =
      match Ds_wire.transit_of_pulled m with
      | Wire.Map pairs -> drop_tx_id pairs
      | _ -> []
    in
    Wire.Map
      (pairs
       |> assoc_wire "block/level" (Wire.Int level)
       |> assoc_wire "block/children" (Wire.List children)
       |> assoc_wire "block/parent"
            (Wire.Map [ (kw "db/id", Wire.Int parent) ]))
  and children_of (parent : entity_id) (level : int) : Wire.t list =
    List.map (fun m -> block_wire m parent level) (sorted_children parent)
  in
  let children = children_of root_id 1 in
  if include_root then
    match root with
    | Some root_p ->
        let pairs =
          match Ds_wire.transit_of_pulled root_p with
          | Wire.Map pairs -> drop_tx_id pairs
          | _ -> []
        in
        [ Wire.Map (assoc_wire "block/children" (Wire.List children) pairs) ]
    | None -> []
  else children

let starts_with prefix s =
  let n = String.length prefix in
  String.length s >= n && String.sub s 0 n = prefix

(* pull [*] encodes ref values as bare {:db/id} stubs, while the cljs UI
   reads them live via pu/lookup on the entity. Expand stubs under
   property attrs into ref_value_summary maps so the wire carries the
   value's title/ident/icon — what the UI actually renders. *)
let is_property_key (k : Wire.t) : bool =
  match k with
  | Wire.Keyword s ->
      starts_with "logseq.property/" s || starts_with "user.property/" s
  | _ -> false

let db_id_stub (v : Wire.t) : entity_id option =
  match v with
  | Wire.Map [ (Wire.Keyword "db/id", Wire.Int id) ] -> Some id
  | _ -> None

let rec expand_property_refs (db : db) (w : Wire.t) : Wire.t =
  match w with
  | Wire.Map pairs ->
      Wire.Map
        (List.map
           (fun (k, v) ->
             match db_id_stub v with
             | Some id when is_property_key k ->
                 (k, Plain_value.ref_value_summary db id)
             | _ -> (k, expand_property_refs db v))
           pairs)
  | Wire.Array xs -> Wire.Array (List.map (expand_property_refs db) xs)
  | Wire.List xs -> Wire.List (List.map (expand_property_refs db) xs)
  | Wire.Set xs -> Wire.Set (List.map (expand_property_refs db) xs)
  | _ -> w

(* otree/blocks->vec-tree for the page-root call shape used by
   :thread-api/get-page-blocks-tree — the cljs impl routes through
   get-root-and-page which, for a numeric page eid, yields
   include-root? = (not page?) — false here since callers pass a
   page. *)
let page_blocks_vec_tree (db : db) (blocks : pulled_entity list)
    (page_id : entity_id) : Wire.t list =
  vec_tree_data ~include_root:false ~root:None ~root_id:page_id blocks
  |> List.map (expand_property_refs db)
