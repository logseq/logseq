(* logseq.outliner.recycle — recycle-page soft delete helpers (DB graphs). *)
open Datascript

let recycle_page_title = "Recycle"
let retention_ms = 30. *. 24. *. 3600. *. 1000.
let gc_interval_ms = 24. *. 3600. *. 1000.

let recycled (e : entity) : bool =
  Option.is_some (Ldb.value e "logseq.property/deleted-at")

let build_recycle_page_tx (db_id : string) : tx_entity =
  let now = Common_util.value_of_ms (Time.epoch_ms_to_int64 (Time.now ())) in
  { db_id = Some (Temp_id db_id)
  ; attrs =
      [ "block/uuid", One_value (Uuid (Common_uuid.gen_uuid "builtin-block-uuid" recycle_page_title))
      ; "block/name", One_value (String (Ldb.page_name_sanity_lc recycle_page_title))
      ; "block/title", One_value (String recycle_page_title)
      ; "block/tags", Many_values [ Keyword "logseq.class/Page" ]
      ; "block/created-at", One_value now
      ; "block/updated-at", One_value now
      ; "logseq.property/hide?", One_value (Bool true)
      ; "logseq.property/built-in?", One_value (Bool true)
      ] }

let recycle_page db : entity option = Ldb.get_built_in_page db recycle_page_title

let recycle_page_tag_tx (page : entity) : tx_op list =
  if Ldb.internal_page page then []
  else [ Add (Entity_id page.id, "block/tags", Keyword "logseq.class/Page") ]

type ensured_page =
  { page : entity option
  ; page_id : entity_ref
  ; tx_data : tx_op list }

let ensure_recycle_page db : ensured_page =
  match recycle_page db with
  | Some page ->
    { page = Some page
    ; page_id = Entity_id page.id
    ; tx_data = recycle_page_tag_tx page }
  | None ->
    { page = None
    ; page_id = Temp_id "recycle-page"
    ; tx_data = [ Entity (build_recycle_page_tx "recycle-page") ] }

let next_child_order (parent : entity) : string =
  let last_child =
    match List.rev (Ldb.sort_by_order (Ldb.parent_children parent)) with
    | c :: _ -> Some c
    | [] -> None
  in
  let last_order =
    Option.bind last_child (fun c ->
      match Ldb.value c "block/order" with Some (String o) -> Some o | _ -> None)
  in
  Db_order.gen_key last_order None

let maybe_assoc_ref (k : attr) (e : entity option) (attrs : (attr * tx_value) list) =
  match e with Some e -> attrs @ [ k, One_value (Ref e.id) ] | None -> attrs

let maybe_assoc (k : attr) (v : value option) (attrs : (attr * tx_value) list) =
  match v with Some v -> attrs @ [ k, One_value v ] | None -> attrs

(* recycle/resolve-entity — value may be entity-map, id, or lookup vector *)
let resolve_entity (db : db) (v : value option) : entity option =
  match v with
  | Some (Ref id) -> Ldb.ent_of_id db id
  | Some (Int64 id) -> Option.bind (Datascript.Util.int64_to_int id) (Ldb.ent_of_id db)
  | Some (Ref_to r) -> entity db r
  | _ -> None

(* recycle/block-children — unfiltered :block/_parent reverse lookup *)
let block_children (e : entity) : entity list =
  Ldb.ref_ents e "block/_parent"

let block_subtree db (block : entity) : entity list =
  let ids = block.id :: Ldb.get_block_full_children_ids db block.id in
  List.filter_map (Ldb.ent_of_id db) ids

