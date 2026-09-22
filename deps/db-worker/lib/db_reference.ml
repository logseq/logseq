(* logseq.db.common.reference — linked references machinery
   (faithful port of the cljs namespace subset used by
   :thread-api/get-block-refs). *)

open Datascript

module IdSet = Set.Make (Int)

(* ---- fast datoms access ---- *)

(* entid: normalize a datom value into an entity id. *)
let entid = function
  | Ref id -> Some id
  | Int id -> Some id
  | _ -> None

let has_datom db e a v =
  Option.is_some (Seq.uncons (datoms db Eavt ~e ~a ~v ()))

(* datom-v: first value for attr a on entity e, normalized to entid. *)
let datom_v db e a =
  match Seq.uncons (datoms db Eavt ~e ~a ()) with
  | Some (d, _) -> entid d.v
  | None -> None

let datom_vs db e a : IdSet.t =
  List.of_seq (datoms db Eavt ~e ~a ())
  |> List.filter_map (fun (d : datom) -> entid d.v)
  |> List.fold_left (fun s id -> IdSet.add id s) IdSet.empty

(* direct children via AVET on :block/parent *)
let child_ids db parent_eid : entity_id list =
  List.of_seq (datoms db Avet ~a:"block/parent" ~v:(Ref parent_eid) ())
  |> List.map (fun (d : datom) -> d.e)

(* own-refs = direct :block/refs + implicit :block/page *)
let own_refs db eid : IdSet.t =
  let direct = datom_vs db eid "block/refs" in
  match datom_v db eid "block/page" with
  | Some p -> IdSet.add p direct
  | None -> direct

(* effective-refs(eid) = own-refs(eid) ∪ effective-refs(parent(eid)) *)
let effective_refs_fn db =
  let memo : (entity_id, IdSet.t) Hashtbl.t = Hashtbl.create 64 in
  let rec eff eid =
    match Hashtbl.find_opt memo eid with
    | Some r -> r
    | None ->
        let own = own_refs db eid in
        let res =
          match datom_v db eid "block/parent" with
          | Some p -> IdSet.union own (eff p)
          | None -> own
        in
        Hashtbl.replace memo eid res;
        res
  in
  eff

(* allowed-subtree-refs — like subtree-refs but prunes branches under
   an excluded ref: nodes whose effective-refs contain an exclude
   contribute nothing to include reachability. *)
let allowed_subtree_refs_fn db eff excludes =
  let memo : (entity_id, IdSet.t) Hashtbl.t = Hashtbl.create 64 in
  let blocked eid =
    excludes <> []
    && List.exists (fun x -> IdSet.mem x (eff eid)) excludes
  in
  let rec sub eid =
    match Hashtbl.find_opt memo eid with
    | Some r -> r
    | None ->
        let res =
          if blocked eid then IdSet.empty
          else
            List.fold_left
              (fun acc c -> IdSet.union acc (sub c))
              (own_refs db eid)
              (child_ids db eid)
        in
        Hashtbl.replace memo eid res;
        res
  in
  sub

(* matches-filters? — includes AND, excludes NONE (against
   exclude-set). *)
let matches_filters ~include_set ~exclude_set includes excludes =
  (includes = [] || List.for_all (fun i -> IdSet.mem i include_set) includes)
  && (excludes = []
      || not (List.exists (fun e -> IdSet.mem e exclude_set) excludes))

let filter_matched_ref_blocks db top_ref_block_ids includes excludes ~eff
    ~class_ok ~can_satisfy_includes ~allowed_subrefs : IdSet.t =
  let rec loop stack visited out =
    match stack with
    | [] -> out
    | eid :: stack ->
        if IdSet.mem eid visited then loop stack visited out
        else begin
          let visited = IdSet.add eid visited in
          let eff_refs = eff eid in
          if not (class_ok eid) then
            loop (child_ids db eid @ stack) visited out
          else if not (can_satisfy_includes eff_refs eid) then
            loop stack visited out
          else begin
            let include_set = IdSet.union eff_refs (allowed_subrefs eid) in
            let exclude_set = eff_refs in
            let out =
              if matches_filters ~include_set ~exclude_set includes excludes
              then IdSet.add eid out
              else out
            in
            loop (child_ids db eid @ stack) visited out
          end
        end
  in
  loop top_ref_block_ids IdSet.empty IdSet.empty

(* matched-ref-block-ids-under-top — include may be satisfied by
   descendants not under an excluded ref; excludes only checked
   against effective-refs(node). *)
