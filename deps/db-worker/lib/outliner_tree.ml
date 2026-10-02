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

(* block.temp/reactions — raw reaction entity maps, same shape the
   get-blocks render-data path emits (cljs components/query pull it via
   subscription; the page tree pull [*] does not cover reverse refs) *)
let reaction_selector =
  "[:db/id :block/uuid :logseq.property.reaction/emoji-id \
   {:logseq.property/created-by-ref [:db/id :block/uuid :block/title]}]"

let block_reactions db (block_id : entity_id) : Wire.t =
  Wire.Array
    (List.of_seq
       (datoms db Avet ~a:"logseq.property.reaction/target"
          ~v:(Ref block_id) ())
    |> List.map (fun (d : datom) ->
           match pull_string db reaction_selector (Entity_id d.e) with
           | Some p -> Ds_wire.transit_of_pulled p
           | None -> Wire.Nil))

(* otree/blocks->vec-tree-data — recursive :block/children assembly on
   pulled maps; emits transit-ready wire maps. cljs opt
   :keep-block-tx-id? keeps :block/tx-id on each emitted map
   (default drops it). *)
let vec_tree_data ~(include_root : bool) ?(keep_block_tx_id = false)
    ~(db : db) ~(root : pulled_entity option) ~(root_id : entity_id)
    (blocks : pulled_entity list) : Wire.t list =
  let drop_tx_id pairs =
    if keep_block_tx_id then pairs else drop_key "block/tx-id" pairs
  in
  (* the [*] pull emits :block/tags/:block/refs entries as bare {db/id}
     stubs; the UI reads tag ident/title/icon off the entity reactively in
     cljs, so expand each ref to the shared ref summary *)
  let expand_tags pairs =
    List.map
      (fun (k, v) ->
        match (k, v) with
        | ( Wire.Keyword ("block/tags" | "block/refs")
          , (Wire.Set xs | Wire.List xs | Wire.Array xs) ) ->
            ( k
            , Wire.List
                (List.map
                   (fun t ->
                     match t with
                     | Wire.Map _ -> (
                         match
                           (match t with Wire.Map ps -> ps | _ -> [])
                           |> List.assoc_opt (kw "db/id")
                         with
                         | Some (Wire.Int id) ->
                             Plain_value.ref_value_summary db id
                         | Some (Wire.Int64 id) ->
                             Plain_value.ref_value_summary db
                               (Datascript.Util.int64_to_int_exn
                                  "block/tags db/id" id)
                         | _ -> t)
                     | _ -> t)
                   xs) )
        | _ -> (k, v))
      pairs
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
      (pairs |> expand_tags
       |> assoc_wire "block/level" (Wire.Int level)
       |> assoc_wire "block/children" (Wire.List children)
       |> assoc_wire "block.temp/reactions"
            (block_reactions db m.pulled_id)
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
        [ Wire.Map
            (assoc_wire "block/children" (Wire.List children)
               (expand_tags pairs)) ]
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

(* cljs update-block-content: stored titles keep [[uuid]] id-refs and
   the UI resolves them through :block/refs when rendering — converted
   here so the wire carries the title the UI displays. *)
let wire_display_titles (db : db) (ws : Wire.t list) : Wire.t list =
  let convert (id : entity_id) (title : string) =
    if not (Regexp.test Db_content.id_ref_re title) then title
    else
      match Ldb.ent_of_id db id with
      | None -> title
      | Some e ->
          Db_content.id_ref_to_title_ref title
            (Ldb.ref_ents e "block/refs")
  in
  let rec go (w : Wire.t) : Wire.t =
    match w with
    | Wire.Map pairs ->
        let id =
          match List.assoc_opt (Wire.Keyword "db/id") pairs with
          | Some (Wire.Int i) -> Some i
          | _ -> None
        in
        Wire.Map
          (List.map
             (fun (k, v) ->
               match k, v, id with
               | Wire.Keyword "block/title", Wire.String t, Some id ->
                   (k, Wire.String (convert id t))
               | _ -> (k, go v))
             pairs)
    | Wire.List xs -> Wire.List (List.map go xs)
    | Wire.Array xs -> Wire.Array (List.map go xs)
    | Wire.Set xs -> Wire.Set (List.map go xs)
    | _ -> w
  in
  List.map go ws

(* otree/blocks->vec-tree for the page-root call shape used by
   :thread-api/get-page-blocks-tree — the cljs impl routes through
   get-root-and-page which, for a numeric page eid, yields
   include-root? = (not page?) — false here since callers pass a
   page. *)
let page_blocks_vec_tree (db : db) (blocks : pulled_entity list)
    (page : entity) : Wire.t list =
  (* cljs get-root-and-page: include-root? = (not page?) — a block entity
     (e.g. #/page/<block-uuid>) renders itself as the root row while a
     real page shows only its children *)
  let include_root = not (Ldb.is_page page) in
  let root =
    if include_root then
      List.find_opt (fun p -> p.pulled_id = page.id) blocks
    else None
  in
  vec_tree_data ~include_root ~db ~root ~root_id:page.id blocks
  |> wire_display_titles db
  |> List.map (expand_property_refs db)
