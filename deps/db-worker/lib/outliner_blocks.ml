(* Port of the block-deletion helpers in logseq.outliner.core
   (deps/outliner/src/logseq/outliner/core.cljs) plus the sibling/order
   helpers from logseq.db they rely on (get-non-consecutive-blocks,
   sort-page-random-blocks, get-block-full-children-ids). *)

open Datascript

(* outliner-core/block-with-updated-at *)
let block_with_updated_at (block : Wire.t) : Wire.t =
  Cljs_map.assoc block "block/updated-at"
    (Wire.Date_ms (Int64.of_float (Clock.now_ms ())))

(* initial-data/get-block-full-children-ids — nested children incl.
   collapsed and property-value children, via the :parent rule
   (shared with Ldb). *)
let get_block_full_children_ids db (eid : entity_id) : entity_id list =
  Ldb.get_block_full_children_ids db eid

(* db.cljs block-order-path — order chain from block to page root *)
let block_order_path (page_id : entity_id) (block : entity) : string list option =
  let rec go (b : entity) (path : string list) : string list option =
    if Option.is_some (Ldb.value b "logseq.property/created-from-property")
       || Option.is_some (Ldb.value b "block/closed-value-property")
    then None
    else
      let order =
        match Ldb.value b "block/order" with
        | Some (String s) -> s
        | _ -> ""
      in
      match Ldb.ref_ent b "block/parent" with
      | None -> None
      | Some parent when parent.id = page_id -> Some (order :: path)
      | Some parent -> go parent (order :: path)
  in
  go block []

let rec compare_order_paths (a : string list) (b : string list) : int =
  match a, b with
  | [], [] -> 0
  | [], _ -> -1
  | _, [] -> 1
  | x :: xs, y :: ys ->
      let c = String.compare x y in
      if c <> 0 then c else compare_order_paths xs ys

(* db.cljs sort-page-random-blocks — cljs asserts all blocks share one
   :block/page. *)
let sort_page_random_blocks (_db : db) (blocks : entity list) : entity list =
  let page_id =
    match blocks with
    | b :: _ -> (match Ldb.ref_ent b "block/page" with Some p -> Some p.id | None -> None)
    | [] -> None
  in
  List.iter
    (fun (b : entity) ->
       match page_id, Ldb.ref_ent b "block/page" with
       | Some pid, Some p when p.id = pid -> ()
       | _ ->
           invalid_arg
             "sort_page_random_blocks: blocks must be in a same page")
    blocks;
  let with_paths =
    List.filter_map
      (fun b ->
         match page_id with
         | Some pid ->
             (match block_order_path pid b with
              | Some path -> Some (path, b)
              | None -> None)
         | None -> None)
      blocks
  in
  List.stable_sort
    (fun (p1, _) (p2, _) -> compare_order_paths p1 p2)
    with_paths
  |> List.fold_left
       (fun acc (_, b) ->
          if List.exists (fun x -> x.id = b.id) acc then acc else acc @ [ b ])
       []

(* db.cljs last-child-block? *)
let rec last_child_block db (parent_id : entity_id) (child_id : entity_id) : bool =
  match Ldb.ent_of_id db child_id with
  | None -> false
  | Some child ->
      if parent_id = child_id then true
      else
        (match Ldb.get_right_sibling child with
         | Some _ -> false
         | None ->
             (match Ldb.ref_ent child "block/parent" with
              | Some parent -> last_child_block db parent_id parent.id
              | None -> false))

(* db.cljs consecutive-block? *)
let consecutive_block db (b1 : entity) (b2 : entity) : bool =
  let aux (x : entity) (y : entity) : bool =
    let same_page =
      match Ldb.ref_ent x "block/page", Ldb.ref_ent y "block/page" with
      | Some px, Some py -> px.id = py.id
      | _ -> false
    in
    if not same_page then false
    else
      match Ldb.get_left_sibling y with
      | Some sib when sib.id = x.id -> true
      | Some prev_sibling -> last_child_block db prev_sibling.id x.id
      | None -> false
  in
  aux b1 b2 || aux b2 b1

(* db.cljs get-non-consecutive-blocks *)
let get_non_consecutive_blocks db (blocks : entity list) : entity list =
  let rec go acc = function
    | b1 :: (b2 :: _ as rest) ->
        let acc =
          if not (consecutive_block db b1 b2) then acc @ [ b1 ] else acc
        in
        go acc rest
    | _ -> acc
  in
  go [] blocks

(* outliner-core/filter-top-level-blocks *)
let filter_top_level_blocks (blocks : entity list) : entity list =
  let block_ids = List.map (fun (b : entity) -> b.id) blocks in
  List.filter
    (fun b ->
       match Ldb.ref_ent b "block/parent" with
       | Some p -> not (List.mem p.id block_ids)
       | None -> true)
    blocks

(* outliner-core/get-top-level-blocks *)
let get_top_level_blocks ~(non_consecutive : bool)
    (top_level_blocks : entity list) : entity list =
  let reversed =
    (not non_consecutive)
    &&
    match top_level_blocks with
    | b1 :: b2 :: _ ->
        (match Ldb.value b1 "block/order", Ldb.value b2 "block/order" with
         | Some (String o1), Some (String o2) -> String.compare o1 o2 > 0
         | _ -> false)
    | _ -> false
  in
  if reversed then List.rev top_level_blocks else top_level_blocks

(* comments helpers *)
let comments_tag_ident = "logseq.class/Comments"
let comment_tag_ident = "logseq.class/Comment"
let comments_blocks_property = "logseq.property.comments/blocks"