let page_descendants (page : entity) : entity list =
  let rec loop pages result =
    match pages with
    | [] -> List.rev result
    | page' :: rest ->
      let children =
        block_children page'
        |> List.filter Ldb.is_page
        |> Ldb.sort_by_order
      in
      loop (rest @ children) (page' :: result)
  in
  loop [ page ] []

let distinct_by_id (ents : entity list) : entity list =
  let module S = Set.Make (Int) in
  let seen = ref S.empty in
  List.filter
    (fun e ->
      if S.mem e.id !seen then false
      else (seen := S.add e.id !seen; true))
    ents

let page_block_subtree_ids db (page : entity) : entity_id list =
  let raw_parent_children =
    List.filter (fun c -> not (Ldb.is_page c)) (block_children page)
  in
  let root_blocks =
    Ldb.ref_ents page "block/_page" @ raw_parent_children
    |> distinct_by_id
    |> Ldb.sort_by_order
  in
  List.concat_map
    (fun b -> List.map (fun (n : entity) -> n.id) (block_subtree db b))
    root_blocks

let page_tree_ids db (page : entity) : entity_id list =
  let module S = Set.Make (Int) in
  let seen = ref S.empty in
  page_descendants page
  |> List.concat_map (fun p -> p.id :: page_block_subtree_ids db p)
  |> List.filter (fun id ->
       if S.mem id !seen then false else (seen := S.add id !seen; true))

let deleted_by_id db (deleted_by_uuid : string option) : entity_id option =
  match deleted_by_uuid with
  | Some u ->
    (match entity db (Lookup_ref ("block/uuid", Uuid u)) with
     | Some e -> Some e.id
     | None -> None)
  | None -> None

let with_delete_cleanup_tx db (tx_data : tx_op list) : tx_op list =
  let cleanup = Delete_blocks.update_refs_history db tx_data in
  (* cljs distinct on tx maps — ops are closed variants, dedup by structural
     equality *)
  List.fold_left
    (fun (acc, seen) op ->
      if List.exists (fun o -> o = op) seen then (acc, seen)
      else (op :: acc, op :: seen))
    ([], []) (tx_data @ cleanup)
  |> fst |> List.rev

(* recycle-blocks-tx-data *)
let recycle_blocks_tx_data db (blocks : entity list)
    ?(deleted_by_uuid : string option)
    ?(now_ms : Time.epoch_ms option) () : tx_op list =
  let { page; page_id; tx_data } = ensure_recycle_page db in
  let deleted_by_ent = Option.bind (deleted_by_id db deleted_by_uuid) (Ldb.ent_of_id db) in
  (* cljs writes (common-util/time-ms) — keep full ms as a numeric value *)
  let now_ms =
    Common_util.value_of_ms
      (Time.epoch_ms_to_int64
         (Option.value now_ms ~default:(Time.now ())))
  in
  let prev_order =
    match page with
    | Some p ->
      (match List.rev (Ldb.sort_by_order (Ldb.parent_children p)) with
       | c :: _ ->
         (match Ldb.value c "block/order" with Some (String o) -> Some o | _ -> None)
       | [] -> None)
    | None -> None
  in
  let recycle_tx, _ =
    List.fold_left
      (fun (txs, previous_order) (block : entity) ->
        let subtree = block_subtree db block in
        let order = Db_order.gen_key previous_order None in
        let root_attrs =
          [ "block/parent", One_value (Ref_to page_id)
          ; "block/page", One_value (Ref_to page_id)
          ; "block/order", One_value (String order)
          ; "logseq.property/deleted-at", One_value now_ms ]
          |> maybe_assoc_ref ("logseq.property/deleted-by-ref") deleted_by_ent
          |> maybe_assoc_ref ("logseq.property.recycle/original-parent")
               (Ldb.ref_ent block "block/parent")
          |> maybe_assoc_ref ("logseq.property.recycle/original-page")
               (Ldb.ref_ent block "block/page")
          |> maybe_assoc ("logseq.property.recycle/original-order")
               (Ldb.value block "block/order")
        in
        let subtree_page_tx =
          List.map
            (fun (node : entity) ->
              Entity
                { db_id = Some (Entity_id node.id)
                ; attrs = [ "block/page", One_value (Ref_to page_id) ] })
            (match subtree with _ :: rest -> rest | [] -> [])
        in
        txs @ [ Entity { db_id = Some (Entity_id block.id); attrs = root_attrs } ]
          @ subtree_page_tx, Some order)
      ([], prev_order) blocks
  in
  tx_data @ recycle_tx

(* recycle-page-tx-data *)
let recycle_page_tx_data db (page : entity)
    ?(deleted_by_uuid : string option)
    ?(now_ms : Time.epoch_ms option) () : tx_op list =
  let { page = existing; page_id; tx_data = init_tx } = ensure_recycle_page db in
  let deleted_by_ent = Option.bind (deleted_by_id db deleted_by_uuid) (Ldb.ent_of_id db) in
  let now_ms =
    Common_util.value_of_ms
      (Time.epoch_ms_to_int64
         (Option.value now_ms ~default:(Time.now ())))
  in
  let order =
    match existing with
    | Some p -> next_child_order p
    | None -> Db_order.gen_key None None
  in
  let attrs =
    [ "block/parent", One_value (Ref_to page_id)
    ; "block/order", One_value (String order)
    ; "logseq.property/deleted-at", One_value now_ms ]
    |> maybe_assoc_ref ("logseq.property/deleted-by-ref") deleted_by_ent
    |> maybe_assoc_ref ("logseq.property.recycle/original-parent")
         (Ldb.ref_ent page "block/parent")
    |> maybe_assoc_ref ("logseq.property.recycle/original-page") (Some page)
    |> maybe_assoc ("logseq.property.recycle/original-order")
         (Ldb.value page "block/order")
  in
  init_tx @ [ Entity { db_id = Some (Entity_id page.id); attrs } ]

let restore_order (parent : entity) = next_child_order parent

let restore_target db (root : entity) =
  let original_parent =
    resolve_entity db
      (match Ldb.value root "logseq.property.recycle/original-parent" with
       | Some v -> Some v | None -> None)
  in
  let original_page =
    resolve_entity db (Ldb.value root "logseq.property.recycle/original-page")
  in
  let parent_valid =
    match original_parent with
    | Some p -> (not (recycled p)) && Option.is_some (Ldb.ent_of_id db p.id)
    | None -> false
  in
  if Ldb.is_page root then
    Some
      ( (if parent_valid then original_parent else None)
      , Some root
      , match Ldb.value root "logseq.property.recycle/original-order" with
        | Some (String o) -> Some o
        | _ -> if parent_valid then Option.map restore_order original_parent else None )
  else if parent_valid then
    Some
      ( original_parent
      , original_page
      , match Ldb.value root "logseq.property.recycle/original-order" with
        | Some (String o) -> Some o
        | _ -> Option.map restore_order original_parent )
  else
    (match original_page with
     | Some p
       when Option.is_some (Ldb.ent_of_id db p.id) && not (recycled p) ->
       Some (Some p, Some p, Some (restore_order p))
     | _ -> None)

(* restore-tx-data *)
let restore_tx_data db (root : entity) : tx_op list =
  match restore_target db root with
  | None -> []
  | Some (parent, page, order) ->
    let subtree = if Ldb.is_page root then [] else block_subtree db root in
    let clear_structure =
      [ RetractAttr (Entity_id root.id, "block/parent")
      ; RetractAttr (Entity_id root.id, "block/order") ]
      @ (if Ldb.is_page root then []
         else [ RetractAttr (Entity_id root.id, "block/page") ])
    in
    let clear_meta =
      List.map
        (fun a -> RetractAttr (Entity_id root.id, a))
        [ "logseq.property/deleted-at"
        ; "logseq.property/deleted-by-ref"
        ; "logseq.property.recycle/original-parent"
        ; "logseq.property.recycle/original-page"
        ; "logseq.property.recycle/original-order" ]
    in
    let root_attrs =
      []
      |> (fun l -> match parent with Some p -> l @ [ "block/parent", One_value (Ref p.id) ] | None -> l)
      |> (fun l -> match order with Some o -> l @ [ "block/order", One_value (String o) ] | None -> l)
      |> (fun l -> match page with
           | Some p when not (Ldb.is_page root) -> l @ [ "block/page", One_value (Ref p.id) ]
           | _ -> l)
    in
    let subtree_page_tx =
      match page with
      | Some p ->
        List.map
          (fun (node : entity) ->
            Entity
              { db_id = Some (Entity_id node.id)
              ; attrs = [ "block/page", One_value (Ref p.id) ] })
          subtree
      | None -> []
    in
    clear_structure
    @ [ Entity { db_id = Some (Entity_id root.id); attrs = root_attrs } ]
    @ subtree_page_tx @ clear_meta

let restore (conn : conn) (root_uuid : string) : bool =
  match entity (Conn.db conn) (Lookup_ref ("block/uuid", Uuid root_uuid)) with
  | None -> false
  | Some root ->
    (match restore_tx_data (Conn.db conn) root with
     | [] -> false
     | tx_data ->
       ignore (Db_tx.transact ~tx_meta:[ "outliner-op", Keyword "restore-recycled" ] conn tx_data);
       true)

(* permanently-delete-tx-data *)
let permanently_delete_tx_data db (root : entity) : tx_op list =
  if not (recycled root) then []
  else
    let uuids =
      if Ldb.is_page root then
        List.filter_map
          (fun id ->
            match Ldb.ent_of_id db id with
            | Some e -> (match Ldb.value e "block/uuid" with Some (Uuid u) -> Some u | _ -> None)
            | None -> None)
          (page_tree_ids db root)
      else
        List.filter_map
          (fun (b : entity) ->
            match Ldb.value b "block/uuid" with Some (Uuid u) -> Some u | _ -> None)
          (block_subtree db root)
    in
    let module HS = Set.Make (String) in
    let seen = ref HS.empty in
    let ops =
      List.filter_map
        (fun u ->
          if HS.mem u !seen then None
          else (seen := HS.add u !seen;
                Some (RetractEntity (Lookup_ref ("block/uuid", Uuid u)))))
        uuids
    in
    match ops with [] -> [] | ops -> with_delete_cleanup_tx db ops

let permanently_delete (conn : conn) (root_uuid : string) : bool =
  match entity (Conn.db conn) (Lookup_ref ("block/uuid", Uuid root_uuid)) with
  | None -> false
  | Some root ->
    (match permanently_delete_tx_data (Conn.db conn) root with
     | [] -> false
     | tx_data ->
       ignore
         (Db_tx.transact
            ~tx_meta:[ "outliner-op", Keyword "recycle-delete-permanently" ]
            conn tx_data);
       true)

let gc_tx_data db ?(now_ms : Time.epoch_ms option) () : tx_op list =
  let now_ms = Option.value now_ms ~default:(Time.now ()) in
  (* deleted-at is epoch-ms — keep the cutoff numeric at full precision
     (cljs passes a plain number into the query) *)
  let cutoff =
    Common_util.value_of_ms_float
      (Time.epoch_ms_to_float now_ms -. retention_ms)
  in
  let ids =
    Datascript.q_string
      ~inputs:[ Arg_scalar (Result_value cutoff) ]
      db
      "[:find [?e ...] :in $ ?cutoff :where [?e :logseq.property/deleted-at ?d] [(<= ?d ?cutoff)]]"
    |> List.concat_map
         (List.filter_map (function
            | Result_entity i -> Some i
            | Result_value (Int64 i) -> Datascript.Util.int64_to_int i
            | _ -> None))
  in
  let ents = List.filter_map (Ldb.ent_of_id db) ids |> List.filter recycled in
  let ops =
    List.concat_map
      (fun (e : entity) ->
        if Ldb.is_page e then
          List.map (fun id -> RetractEntity (Entity_id id)) (page_tree_ids db e)
        else
          List.map (fun (n : entity) -> RetractEntity (Entity_id n.id)) (block_subtree db e))
      ents
  in
  (* distinct *)
  let ops =
    List.fold_left
      (fun (acc, seen) op ->
        if List.exists (fun o -> o = op) seen then (acc, seen)
        else (op :: acc, op :: seen))
      ([], []) ops
    |> fst |> List.rev
  in
  match ops with [] -> [] | ops -> with_delete_cleanup_tx db ops

let gc (conn : conn) ?(now_ms : Time.epoch_ms option) () : bool =
  match gc_tx_data (Conn.db conn) ?now_ms () with
  | [] -> false
  | tx_data ->
    ignore
      (Db_tx.transact
         ~tx_meta:[ "outliner-op", Keyword "recycle-gc"; "persist-op?", Bool false ]
         conn tx_data);
    true