let matched_ref_block_ids_under_top db top_ref_block_ids includes excludes
    class_ids : IdSet.t =
  let eff = effective_refs_fn db in
  let excludes' = List.filter_map (fun x -> x) excludes in
  let includes' = List.filter_map (fun x -> x) includes in
  let class_ids' = List.filter_map (fun x -> x) class_ids in
  let allowed_subrefs = allowed_subtree_refs_fn db eff excludes' in
  let can_satisfy_includes eff_refs node =
    includes' = []
    || begin
         let possible = IdSet.union eff_refs (allowed_subrefs node) in
         List.for_all (fun i -> IdSet.mem i possible) includes'
       end
  in
  let class_ok eid =
    class_ids' = []
    || not
         (List.exists
            (fun cid -> has_datom db eid "block/tags" (Ref cid))
            class_ids')
  in
  filter_matched_ref_blocks db top_ref_block_ids includes' excludes' ~eff
    ~class_ok ~can_satisfy_includes ~allowed_subrefs

(* expand-to-top-refs — add ancestors of matched refs until reaching a
   top ref. *)
let expand_to_top_refs db top_ref_ids matched_ref_ids : IdSet.t =
  let parent_cache : (entity_id, entity_id option) Hashtbl.t =
    Hashtbl.create 64
  in
  let parent_of eid =
    match Hashtbl.find_opt parent_cache eid with
    | Some p -> p
    | None ->
        let p = datom_v db eid "block/parent" in
        Hashtbl.replace parent_cache eid p;
        p
  in
  let result = ref IdSet.empty in
  List.iter
    (fun start ->
      let rec go eid =
        match eid with
        | None -> ()
        | Some eid ->
            if not (IdSet.mem eid !result) then begin
              result := IdSet.add eid !result;
              if not (IdSet.mem eid top_ref_ids) then
                go (parent_of eid)
            end
      in
      go (Some start))
    matched_ref_ids;
  !result

(* common-initial-data/get-block-alias — entities aliased to/from id,
   direct datom scan equivalent to the bidirectional :alias rule. *)
let get_block_alias db (eid : entity_id) : entity_id list =
  let forward =
    List.filter_map
      (fun (d : datom) -> entid d.v)
      (List.of_seq (datoms db Eavt ~e:eid ~a:"block/alias" ()))
  in
  let backward =
    List.map
      (fun (d : datom) -> d.e)
      (List.of_seq (datoms db Avet ~a:"block/alias" ~v:(Ref eid) ()))
  in
  List.sort_uniq compare (forward @ backward)

(* db-class/get-structured-children — all classes extending eid,
   BFS over :logseq.property.class/extends. *)
let structured_children db (eid : entity_id) : entity_id list =
  let rec go seen frontier =
    match frontier with
    | [] -> seen
    | eid :: rest ->
        let children =
          List.of_seq
            (datoms db Avet ~a:"logseq.property.class/extends" ~v:(Ref eid) ())
          |> List.map (fun (d : datom) -> d.e)
          |> List.filter (fun id -> not (List.mem id seen))
        in
        go (seen @ children) (rest @ children)
  in
  go [ eid ] [ eid ]
  |> List.filter (fun id -> id <> eid)

(* get-filters — linked-references includes/excludes entity ids. *)
let get_filters (page : entity) : entity_id list * entity_id list =
  let included = Ldb.ref_ids page "logseq.property.linked-references/includes" in
  let excluded = Ldb.ref_ids page "logseq.property.linked-references/excludes" in
  (included, excluded)

(* get-path-refs — refs of all parents plus the entity's own page. *)
let get_path_refs db (entity : entity) : entity list =
  match Ldb.value entity "block/uuid" with
  | Some (Uuid u) ->
      let refs =
        List.concat_map
          (fun (p : entity) -> Ldb.ref_ents p "block/refs")
          (Ldb.get_block_parents db u)
      in
      let with_page =
        match Ldb.ref_ent entity "block/page" with
        | Some page -> page :: refs
        | None -> refs
      in
      List.fold_left
        (fun acc e ->
          if List.exists (fun (x : entity) -> x.id = e.id) acc then acc
          else e :: acc)
        [] with_page
      |> List.rev
  | _ ->
      List.fold_left
        (fun acc e ->
          if List.exists (fun (x : entity) -> x.id = e.id) acc then acc
          else e :: acc)
        []
        (match Ldb.ref_ent entity "block/page" with
         | Some p -> [ p ]
         | None -> [])

(* common-initial-data/hidden-ref-pred *)
let hidden_ref_pred db (id : entity_id) (ref_block : entity) : bool =
  let entity = Ldb.ent_of_id db id in
  let entity_ident = Option.bind entity Ldb.ident_of in
  let class_ids =
    match entity with
    | Some e when Ldb.is_class e -> Some (id :: structured_children db id)
    | _ -> None
  in
  ref_block.id = id
  || (match Ldb.ref_ent ref_block "block/page" with
      | Some p -> p.id = id || Ldb.hidden p
      | None -> false)
  || (match Ldb.ref_ent ref_block "logseq.property/view-for" with
      | Some v -> v.id = id
      | None -> false)
  || Ldb.hidden ref_block
  || (match class_ids with
      | Some cids ->
          List.exists
            (fun cid -> List.mem cid (Ldb.ref_ids ref_block "block/tags"))
            cids
      | None -> false)
  || (match entity_ident with
      | Some ident -> Option.is_some (Ldb.value ref_block ident)
      | None -> false)

(* get-path-refs counterpart for page counting *)
let get_ref_pages_count db (id : entity_id) (ref_blocks : entity list)
    (children_ids : entity_id list) : (string * int) list =
  if ref_blocks = [] then []
  else begin
    let children =
      List.filter_map (Ldb.ent_of_id db) children_ids
    in
    let hidden_ref = hidden_ref_pred db id in
    let path_refs =
      List.concat_map (get_path_refs db) ref_blocks
    in
    let direct_refs =
      List.concat_map
        (fun (b : entity) -> Ldb.ref_ents b "block/refs")
        (ref_blocks @ children)
    in
    let freq = Hashtbl.create 32 in
    List.iter
      (fun (e : entity) ->
        Hashtbl.replace freq e.id
          (1 + Option.value (Hashtbl.find_opt freq e.id) ~default:0))
      (path_refs @ direct_refs);
    Hashtbl.fold
      (fun eid count acc ->
        match Ldb.ent_of_id db eid with
        | Some ref_
          when Ldb.is_page ref_ && eid <> id
               && Ldb.ident_of ref_ <> Some "block/tags"
               && not (hidden_ref ref_) ->
            (match Ldb.string_value ref_ "block/title" with
             | Some t -> (t, count) :: acc
             | None -> acc)
        | _ -> acc)
      freq []
    |> List.sort (fun (_, a) (_, b) -> compare b a)
  end

(* linked-reference-top-block-ids — top blocks directly referencing the
   page (or its aliases). *)
let linked_reference_top_block_ids db (ids : entity_id list)
    (class_ids : entity_id list option) : IdSet.t =
  List.concat_map
    (fun pid ->
      match Ldb.ent_of_id db pid with
      | Some e -> Ldb.ref_ents e "block/_refs"
      | None -> [])
    ids
  |> List.filter (fun (ref_ : entity) ->
         match class_ids with
         | Some cids
           when List.exists
                  (fun cid ->
                    List.mem cid (Ldb.ref_ids ref_ "block/tags"))
                  cids ->
             false
         | _ ->
             not
               (Ldb.hidden ref_
                ||
                (match Ldb.ref_ent ref_ "block/page" with
                 | Some p -> Ldb.hidden p
                 | None -> false)))
  |> List.fold_left
       (fun s (e : entity) -> IdSet.add e.id s)
       IdSet.empty

type linked_references =
  { ref_blocks : entity list
  ; ref_matched_children_ids : entity_id list option
  ; ref_pages_count : (string * int) list option
  }

(* db-reference/get-linked-references *)
let get_linked_references db ?(include_ref_pages_count : bool option)
    (id : entity_id) : linked_references =
  let include_ref_pages_count =
    Option.value include_ref_pages_count ~default:true
  in
  let ids =
    List.sort_uniq compare (id :: get_block_alias db id)
  in
  let includes, excludes =
    match Ldb.ent_of_id db id with
    | Some e -> get_filters e
    | None -> ([], [])
  in
  let has_filters = includes <> [] || excludes <> [] in
  let class_ids =
    match Ldb.ent_of_id db id with
    | Some e when Ldb.is_class e ->
        Some (List.sort_uniq compare (id :: structured_children db id))
    | _ -> None
  in
  let full_ref_block_ids = linked_reference_top_block_ids db ids class_ids in
  let matched_ref_block_ids =
    if has_filters then
      matched_ref_block_ids_under_top db
        (IdSet.elements full_ref_block_ids)
        (List.map Option.some includes)
        (List.map Option.some excludes)
        (Option.value class_ids ~default:[] |> List.map Option.some)
    else IdSet.empty
  in
  let matched_refs_with_children_ids =
    if has_filters then
      expand_to_top_refs db full_ref_block_ids
        (IdSet.elements matched_ref_block_ids)
    else IdSet.empty
  in
  let final_ref_ids =
    if has_filters then
      IdSet.inter full_ref_block_ids matched_refs_with_children_ids
    else full_ref_block_ids
  in
  let ref_blocks =
    List.filter_map (Ldb.ent_of_id db) (IdSet.elements final_ref_ids)
  in
  let children_ids =
    if has_filters then
      IdSet.elements (IdSet.diff full_ref_block_ids matched_refs_with_children_ids)
    else if include_ref_pages_count then
      List.concat_map
        (fun (b : entity) -> Ldb.get_block_children_ids db b.id)
        ref_blocks
    else []
  in
  { ref_blocks
  ; ref_matched_children_ids =
      (if has_filters then Some children_ids else None)
  ; ref_pages_count =
      (if include_ref_pages_count then
         Some (get_ref_pages_count db id ref_blocks children_ids)
       else None)
  }