let tagged_with (block : entity) (tag_ident : string) : bool =
  List.exists
    (fun t ->
       match t with
       | Keyword s -> String.equal s tag_ident
       | Ref id ->
           (match Ldb.ent_of_id block.db id with
            | Some e -> Ldb.ident_of e = Some tag_ident
            | None -> false)
       | _ -> false)
    (Ldb.values block "block/tags")

let comments_area (block : entity) : bool = tagged_with block comments_tag_ident

let comment_block (block : entity) : bool =
  tagged_with block comment_tag_ident
  ||
  match Ldb.ref_ent block "block/parent" with
  | Some p -> comments_area p
  | None -> false

let protected_comment_block (block : entity) : bool =
  comments_area block || comment_block block

(* outliner-core/block-subtree-ids *)
let block_subtree_ids db (block : entity) : entity_id list =
  block.id :: get_block_full_children_ids db block.id

(* outliner-core/orphaned-range-comments-areas *)
let orphaned_range_comments_areas db (deleted_block_ids : entity_id list)
    : entity list =
  if not (Ldb.ref_attr db comments_blocks_property) then []
  else
    let candidates =
      List.concat_map
        (fun id ->
           List.of_seq
             (datoms db Avet ~a:comments_blocks_property ~v:(Ref id) ())
           |> List.map (fun d -> d.e))
        deleted_block_ids
      |> List.sort_uniq compare
      |> List.filter_map (fun e -> Ldb.ent_of_id db e)
      |> List.filter comments_area
      |> List.filter (fun e -> not (List.mem e.id deleted_block_ids))
    in
    List.filter
      (fun area ->
         let targets =
           List.filter_map
             (fun v -> match v with Ref id -> Some id | Int id -> Some id | _ -> None)
             (Ldb.values area comments_blocks_property)
         in
         targets <> [] && List.for_all (fun t -> List.mem t deleted_block_ids) targets)
      candidates

(* outliner-core/-del *)
let del_tx (db : db) (block : entity) : Wire.t list =
  if Ldb.is_page block then
    [ Wire.Array [ Wire.Keyword "db/retract"; Wire.Int block.id;
                   Wire.Keyword "block/parent" ]
    ; Wire.Array [ Wire.Keyword "db/retract"; Wire.Int block.id;
                   Wire.Keyword "block/order" ]
    ; Wire.Array [ Wire.Keyword "db/retract"; Wire.Int block.id;
                   Wire.Keyword "block/page" ] ]
  else
    let ids = block.id :: get_block_full_children_ids db block.id in
    List.map
      (fun id ->
         Wire.Array
           [ Wire.Keyword "db/retractEntity"; Wire.Int id ])
      ids

(* outliner-core/delete-blocks — returns tx items for
   Db_transact.transact with {:outliner-op :delete-blocks}. *)
let delete_blocks db (blocks : entity list) : Wire.t list =
  let top_level_blocks = filter_top_level_blocks blocks in
  let non_consecutive =
    List.length top_level_blocks > 1
    && get_non_consecutive_blocks db top_level_blocks <> []
  in
  let top_level_blocks' = get_top_level_blocks ~non_consecutive top_level_blocks in
  let top_level_blocks =
    List.filter
      (fun b -> not (Outliner_validate.built_in_entity b))
      top_level_blocks'
  in
  (* validation runs against the pre-filter list *)
  if List.exists Outliner_validate.built_in_entity top_level_blocks' then
    raise
      (Outliner_validate.Notification
         (Wire.Map
            [ (Wire.Keyword "type", Wire.Keyword "notification")
            ; (Wire.Keyword "payload",
               Wire.Map
                 [ (Wire.Keyword "message",
                    Wire.String "Built-in nodes can't be deleted.")
                 ; (Wire.Keyword "i18n-key",
                    Wire.Keyword "node/built-in-cant-delete-error")
                 ; (Wire.Keyword "type", Wire.Keyword "error") ]) ]));
  let deleted_block_ids =
    List.sort_uniq compare
      (List.concat_map (block_subtree_ids db) top_level_blocks)
  in
  let orphaned_comments =
    orphaned_range_comments_areas db deleted_block_ids
  in
  let top_level_blocks = top_level_blocks @ orphaned_comments in
  let block_ids = top_level_blocks in
  let start_block = List.nth_opt top_level_blocks 0 in
  let end_block = List.nth_opt top_level_blocks (List.length top_level_blocks - 1) in
  let delete_one =
    List.length top_level_blocks = 1
    ||
    (match start_block, end_block with
     | Some s, Some e -> s.id = e.id
     | _ -> false)
  in
  match top_level_blocks with
  | [] -> []
  | _ ->
      let from_property =
        match start_block with
        | Some b -> Ldb.ref_ent b "logseq.property/created-from-property"
        | None -> None
      in
      let default_value_property =
        match from_property, start_block with
        | Some fp, Some sb ->
            Option.is_some (Ldb.value fp "logseq.property/default-value")
            &&
            (match Ldb.ref_ent fp "logseq.property/default-value" with
             | Some dv -> dv.id <> sb.id
             | None -> true)
            && Option.is_none (Ldb.value sb "block/closed-value-property")
        | _ -> false
      in
      if delete_one && default_value_property then begin
        match from_property, start_block with
        | Some fp, Some sb ->
            (match Ldb.ident_of fp with
             | Some attr ->
                 List.of_seq
                   (datoms db Avet ~a:attr ~v:(Ref sb.id) ())
                 |> List.map
                      (fun d ->
                         Wire.Map
                           [ (Wire.Keyword "db/id", Wire.Int d.e)
                           ; (Wire.Keyword attr,
                              Wire.Keyword "logseq.property/empty-placeholder") ])
             | None -> [])
        | _ -> []
      end else
        List.concat_map (del_tx db) block_ids
