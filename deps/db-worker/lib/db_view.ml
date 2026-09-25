(* Faithful ports of logseq.db.common.view (view.cljs) — the
   get-property-values/get-view-property-values/get-view-entities/
   get-entities chain and the full get-view-data machinery
   (sort/filter/group-by, journals, linked-references page list), plus
   the supporting fns in logseq.db.common.reference,
   logseq.db.common.initial-data and common-util. *)

open Datascript

(* clojure.string/includes? equivalent *)
let contains_substring haystack needle =
  let lh = String.length haystack and ln = String.length needle in
  if ln = 0 then true
  else if ln > lh then false
  else begin
    let rec go i =
      i + ln <= lh && (String.sub haystack i ln = needle || go (i + 1))
    in
    go 0
  end

(* cljs distinct — first occurrence kept, order preserved *)
let dedupe_ids (ids : entity_id list) : entity_id list =
  let seen = Hashtbl.create 7 in
  List.filter
    (fun id ->
       if Hashtbl.mem seen id then false
       else begin
         Hashtbl.replace seen id ();
         true
       end)
    ids

(* ---------- common/reference.cljs datoms helpers ---------- *)

(* reference/entid — ref datom values are already entids *)
let entid : value -> entity_id option = function
  | Ref id -> Some id
  | _ -> None

(* reference/datom-v *)
let datom_v db (e : entity_id) (a : attr) : entity_id option =
  match Seq.uncons (datoms db Eavt ~e ~a ()) with
  | Some (d, _) -> entid d.v
  | None -> None

(* reference/datom-vs *)
let datom_vs db (e : entity_id) (a : attr) : entity_id list =
  List.filter_map (fun (d : datom) -> entid d.v)
    (List.of_seq (datoms db Eavt ~e ~a ()))

(* reference/has-datom? *)
let has_datom db (e : entity_id) (a : attr) (v : value) : bool =
  match Seq.uncons (datoms db Eavt ~e ~a ~v ()) with
  | Some _ -> true
  | None -> false

(* ---------- common/initial-data.cljs ---------- *)

(* common-initial-data/get-block-alias-ids — :block/alias in either
   direction, (distinct (concat forward backward)) as in cljs. *)
let get_block_alias_ids db (eid : entity_id) : entity_id list =
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
  List.fold_left
    (fun acc x -> if List.mem x acc then acc else acc @ [ x ])
    [] (forward @ backward)

(* common-initial-data/get-block-alias — the bidirectional :alias rule
   query (shared with Db_reference). *)
let get_block_alias db (eid : entity_id) : entity_id list =
  Db_reference.get_block_alias db eid

(* common-initial-data/hidden-eid-pred — memoized ancestor walk over
   hide?/deleted-at. Returns a fresh predicate per call like cljs. *)
let hidden_eid_pred db : entity_id option -> bool =
  let cache : (entity_id, bool) Hashtbl.t = Hashtbl.create 31 in
  let rec hidden (eid : entity_id option) (seen : entity_id list) : bool =
    match eid with
    | None -> false
    | Some id when List.mem id seen -> false
    | Some id ->
        (match Hashtbl.find_opt cache id with
         | Some b -> b
         | None ->
             let flag_true a =
               match Seq.uncons (datoms db Eavt ~e:id ~a ()) with
               | Some (d, _) -> Ldb.truthy (Some d.v)
               | None -> false
             in
             let result =
               flag_true "logseq.property/hide?"
               || flag_true "logseq.property/deleted-at"
               || hidden (datom_v db id "block/parent") (id :: seen)
             in
             Hashtbl.replace cache id result;
             result)
  in
  fun eid -> hidden eid []

(* common-initial-data/hidden-ref-id-pred *)
let hidden_ref_id_pred db (id : entity_id) : entity_id option -> bool =
  let hidden_eid = hidden_eid_pred db in
  let entity = Ldb.ent_of_id db id in
  let entity_ident = Option.bind entity Ldb.ident_of in
  let class_ids =
    match entity with
    | Some e when Ldb.is_class e ->
        Some (id :: Db_class.get_structured_children db id)
    | _ -> None
  in
  fun ref_eid ->
    match ref_eid with
    | None -> true
    | Some rid ->
        rid = id
        || datom_v db rid "block/page" = Some id
        || datom_v db rid "logseq.property/view-for" = Some id
        || hidden_eid (datom_v db rid "block/page")
        || hidden_eid ref_eid
        || (match class_ids with
            | Some cids ->
                List.exists
                  (fun cid -> List.mem cid cids)
                  (datom_vs db rid "block/tags")
            | None -> false)
        || (match entity_ident with
            | Some ident ->
                (match Seq.uncons (datoms db Eavt ~e:rid ~a:ident ()) with
                 | Some _ -> true
                 | None -> false)
            | None -> false)

(* common-initial-data/hidden-ref-pred — entity variant *)
let hidden_ref_pred db (id : entity_id) : entity -> bool =
  let entity = Ldb.ent_of_id db id in
  let entity_ident = Option.bind entity Ldb.ident_of in
  let class_ids =
    match entity with
    | Some e when Ldb.is_class e ->
        Some (id :: Db_class.get_structured_children db id)
    | _ -> None
  in
  fun (ref_block : entity) ->
    ref_block.id = id
    || (match Ldb.ref_ent ref_block "block/page" with
        | Some p -> p.id = id
        | None -> false)
    || (match Ldb.ref_ent ref_block "logseq.property/view-for" with
        | Some v -> v.id = id
        | None -> false)
    || (match Ldb.ref_ent ref_block "block/page" with
        | Some p -> Ldb.hidden p
        | None -> false)
    || Ldb.hidden ref_block
    || (match class_ids with
        | Some cids ->
            List.exists
              (fun (t : entity) -> List.mem t.id cids)
              (Ldb.ref_ents ref_block "block/tags")
        | None -> false)
    || (match entity_ident with
        | Some ident -> Option.is_some (Ldb.value ref_block ident)
        | None -> false)

(* common-initial-data/get-block-refs-count (no limit — the cljs callers
   here never pass one) *)
let get_block_refs_count db (id : entity_id) : int =
  let with_alias = dedupe_ids (id :: get_block_alias_ids db id) in
  let hidden_ref = hidden_ref_id_pred db id in
  List.fold_left
    (fun total alias_id ->
       List.fold_left
         (fun n (d : datom) -> if hidden_ref (Some d.e) then n else n + 1)
         total
         (List.of_seq (datoms db Avet ~a:"block/refs" ~v:(Ref alias_id) ())))
    0 with_alias

(* common-initial-data/get-block-children-ids (include-collapsed-children?
   defaults true; our callers always use the default) *)
let get_block_children_ids db (block_eid : entity_id) : entity_id list =
  let seen = Hashtbl.create 31 in
  let rec loop eids_to_expand =
    match eids_to_expand with
    | [] -> ()
    | _ ->
        let children =
          List.concat_map
            (fun eid ->
               match Ldb.ent_of_id db eid with
               | Some e ->
                   List.map
                     (fun (c : entity) -> c.id)
                     (Ldb.ref_ents e "block/_parent")
               | None -> [])
            eids_to_expand
        in
        List.iter (fun id -> Hashtbl.replace seen id ()) children;
        loop children
  in
  (match Ldb.ent_of_id db block_eid with
   | Some _ -> loop [ block_eid ]
   | None -> ());
  List.of_seq (Hashtbl.to_seq_keys seen)

(* ---------- common/reference.cljs ---------- *)

(* reference/get-path-refs *)
let get_path_refs db (e : entity) : entity list =
  let parents =
    match Ldb.value e "block/uuid" with
    | Some (Uuid u) -> Ldb.get_block_parents db u
    | _ -> []
  in
  let refs =
    List.concat_map (fun (p : entity) -> Ldb.ref_ents p "block/refs") parents
  in
  let refs =
    match Ldb.ref_ent e "block/page" with
    | Some page -> page :: refs
    | None -> refs
  in
  let seen = Hashtbl.create 7 in
  List.filter
    (fun (r : entity) ->
       if Hashtbl.mem seen r.id then false
       else begin
         Hashtbl.replace seen r.id ();
         true
       end)
    refs

(* reference/get-ref-pages-count — [(title, count)] desc by count;
   nil when ref-blocks is empty *)
let get_ref_pages_count db (id : entity_id) (ref_blocks : entity list)
    (children_ids : entity_id list) : (string option * int) list option =
  match ref_blocks with
  | [] -> None
  | _ ->
      Some
        (let children = List.filter_map (Ldb.ent_of_id db) children_ids in
      let hidden_ref = hidden_ref_pred db id in
      let counts : (entity_id, int) Hashtbl.t = Hashtbl.create 31 in
      let bump (e : entity) =
        Hashtbl.replace counts e.id
          (1 + Option.value (Hashtbl.find_opt counts e.id) ~default:0)
      in
      List.iter (fun (b : entity) -> List.iter bump (get_path_refs db b)) ref_blocks;
      List.iter
        (fun (b : entity) -> List.iter bump (Ldb.ref_ents b "block/refs"))
        (ref_blocks @ children);
      Hashtbl.fold
        (fun eid size acc ->
           match Ldb.ent_of_id db eid with
           | Some ref_e ->
               if
                 Ldb.is_page ref_e
                 && ref_e.id <> id
                 && Ldb.ident_of ref_e <> Some "block/tags"
                 && not (hidden_ref ref_e)
               then (Ldb.string_value ref_e "block/title", size) :: acc
               else acc
           | None -> acc)
        counts []
        |> List.sort (fun (_, a) (_, b) -> compare b a))

(* reference/get-filters *)
let get_filters (page : entity) : (entity list * entity list) option =
  let included = Ldb.ref_ents page "logseq.property.linked-references/includes" in
  let excluded = Ldb.ref_ents page "logseq.property.linked-references/excludes" in
  if included <> [] || excluded <> [] then Some (included, excluded) else None

(* reference/child-ids *)
let child_ids db (parent_eid : entity_id) : entity_id list =
  List.map
    (fun (d : datom) -> d.e)
    (List.of_seq (datoms db Avet ~a:"block/parent" ~v:(Ref parent_eid) ()))

(* reference/own-refs *)
let own_refs db (eid : entity_id) : entity_id list =
  let direct = datom_vs db eid "block/refs" in
  match datom_v db eid "block/page" with
  | Some page -> page :: direct
  | None -> direct

(* reference/effective-refs-fn — own-refs u parent's effective-refs *)
let effective_refs_fn db : entity_id -> entity_id list =
  let memo : (entity_id, entity_id list) Hashtbl.t = Hashtbl.create 31 in
  let rec eff eid =
    match Hashtbl.find_opt memo eid with
    | Some r -> r
    | None ->
        let own = own_refs db eid in
        let res =
          match datom_v db eid "block/parent" with
          | Some p -> List.sort_uniq compare (own @ eff p)
          | None -> own
        in
        Hashtbl.replace memo eid res;
        res
  in
  eff

(* reference/allowed-subtree-refs-fn — subtree refs, pruning branches
   under an excluded ref *)
let allowed_subtree_refs_fn db eff (excludes : entity_id list)
    : entity_id -> entity_id list =
  let memo : (entity_id, entity_id list) Hashtbl.t = Hashtbl.create 31 in
  let blocked eid =
    excludes <> [] && List.exists (fun x -> List.mem x (eff eid)) excludes
  in
  let rec sub eid =
    match Hashtbl.find_opt memo eid with
    | Some r -> r
    | None ->
        let res =
          if blocked eid then []
          else
            List.fold_left
              (fun acc c -> List.sort_uniq compare (acc @ sub c))
              (own_refs db eid)
              (child_ids db eid)
        in
        Hashtbl.replace memo eid res;
        res
  in
  sub

(* reference/matches-filters? *)
let matches_filters ~include_set ~exclude_set ~includes ~excludes =
  (includes = [] || List.for_all (fun i -> List.mem i include_set) includes)
  && (excludes = []
      || not (List.exists (fun x -> List.mem x exclude_set) excludes))

(* reference/filter-matched-ref-blocks — DFS over child-ids *)
let filter_matched_ref_blocks db (top_ref_block_ids : entity_id list)
    ~includes ~excludes ~eff ~class_ok ~can_satisfy_includes ~allowed_subrefs
    : entity_id list =
  let visited = Hashtbl.create 31 in
  let out = Hashtbl.create 31 in
  let rec loop stack =
    match stack with
    | [] -> ()
    | eid :: rest ->
        if Hashtbl.mem visited eid then loop rest
        else begin
          Hashtbl.replace visited eid ();
          let eff_refs = eff eid in
          if not (class_ok eid) then loop (child_ids db eid @ rest)
          else if not (can_satisfy_includes eff_refs eid) then loop rest
          else begin
            let include_set =
              List.sort_uniq compare (eff_refs @ allowed_subrefs eid)
            in
            if
              matches_filters ~include_set ~exclude_set:eff_refs ~includes
                ~excludes
            then Hashtbl.replace out eid ();
            loop (child_ids db eid @ rest)
          end
        end
  in
  loop top_ref_block_ids;
  List.of_seq (Hashtbl.to_seq_keys out)

(* reference/matched-ref-block-ids-under-top *)
let matched_ref_block_ids_under_top db (top_ref_block_ids : entity_id list)
    (includes : entity_id list) (excludes : entity_id list)
    (class_ids : entity_id list) : entity_id list =
  let eff = effective_refs_fn db in
  let allowed_subrefs = allowed_subtree_refs_fn db eff excludes in
  let class_ok eid =
    class_ids = []
    || not
         (List.exists
            (fun cid -> has_datom db eid "block/tags" (Ref cid))
            class_ids)
  in
  let can_satisfy_includes eff_refs node =
    includes = []
    || (let possible = List.sort_uniq compare (eff_refs @ allowed_subrefs node) in
        List.for_all (fun i -> List.mem i possible) includes)
  in
  filter_matched_ref_blocks db top_ref_block_ids ~includes ~excludes ~eff
    ~class_ok ~can_satisfy_includes ~allowed_subrefs

(* reference/expand-to-top-refs *)
let expand_to_top_refs db (top_ref_ids : entity_id list)
    (matched_ref_ids : entity_id list) : entity_id list =
  let parent_cache : (entity_id, entity_id option) Hashtbl.t = Hashtbl.create 31 in
  let result = Hashtbl.create 31 in
  let parent_of eid =
    match Hashtbl.find_opt parent_cache eid with
    | Some p -> p
    | None ->
        let p = datom_v db eid "block/parent" in
        Hashtbl.replace parent_cache eid p;
        p
  in
  List.iter
    (fun start ->
       let rec loop eid =
         match eid with
         | None -> ()
         | Some id ->
             if Hashtbl.mem result id then ()
             else begin
               Hashtbl.replace result id ();
               if not (List.mem id top_ref_ids) then loop (parent_of id)
             end
       in
       loop (Some start))
    matched_ref_ids;
  List.of_seq (Hashtbl.to_seq_keys result)

(* reference/linked-reference-top-block-ids *)
let linked_reference_top_block_ids db (ids : entity_id list)
    (class_ids : entity_id list) : entity_id list =
  List.concat_map
    (fun pid ->
       match Ldb.ent_of_id db pid with
       | Some e -> Ldb.ref_ents e "block/_refs"
       | None -> [])
    ids
  |> List.filter (fun (ref : entity) ->
         not
           ((class_ids <> []
             && List.exists
                  (fun (t : entity) -> List.mem t.id class_ids)
                  (Ldb.ref_ents ref "block/tags"))
            || Ldb.hidden ref
            || match Ldb.ref_ent ref "block/page" with
               | Some p -> Ldb.hidden p
               | None -> false))
  |> List.map (fun (e : entity) -> e.id)
  |> List.sort_uniq compare

type linked_reference_result =
  { ref_blocks : entity list
  ; ref_matched_children_ids : entity_id list option
  (* outer option = key presence for cljs select-keys; inner = the
     nil-able (get-ref-pages-count ...) result *)
  ; ref_pages_count : (string option * int) list option option }

(* reference/get-linked-references *)
let get_linked_references db (id : entity_id)
    ?(include_ref_pages_count : bool = true) () : linked_reference_result =
  let entity = Ldb.ent_of_id db id in
  let ids = dedupe_ids (id :: get_block_alias db id) in
  let includes, excludes =
    match Option.bind entity get_filters with
    | Some (incl, excl) ->
        ( List.map (fun (e : entity) -> e.id) incl,
          List.map (fun (e : entity) -> e.id) excl )
    | None -> ([], [])
  in
  let has_filters = excludes <> [] || includes <> [] in
  let class_ids =
    match entity with
    | Some e when Ldb.is_class e -> id :: Db_class.get_structured_children db id
    | _ -> []
  in
  let full_ref_block_ids = linked_reference_top_block_ids db ids class_ids in
  let matched_ref_block_ids =
    if has_filters then
      matched_ref_block_ids_under_top db full_ref_block_ids includes excludes class_ids
    else []
  in
  let matched_refs_with_children_ids =
    if has_filters then expand_to_top_refs db full_ref_block_ids matched_ref_block_ids
    else []
  in
  let final_ref_ids =
    if has_filters then
      List.filter
        (fun id -> List.mem id matched_refs_with_children_ids)
        full_ref_block_ids
    else full_ref_block_ids
  in
  let ref_blocks = List.filter_map (Ldb.ent_of_id db) final_ref_ids in
  let children_ids =
    if has_filters then
      List.filter
        (fun id -> not (List.mem id full_ref_block_ids))
        matched_refs_with_children_ids
    else if include_ref_pages_count then
      List.concat_map
        (fun (r : entity) -> get_block_children_ids db r.id)
        ref_blocks
      |> List.sort_uniq compare
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

(* reference/get-unlinked-references *)
let get_unlinked_references db (id : entity_id) : entity list =
  match Ldb.ent_of_id db id with
  | Some e ->
      (match Ldb.string_value e "block/title" with
       | Some title when Unicode.trim title <> "" ->
           let title_lc = Unicode.lowercase title in
           List.of_seq (datoms db Avet ~a:"block/title" ())
           |> List.filter_map (fun (d : datom) ->
                  match d.v with
                  | String s
                    when d.e <> id
                         && contains_substring
                              (Unicode.lowercase s) title_lc ->
                      Some d.e
                  | _ -> None)
           |> List.filter_map (fun eid ->
                  match Ldb.ent_of_id db eid with
                  | Some e ->
                      if
                        List.mem id (Ldb.ref_ids e "block/refs")
                        || Option.is_some (Ldb.value e "block/link")
                        || Ldb.built_in e
                      then None
                      else Some e
                  | None -> None)
       | _ -> [])
  | None -> []

(* ---------- common/view.cljs ---------- *)

(* db-view/get-property-value-content *)
let get_property_value_content db (v : value) : value option =
  match v with
  | Uuid u ->
      (match Ldb.ent_of_ref db (Lookup_ref ("block/uuid", Uuid u)) with
       | Some e -> Db_property.property_value_content e
       | None -> None)
  | Ref id ->
      (match Ldb.ent_of_id db id with
       | Some e -> Db_property.property_value_content e
       | None -> None)
  | Keyword k -> Some (String (":" ^ k))
  | v -> Some v

let str_of_value = function
  | String s -> s
  | Int i -> string_of_int i
  | Float f -> Common_util.js_string_of_float f
  | Bool b -> string_of_bool b
  | Keyword k -> ":" ^ k
  | Uuid u -> u
  | Symbol s -> s
  | Nil -> "nil"
  | _ -> ""

(* cljs select-keys {:db/id, :block/uuid} on an entity *)
let id_uuid_map_wire (e : entity) : Wire.t =
  Wire.Map
    ( [ (Wire.Keyword "db/id", Wire.Int e.id) ]
      @ (match Ldb.value e "block/uuid" with
         | Some (Uuid u) -> [ (Wire.Keyword "block/uuid", Wire.Uuid u) ]
         | _ -> []) )

(* common-util/distinct-by on the wire-encoded :label *)
let distinct_by_label (maps : Wire.t list) : Wire.t list =
  let seen = Hashtbl.create 7 in
  List.filter
    (fun w ->
       let k =
         match w with
         | Wire.Map _ ->
             (match Wire.get "label" w with
              | Some l -> l
              | None -> Wire.Nil)
         | _ -> Wire.Nil
       in
       if Hashtbl.mem seen k then false
       else begin
         Hashtbl.replace seen k ();
         true
       end)
    maps

type view_entities =
  | Entities of entity list
  | Linked of linked_reference_result
  | No_entities

(* view/get-entities-for-all-pages — cljs also assocs
   :block.temp/refs-count when sorting needs it; that only matters to the
   get-view-data sort (not ported), so entities are returned unchanged. *)
let get_entities_for_all_pages db (index_attr : attr) : entity list =
  let exclude_ids =
    (* view/get-exclude-page-ids (per-snapshot WeakMap cache skipped) *)
    let prop_tag_eids =
      match Db_class.ident_eid db "logseq.class/Property" with
      | Some tag_id -> [ tag_id ]
      | None -> []
    in
    List.sort_uniq compare
      ( List.map (fun (d : datom) -> d.e)
          (List.of_seq
             (datoms db Avet ~a:"logseq.property/hide?" ~v:(Bool true) ()))
      @ List.map (fun (d : datom) -> d.e)
          (List.of_seq (datoms db Avet ~a:"logseq.property/deleted-at" ()))
      @ List.map (fun (d : datom) -> d.e)
          (List.of_seq
             (datoms db Avet ~a:"logseq.property/built-in?" ~v:(Bool true) ()))
      @ List.concat_map
          (fun tag_id ->
             List.map (fun (d : datom) -> d.e)
               (List.of_seq (datoms db Avet ~a:"block/tags" ~v:(Ref tag_id) ())))
          prop_tag_eids )
  in
  List.of_seq (datoms db Avet ~a:index_attr ())
  |> List.filter_map (fun (d : datom) ->
         if List.mem d.e exclude_ids then None
         else
           match Ldb.ent_of_id db d.e with
           | Some e when not (Ldb.hidden e) -> Some e
           | _ -> None)

(* view/get-entities (sorting opt folded into sort_key_fn — refs-count
   is computed there directly) *)
let get_entities db ~feat_type ~index_attr ~view_for_id
    ?(include_ref_pages_count : bool = true) () : view_entities =
  match feat_type with
  | Some "all-pages" ->
      (match index_attr with
       | Some a -> Entities (get_entities_for_all_pages db a)
       | None -> No_entities)
  | Some "class-objects" ->
      (match view_for_id with
       | Some id -> Entities (Db_class.get_class_objects db id)
       | None -> No_entities)
  | Some "property-objects" ->
      (match index_attr with
       | Some prop_ident ->
           let non_hidden id =
             match Ldb.ent_of_id db id with
             | Some e when not (Ldb.hidden e) -> Some e
             | _ -> None
           in
           Entities
             (Db_class.property_object_eids db prop_ident
              |> List.filter_map non_hidden)
       | None -> No_entities)
  | Some "linked-references" ->
      (match view_for_id with
       | Some id ->
           Linked (get_linked_references db id ~include_ref_pages_count ())
       | None -> No_entities)
  | Some "unlinked-references" ->
      (match view_for_id with
       | Some id -> Entities (get_unlinked_references db id)
       | None -> No_entities)
  | _ -> No_entities

(* view/get-view-entities — opts :view-for-id/:view-feature-type
   override the view entity's stored values *)
let get_view_entities db (view_id : entity_id)
    ?(opt_view_for_id : entity_id option option)
    ?(opt_feat_type : string option option)
    ?(include_ref_pages_count : bool = true)
    () : view_entities =
  match Ldb.ent_of_id db view_id with
  | None -> No_entities
  | Some view ->
      let stored_feat_type =
        match Ldb.value view "logseq.property.view/feature-type" with
        | Some (Keyword k) -> Some k
        | Some (Ref id) -> Option.bind (Ldb.ent_of_id db id) Ldb.ident_of
        | _ -> None
      in
      let feat_type =
        match opt_feat_type with
        | Some (Some t) -> Some t
        | _ -> stored_feat_type
      in
      let index_attr =
        match feat_type with
        | Some "all-pages" -> Some "block/name"
        | Some "class-objects" -> Some "block/tags"
        | Some "property-objects" ->
            Option.bind
              (Ldb.ref_ent view "logseq.property/view-for")
              Ldb.ident_of
        | _ -> None
      in
      let view_for_id =
        match opt_view_for_id with
        | Some (Some id) -> Some id
        | _ ->
            Option.map
              (fun (e : entity) -> e.id)
              (Ldb.ref_ent view "logseq.property/view-for")
      in
      get_entities db ~feat_type ~index_attr ~view_for_id
        ~include_ref_pages_count ()

(* view/get-view-property-values *)
let get_view_property_values db (property_ident : attr) ~view_id ~query_entity_ids :
    Wire.t list =
  let empty_id =
    match Ldb.ent_of_ref db (Ident "logseq.property/empty-placeholder") with
    | Some e -> Some e.id
    | None -> None
  in
  let entities =
    match query_entity_ids with
    | Some ids -> List.filter_map (Ldb.ent_of_id db) ids
    | None ->
        (match get_view_entities db view_id () with
         | Linked r -> r.ref_blocks
         | Entities es -> es
         | No_entities -> [])
  in
  List.concat_map (fun (e : entity) -> Ldb.values e property_ident) entities
  |> List.filter_map (fun v ->
         let value_entity =
           match v with Ref id -> Ldb.ent_of_id db id | _ -> None
         in
         match value_entity with
         | Some e when Ldb.recycled e -> None
         | _ ->
             (match get_property_value_content db v with
              | None -> None
              | Some label ->
                  let label_s =
                    match label with
                    | String s -> s
                    | other -> str_of_value other
                  in
                  let value_eid =
                    match value_entity with Some e -> Some e.id | None -> None
                  in
                  if Unicode.trim label_s = "" || Option.equal Int.equal empty_id value_eid
                  then None
                  else
                    let value_w =
                      match value_entity with
                      | Some e -> id_uuid_map_wire e
                      | None -> Ds_wire.transit_of_value v
                    in
                    Some
                      (Wire.Map
                         [ (Wire.Keyword "label", Wire.String label_s)
                         ; (Wire.Keyword "value", value_w) ])))
  |> distinct_by_label

(* view/get-property-values *)
let get_property_values_impl db (property_ident : attr) ~view_id
    ~query_entity_ids : Wire.t list =
  let property = Ldb.ent_of_ref db (Ident property_ident) in
  let default_value =
    Option.bind property (fun p -> Ldb.ref_ent p "logseq.property/default-value")
  in
  let ref_type =
    match Option.bind property (fun p -> Ldb.value p "db/valueType") with
    | Some (Keyword "db.type/ref") -> true
    | _ -> false
  in
  let values =
    match view_id with
    | Some vid ->
        get_view_property_values db property_ident ~view_id:vid ~query_entity_ids
    | None ->
        List.of_seq (datoms db Avet ~a:property_ident ())
        |> List.map (fun (d : datom) -> d.v)
        (* cljs (distinct ...) — order-preserving first-occurrence dedupe *)
        |> (fun vs ->
              let seen = Hashtbl.create 31 in
              List.filter
                (fun v ->
                   if Hashtbl.mem seen v then false
                   else begin
                     Hashtbl.replace seen v ();
                     true
                   end)
                vs)
        |> List.filter_map (fun v ->
               if ref_type then begin
                 match v with
                 | Ref id ->
                     (* cljs d/entity yields an entity for any eid;
                        ent_of_id returns None when it has no forward
                        attrs → cljs emits {:label nil :value {:db/id}} *)
                     (match Ldb.ent_of_id db id with
                      | Some e when Ldb.recycled e -> None
                      | Some e ->
                          let label =
                            match Ldb.property_value_content e with
                            | Some s -> Wire.String s
                            | None -> Wire.Nil
                          in
                          Some
                            (Wire.Map
                               [ (Wire.Keyword "label", label)
                               ; (Wire.Keyword "value", id_uuid_map_wire e) ])
                      | None ->
                          Some
                            (Wire.Map
                               [ (Wire.Keyword "label", Wire.Nil)
                               ; ( Wire.Keyword "value",
                                   Wire.Map
                                     [ (Wire.Keyword "db/id", Wire.Int id) ]) ]))
                 | _ -> None
               end
               else
                 match v with
                 | String s ->
                     Some
                       (Wire.Map
                          [ (Wire.Keyword "label", Wire.String s)
                          ; ( Wire.Keyword "value", Ds_wire.transit_of_value v) ])
                 | _ ->
                     (* cljs [v v] — label is the raw value *)
                     Some
                       (Wire.Map
                          [ ( Wire.Keyword "label", Ds_wire.transit_of_value v)
                          ; ( Wire.Keyword "value", Ds_wire.transit_of_value v) ]))
  in
  let values =
    match default_value with
    | Some dv when not (Ldb.recycled dv) ->
        Wire.Map
          [ ( Wire.Keyword "label",
              (match Ldb.property_value_content dv with
               | Some s -> Wire.String s
               | None -> Wire.Nil) )
          ; (Wire.Keyword "value", id_uuid_map_wire dv) ]
        :: values
    | _ -> values
  in
  distinct_by_label values

(* cljs tests stub db-view/get-property-values via with-redefs; the fn
   ref is the equivalent native seam (sync_crypt convention). *)
let get_property_values_fn = ref get_property_values_impl

let get_property_values db property_ident ~view_id ~query_entity_ids =
  !get_property_values_fn db property_ident ~view_id ~query_entity_ids

(* ================================================================== *)
(* common/view.cljs — get-view-data machinery (sort/filter/group).    *)
(* ================================================================== *)

(* common-util/get-timestamp — relative-name strings shift from now;
   numbers/instants pass through (cljs tc/to-long). *)
let get_timestamp (v : value) : float option =
  let now = Date_time_util.time_ms () in
  let shift p n = Int64.to_float (Date_time_util.minus p n now) in
  match v with
  | String s ->
      (match s with
       | "1 day ago" -> Some (shift Days 1)
       | "3 days ago" -> Some (shift Days 3)
       | "1 week ago" -> Some (shift Weeks 1)
       | "1 month ago" -> Some (shift Months 1)
       | "3 months ago" -> Some (shift Months 3)
       | "1 year ago" -> Some (shift Years 1)
       | _ -> None)
  | Int i -> Some (float_of_int i)
  | Float f -> Some f
  | Instant i -> Some (Int64.to_float i)
  | _ -> None

(* db-property-type sets *)
let closed_value_property_types = [ "default"; "number"; "url" ]
let all_ref_property_types =
  [ "default"; "url"; "number"; "date"; "node"; "asset"; "entity"
  ; "class"; "page"; "property" ]

let valid_type_for_sort (v : value) : bool =
  match v with
  | Int _ | Float _ | Instant _ | String _ | Bool _ -> true
  | _ -> false

let prop_type_kw (property : entity option) : string option =
  Option.bind property (fun p ->
      match Ldb.value p "logseq.property/type" with
      | Some (Keyword t) -> Some t
      | _ -> None)

(* JS ToNumber for relational operators: strings parse to numbers (or
   NaN), booleans/null to 0/1. Non-convertible → None (NaN). *)
let js_number_opt (v : value) : float option =
  match v with
  | Int i -> Some (float_of_int i)
  | Float f -> Some f
  | Instant i -> Some (Int64.to_float i)
  | Bool b -> Some (if b then 1. else 0.)
  | Nil -> Some 0.
  | String s ->
      let s = Unicode.trim s in
      if s = "" then Some 0.
      else
        (match Common_util.js_number_of_string s with
         | Some f when Float.is_nan f -> None
         | Some f -> Some f
         | None -> None)
  | _ -> None

let strict_number_opt (v : value) : float option =
  match v with
  | Int i -> Some (float_of_int i)
  | Float f -> Some f
  | Instant i -> Some (Int64.to_float i)
  | _ -> None

(* JS relational comparison result, None = unordered (NaN operand). Both
   strings compare lexicographically; otherwise ToNumber both. *)
let js_cmp (a : value) (b : value) : int option =
  match a, b with
  | String x, String y -> Some (String.compare x y)
  | _ ->
      (match js_number_opt a, js_number_opt b with
       | Some x, Some y -> Some (compare x y)
       | _ -> None)

(* cljs compare over scalars: same-type pairs compare directly; mixed or
   non-comparable pairs go through goog.array.defaultCompare, which is
   relational (unordered → 0). Nil sorts first (cljs compare nil). *)
let compare_scalars (a : value) (b : value) : int =
  match a, b with
  | Nil, Nil -> 0
  | Nil, _ -> -1
  | _, Nil -> 1
  | Keyword x, Keyword y
  | Symbol x, Symbol y
  | Uuid x, Uuid y
  | String x, String y -> String.compare x y
  | _ -> Option.value ~default:0 (js_cmp a b)

let js_num_str (f : float) : string =
  if Float.is_integer f && Float.abs f < 1e21 then Printf.sprintf "%.0f" f
  else Printf.sprintf "%.15g" f

(* cljs (str v) for scalars. *)
let js_str (v : value) : string =
  match v with
  | Int i -> string_of_int i
  | Float f -> js_num_str f
  | Instant i -> Int64.to_string i
  | String s -> s
  | Bool b -> if b then "true" else "false"
  | Keyword k -> ":" ^ k
  | Uuid u -> u
  | Symbol s -> s
  | Nil -> ""
  | v -> str_of_value v

let lowercase = Unicode.lowercase

let vmap_get (k : attr) (kvs : (value * value) list) : value option =
  List.find_map
    (fun (key, v) ->
       match key with
       | Keyword s | String s when String.equal s k -> Some v
       | _ -> None)
    kvs

let js_truthy (v : value) : bool =
  match v with
  | Nil | Bool false | String "" -> false
  | Int 0 -> false
  | Float f -> Float.equal f 0.0 |> not
  | _ -> true

let uuid_str_of_eid db (eid : entity_id) : string option =
  match Seq.uncons (datoms db Eavt ~e:eid ~a:"block/uuid" ()) with
  | Some (d, _) -> (match d.v with Uuid u -> Some u | String s -> Some s | _ -> None)
  | None -> None

let uuid_to_eid db (u : string) : entity_id option =
  match Seq.uncons (datoms db Avet ~a:"block/uuid" ~v:(Uuid u) ()) with
  | Some (d, _) -> Some d.e
  | None -> None

let indexed_attr_value db (eid : entity_id) (a : attr) : value option =
  match Seq.uncons (datoms db Eavt ~e:eid ~a ()) with
  | Some (d, _) -> Some d.v
  | None -> None

let indexed_attr_values db (eid : entity_id) (a : attr) : value list =
  List.map (fun (d : datom) -> d.v) (List.of_seq (datoms db Eavt ~e:eid ~a ()))

(* view/attr-keyword — ref values resolve to their :db/ident *)
let attr_keyword db (eid : entity_id) (a : attr) : value option =
  match indexed_attr_value db eid a with
  | Some (Ref id) -> indexed_attr_value db id "db/ident"
  | v -> v

(* view/ref-value-content *)
let ref_value_content db (value_eid : entity_id) : value option =
  match indexed_attr_value db value_eid "logseq.property/value" with
  | Some v -> Some v
  | None -> indexed_attr_value db value_eid "block/title"

(* entity/map-level title|value — cljs (or :block/title
   :logseq.property/value) *)
let entity_title_or_value db (eid : entity_id) : value option =
  match indexed_attr_value db eid "block/title" with
  | Some v -> Some v
  | None -> indexed_attr_value db eid "logseq.property/value"

(* cljs (get e a) — card-many gives a set *)
let row_get (e : entity) (a : attr) : value option =
  let vs = Ldb.values e a in
  if Ldb.many_attr e.db a then
    (match vs with [] -> None | _ -> Some (Set vs))
  else List.nth_opt vs 0

let row_value_list (raw : value option) : value list =
  match raw with
  | Some (Set vs) -> vs
  | Some v -> [ v ]
  | None -> []

(* cljs row-matched?'s (empty-value? v) — over the raw get result. *)
let empty_value_opt (v : value option) : bool =
  match v with
  | None -> true
  | Some v ->
      (match v with
       | Nil -> true
       | Keyword "logseq.property/empty-placeholder" -> true
       | String s -> Unicode.trim s = ""
       | List [] | Vector [] | Set [] | Map [] -> true
       | _ -> false)

let is_empty_coll (v : value) : bool =
  match v with Set [] | List [] | Vector [] | Map [] -> true | _ -> false

let coll_items (v : value) : value list =
  match v with Set xs | Vector xs | List xs -> xs | _ -> []

(* cljs (some match coll) for a set-or-scalar match — membership test. *)
let match_items (m : value) : value list =
  match m with Set xs -> xs | _ -> [ m ]

let value_mem (v : value) (xs : value list) : bool =
  List.exists (fun x -> Util.value_equal x v) xs

let closed_value_ents_of db (prop_eid : entity_id) : entity list =
  List.filter_map
    (fun (d : datom) -> Ldb.ent_of_id db d.e)
    (List.of_seq
       (datoms db Avet ~a:"block/closed-value-property" ~v:(Ref prop_eid) ()))

(* view/match-property-value-as-entity? *)
let match_property_value_as_entity db (value_eid : entity_id) (property : entity option) : bool =
  (match Ldb.ent_of_id db value_eid with
   | Some e -> Option.is_some (Ldb.ident_of e)
   | None -> false)
  || (match prop_type_kw property with
      | Some t -> not (List.mem t closed_value_property_types)
      | None -> true)

(* db-property/property-value-content over a raw value (Ref → entity) —
   title first, then :logseq.property/value. *)
let dp_pvc_of_value db (v : value) : value option =
  match v with
  | Ref id ->
      (match Ldb.ent_of_id db id with
       | Some e -> Db_property.property_value_content e
       | None -> None)
  | _ -> None

let dp_pvc_of_uuid db (u : string) : value option =
  match uuid_to_eid db u with
  | Some id -> dp_pvc_of_value db (Ref id)
  | None -> None

let dp_pvc_of_map (kvs : (value * value) list) : value option =
  match vmap_get "block/title" kvs with
  | Some v -> Some v
  | None -> vmap_get "logseq.property/value" kvs

(* view/get-property-value-for-search *)
let get_property_value_for_search db (block : entity) (property : entity) : value option =
  match Ldb.ident_of property with
  | None -> None
  | Some ident ->
      let typ = prop_type_kw (Some property) in
      let many =
        Ldb.value property "db/cardinality"
        = Some (Keyword "db.cardinality/many")
      in
      let ref_type =
        match typ with Some t -> List.mem t all_ref_property_types | None -> false
      in
      let number_type = typ = Some "number" || typ = Some "datetime" in
      if many then begin
        let col =
          List.filter_map
            (fun v ->
              if ref_type then dp_pvc_of_value db v
              else (match v with Nil -> None | _ -> Some v))
            (Ldb.values block ident)
        in
        if number_type then
          Some (Float (List.fold_left ( +. ) 0. (List.filter_map strict_number_opt col)))
        else Some (String (String.concat ", " (List.map js_str col)))
      end
      else
        match Ldb.value block ident with
        | Some v when valid_type_for_sort v -> Some v
        | raw ->
            (match raw with
             | Some (Ref _) when ref_type -> Option.bind raw (dp_pvc_of_value db)
             | Some (Uuid _) when ref_type -> Option.bind raw (get_property_value_content db)
             | _ -> raw)

(* view/get-value-for-sort — precomputed closed-value map *)
let get_value_for_sort db (property : entity option) (db_ident : attr) :
    entity -> value option =
  let closed_values =
    match property with
    | Some p -> closed_value_ents_of db p.id
    | None -> []
  in
  let closed_map : (entity_id, value) Hashtbl.t option =
    match closed_values with
    | [] -> None
    | cvs ->
        let m = Hashtbl.create (List.length cvs) in
        if List.for_all (fun (cv : entity) -> Option.is_some (Ldb.value cv "block/order")) cvs
        then
          List.iter
            (fun (cv : entity) ->
               match Ldb.value cv "block/order" with
               | Some v -> Hashtbl.replace m cv.id v
               | None -> ())
            cvs
        else
          List.iteri (fun i (cv : entity) -> Hashtbl.replace m cv.id (Int i)) cvs;
        Some m
  in
  let get_property_value (e : entity) : value option =
    match property with
    | Some p ->
        if prop_type_kw (Some p) = Some "date" then
          (match Ldb.value e db_ident with
           | Some (Ref id) ->
               (match Ldb.ent_of_id db id with
                | Some je -> Ldb.value je "block/journal-day"
                | None -> None)
           | _ -> None)
        else get_property_value_for_search db e p
    | None -> Ldb.value e db_ident
  in
  fun (e : entity) : value option ->
    match closed_map with
    | Some m ->
        (match Ldb.value e db_ident with
         | Some (Ref id) -> Hashtbl.find_opt m id
         | _ -> None)
    | None ->
        (match get_property_value e with
         | Some v when valid_type_for_sort v -> Some v
         | _ -> None)

type sorting_item = { s_id : attr; s_asc : bool }

let sorting_of_value (v : value) : sorting_item list =
  let item m =
    match m with
    | Map kvs ->
        (match vmap_get "id" kvs with
         | Some (Keyword id) | Some (String id) ->
             Some
               { s_id = id
               ; s_asc =
                   (match vmap_get "asc?" kvs with
                    | Some (Bool b) -> b
                    | _ -> true)
               }
         | _ -> None)
    | _ -> None
  in
  match v with
  | Vector xs | List xs | Set xs -> List.filter_map item xs
  | _ -> []

(* cljs by-one-sorting compare — nil sorts first under plain compare *)
let compare_opt_nil_first (a : value option) (b : value option) : int =
  match a, b with
  | None, None -> 0
  | None, _ -> -1
  | _, None -> 1
  | Some x, Some y -> compare_scalars x y

let sort_key_fn db (s : sorting_item) : entity -> value option =
  if s.s_id = "block.temp/refs-count" then
    fun e -> Some (Int (get_block_refs_count db e.id))
  else get_value_for_sort db (Ldb.ent_of_ref db (Ident s.s_id)) s.s_id

let dedupe_entities (es : entity list) : entity list =
  let seen = Hashtbl.create 31 in
  List.filter
    (fun (e : entity) ->
       if Hashtbl.mem seen e.id then false
       else begin
         Hashtbl.replace seen e.id ();
         true
       end)
    es

let partition_by (key_eq : 'a -> 'a -> bool) (f : 'b -> 'a) (xs : 'b list) :
    'b list list =
  match xs with
  | [] -> []
  | x :: tl ->
      let groups, cur, _ =
        List.fold_left
          (fun (groups, cur, last_k) x ->
             let k = f x in
             if key_eq k last_k then (groups, x :: cur, k)
             else (List.rev cur :: groups, [ x ], k))
          ([], [ x ], f x)
          tl
      in
      List.rev (List.rev cur :: groups)

let sort_key_eq (a : value option) (b : value option) : bool =
  match a, b with
  | None, None -> true
  | Some x, Some y -> Util.value_equal x y
  | _ -> false

(* view/sort-by-single-property — returns the sorted entities split into
   partitions when partition is true (cljs partition-by on major key). *)
let sort_by_single_property db (s : sorting_item) (entities : entity list)
    ~(partition : bool) : entity list list =
  let property = Ldb.ent_of_ref db (Ident s.s_id) in
  let get_value_fn = sort_key_fn db s in
  let sorted =
    if s.s_id = "block.temp/refs-count" then
      let r =
        List.stable_sort
          (fun a b ->
             compare (get_block_refs_count db a.id) (get_block_refs_count db b.id))
          entities
      in
      if s.s_asc then r else List.rev r
    else begin
      let prop_ident =
        match property with
        | Some p -> Option.value ~default:s.s_id (Ldb.ident_of p)
        | None -> s.s_id
      in
      let value_type_ref =
        match property with
        | Some p -> Ldb.value p "db/valueType" = Some (Keyword "db.type/ref")
        | None -> false
      in
      let use_datom_sort =
        List.mem prop_ident [ "block/updated-at"; "block/created-at"; "block/title" ]
        && (not value_type_ref)
        && List.length entities > 10000
      in
      if use_datom_sort then begin
        let row_ids : (entity_id, entity) Hashtbl.t =
          Hashtbl.create (List.length entities)
        in
        List.iter (fun (e : entity) -> Hashtbl.replace row_ids e.id e) entities;
        let ds =
          let seen = Hashtbl.create 31 in
          List.filter
            (fun (d : datom) ->
               if Hashtbl.mem seen d.e then false
               else begin
                 Hashtbl.replace seen d.e ();
                 true
               end)
            (List.of_seq (datoms db Avet ~a:s.s_id ()))
        in
        let ds = if s.s_asc then ds else List.rev ds in
        List.filter_map (fun (d : datom) -> Hashtbl.find_opt row_ids d.e) ds
      end
      else
        List.stable_sort
          (fun a b ->
             let c = compare_opt_nil_first (get_value_fn a) (get_value_fn b) in
             if s.s_asc then c else -c)
          entities
    end
    |> dedupe_entities
  in
  if partition then partition_by sort_key_eq get_value_fn sorted else [ sorted ]

(* view/sort-entities *)
let sort_entities db (sorting : sorting_item list) (entities : entity list) :
    entity list =
  let major =
    match sorting with
    | s :: _ -> s
    | [] -> { s_id = "block/updated-at"; s_asc = false }
  in
  let minors = match sorting with _ :: rest -> rest | [] -> [] in
  let groups = sort_by_single_property db major entities ~partition:(minors <> []) in
  if minors = [] then List.concat groups
  else begin
    let minor_fns =
      List.map (fun (s : sorting_item) -> (s.s_asc, sort_key_fn db s)) minors
    in
    let cmp a b =
      let rec loop = function
        | [] -> 0
        | (asc, f) :: rest ->
            let c = compare_opt_nil_first (f a) (f b) in
            let c = if asc then c else -c in
            if c <> 0 then c else loop rest
      in
      loop minor_fns
    in
    List.concat_map (fun g -> List.stable_sort cmp g) groups
  end

(* ---------- view filters ---------- *)

type filter_clause =
  { f_ident : attr
  ; f_op : string
  ; f_match : value }

type view_filters =
  { vf_or : bool
  ; vf_clauses : filter_clause list
  ; vf_present : bool }

let no_filters = { vf_or = false; vf_clauses = []; vf_present = false }

let parse_clause (v : value) : filter_clause =
  match v with
  | Vector [ Keyword k; Keyword o; m ] | List [ Keyword k; Keyword o; m ] ->
      { f_ident = k; f_op = o; f_match = m }
  (* cljs destructures [property-ident operator match] — a clause the
     frontend persisted without a match keeps ident/operator and a nil
     match, which eid-clause-match? treats as match-all. *)
  | Vector [ Keyword k; Keyword o ] | List [ Keyword k; Keyword o ] ->
      { f_ident = k; f_op = o; f_match = Nil }
  | _ -> { f_ident = ""; f_op = ""; f_match = Nil }

let parse_filters (v : value) : view_filters =
  match v with
  | Map [] -> no_filters
  | Map kvs ->
      let or_ =
        match vmap_get "or?" kvs with Some (Bool b) -> b | _ -> false
      in
      let clauses =
        match vmap_get "filters" kvs with
        | Some (Vector xs) | Some (List xs) | Some (Set xs) ->
            List.map parse_clause xs
        | _ -> []
      in
      { vf_or = or_; vf_clauses = clauses; vf_present = true }
  (* cljs (seq filters) — any non-empty coll counts as "present" *)
  | Set (_ :: _) | Vector (_ :: _) | List (_ :: _) ->
      { vf_or = false; vf_clauses = []; vf_present = true }
  | _ -> no_filters

(* view/match-item->id *)
let match_item_id db (v : value) : entity_id option =
  match v with
  | Nil -> None
  | Int i -> Some i
  | Float f -> Some (int_of_float f)
  | Uuid u -> uuid_to_eid db u
  | Keyword k -> Db_class.ident_eid db k
  | Map kvs ->
      (match vmap_get "db/id" kvs with
       | Some (Int id) -> Some id
       | _ -> None)
  | _ -> None

(* view/match-item-content — keep drops nils *)
let match_item_content db (v : value) : value option =
  match v with
  | Nil -> None
  | Uuid u -> Option.bind (uuid_to_eid db u) (ref_value_content db)
  | Keyword k -> Option.bind (Db_class.ident_eid db k) (ref_value_content db)
  | Int i ->
      (match indexed_attr_value db i "block/uuid" with
       | Some _ -> ref_value_content db i
       | None -> Some v)
  | Map kvs -> dp_pvc_of_map kvs
  | _ -> Some v

(* view/match-journal-day *)
let match_journal_day db (m : value) : value option =
  match m with
  | Map kvs -> vmap_get "block/journal-day" kvs
  | Ref id -> indexed_attr_value db id "block/journal-day"
  | Uuid u ->
      Option.bind (uuid_to_eid db u) (fun eid -> indexed_attr_value db eid "block/journal-day")
  | Int i ->
      (match indexed_attr_value db i "block/journal-day" with
       | Some d -> Some d
       | None -> Some (Int i))
  | _ -> None

(* view/->filter-match-id *)
let filter_match_id db (v : value) : entity_id option =
  match v with
  | Nil -> None
  | Int i -> Some i
  | Float f -> Some (int_of_float f)
  | Uuid u -> uuid_to_eid db u
  | Map kvs ->
      (match vmap_get "db/id" kvs with
       | Some (Int id) -> Some id
       | _ -> None)
  | _ -> None

(* view/build-fast-filter-pred — single ref :is/:is-not clause *)
let build_fast_filter_pred db (filters : view_filters) (input : string) :
    (entity -> bool) option =
  if Unicode.trim input <> "" || filters.vf_or then None
  else
    match filters.vf_clauses with
    | [ { f_ident; f_op; f_match = Set items } ]
      when (f_op = "is" || f_op = "is-not")
           && items <> []
           && not (value_mem (Keyword "empty") items) ->
        (match Ldb.ent_of_ref db (Ident f_ident) with
         | Some p
           when Ldb.value p "db/valueType" = Some (Keyword "db.type/ref") ->
             let match_ids = List.filter_map (filter_match_id db) items in
             (match match_ids with
              | [] -> None
              | ids ->
                  Some
                    (fun (row : entity) ->
                       let hit =
                         List.exists
                           (fun v ->
                              match filter_match_id db v with
                              | Some id -> List.mem id ids
                              | None -> false)
                           (row_value_list (row_get row f_ident))
                       in
                       if f_op = "is" then hit else not hit))
         | _ -> None)
    | _ -> None

(* view/row-matched? — entity-level clause evaluation *)
let row_matched db (row : entity) (filters : view_filters) (input : string) : bool =
  let title_ok =
    Unicode.trim input = ""
    || (match Ldb.string_value row "block/title" with
        | Some t -> contains_substring (lowercase t) (lowercase input)
        | None -> false)
  in
  title_ok
  &&
  let check (c : filter_clause) : bool =
    if c.f_match = Nil then true
    else
      let raw = row_get row c.f_ident in
      let value' = row_value_list raw in
      let entity_in_values = match value' with Ref _ :: _ -> true | _ -> false in
      let prop_entity = Ldb.ent_of_ref db (Ident c.f_ident) in
      let treat_as_entity vid = match_property_value_as_entity db vid prop_entity in
      let uuid_hit negate =
        let items = match_items c.f_match in
        let found =
          List.exists
            (fun v ->
               match v with
               | Ref id ->
                   (match uuid_str_of_eid db id with
                    | Some u -> value_mem (Uuid u) items
                    | None -> false)
               | _ -> false)
            value'
        in
        if negate then not found else found
      in
      let content_hit negate =
        (* set/intersection of dp-pvc maps — nils participate *)
        let vc = List.map (dp_pvc_of_value db) value' in
        let mc =
          List.map
            (fun mi ->
               match mi with
               | Uuid u -> dp_pvc_of_uuid db u
               | _ -> dp_pvc_of_value db mi)
            (match_items c.f_match)
        in
        let opt_eq a b = Option.equal Util.value_equal a b in
        let found = List.exists (fun c -> List.exists (fun m -> opt_eq c m) mc) vc in
        if negate then not found else found
      in
      let raw_hit negate =
        let found = List.exists (fun v -> value_mem v (match_items c.f_match)) value' in
        if negate then not found else found
      in
      match c.f_op with
      | "is" ->
          (match c.f_match with
           | Bool m ->
               (match Option.bind raw (get_property_value_content db) with
                | Some pv -> js_truthy pv = m
                | None -> not m)
           | Keyword "empty" -> empty_value_opt raw
           | m when is_empty_coll m -> true
           | _ ->
               if entity_in_values then
                 (match value' with
                  | Ref vid :: _ ->
                      if treat_as_entity vid then uuid_hit false else content_hit false
                  | _ -> false)
               else raw_hit false)
      | "is-not" ->
          (match c.f_match with
           | Bool m ->
               (match Option.bind raw (get_property_value_content db) with
                | Some pv -> js_truthy pv <> m
                | None -> m)
           | Keyword "empty" -> not (empty_value_opt raw)
           | m when is_empty_coll m && value' <> [] -> true
           | m when (not (is_empty_coll m)) && value' = [] -> true
           | _ ->
               if entity_in_values then
                 (match value' with
                  | Ref vid :: _ ->
                      if treat_as_entity vid then uuid_hit true else content_hit true
                  | _ -> true)
               else raw_hit true)
      | "text-contains" ->
          let needle = lowercase (js_str c.f_match) in
          List.exists
            (fun v ->
               match get_property_value_content db v with
               | Some pv -> contains_substring (lowercase (js_str pv)) needle
               | None -> false)
            value'
      | "text-not-contains" ->
          let needle = js_str c.f_match in
          not
            (List.exists
               (fun v ->
                  let pv =
                    match get_property_value_content db v with
                    | Some pv -> pv
                    | None -> Nil
                  in
                  contains_substring (js_str pv) needle)
               value')
      | "number-gt" | "number-gte" | "number-lt" | "number-lte" ->
          (match raw with
           | None -> false
           | Some _ ->
               (match c.f_match with
                | Nil -> true
                | m ->
                    List.exists
                      (fun v ->
                         let pv =
                           match get_property_value_content db v with
                           | Some pv -> pv
                           | None -> Nil
                         in
                         match c.f_op with
                         | "number-gt" -> (match js_cmp pv m with Some c -> c > 0 | None -> false)
                         | "number-gte" -> (match js_cmp pv m with Some c -> c >= 0 | None -> false)
                         | "number-lt" -> (match js_cmp pv m with Some c -> c < 0 | None -> false)
                         | _ -> (match js_cmp pv m with Some c -> c <= 0 | None -> false))
                      value'))
      | "between" ->
          (match coll_items c.f_match with
           | [] -> true
           | start :: rest ->
               let end_ = match rest with e :: _ -> e | [] -> Nil in
               List.exists
                 (fun v ->
                    let pv =
                      match get_property_value_content db v with
                      | Some pv -> pv
                      | None -> Nil
                    in
                    (match start with
                     | Nil -> true
                     | _ -> (match js_cmp start pv with Some c -> c <= 0 | None -> false))
                    &&
                    (match end_ with
                     | Nil -> true
                     | _ -> (match js_cmp pv end_ with Some c -> c <= 0 | None -> false)))
                 value')
      | "date-before" | "date-after" ->
          (match raw with
           | None -> false
           | Some _ ->
               (match c.f_match with
                | Nil -> true
                | m ->
                    let mday =
                      match m with
                      | Map kvs ->
                          Option.value ~default:Nil
                            (vmap_get "block/journal-day" kvs)
                      | _ -> Option.value ~default:Nil (match_journal_day db m)
                    in
                    List.exists
                      (fun v ->
                         let day =
                           match v with
                           | Ref id -> Option.value ~default:Nil (indexed_attr_value db id "block/journal-day")
                           | _ -> Nil
                         in
                         let cmp = js_cmp day mday in
                         match c.f_op, cmp with
                         | "date-before", Some c -> c < 0
                         | _, Some c -> c > 0
                         | _ -> false)
                      value'))
      | "before" | "after" ->
          (match raw with
           | None -> false
           | Some v ->
               (match get_timestamp c.f_match with
                | None -> true
                | Some ts ->
                    (match js_cmp v (Float ts) with
                     | Some o when c.f_op = "before" -> o <= 0
                     | Some o -> o >= 0
                     | None -> false)))
      | _ -> true
  in
  if filters.vf_or then List.exists check filters.vf_clauses
  else List.for_all check filters.vf_clauses

(* ---------- compiled (eid-level) filter path ---------- *)

type attr_schema =
  { s_ident : attr
  ; s_type : string option
  ; s_ref : bool
  ; s_many : bool
  ; s_closed_order : (entity_id, value) Hashtbl.t option }

(* view/property-attr-schema *)
let property_attr_schema db (property_ident : attr) : attr_schema =
  let prop_eid = Db_class.ident_eid db property_ident in
  let kw_of_attr a = Option.bind prop_eid (fun e -> attr_keyword db e a) in
  let kw_str = function Some (Keyword s) -> Some s | _ -> None in
  let value_type = kw_of_attr "db/valueType" in
  let cardinality = kw_of_attr "db/cardinality" in
  let prop_type = kw_of_attr "logseq.property/type" in
  let built_in_ref =
    List.mem property_ident [ "block/page"; "block/tags"; "block/refs"; "block/parent" ]
  in
  let s_ref =
    built_in_ref
    || value_type = Some (Keyword "db.type/ref")
    || (match kw_str prop_type with
        | Some t -> List.mem t all_ref_property_types
        | None -> false)
  in
  let closed_eids =
    match prop_eid with
    | Some pid ->
        List.map
          (fun (d : datom) -> d.e)
          (List.of_seq (datoms db Avet ~a:"block/closed-value-property" ~v:(Ref pid) ()))
    | None -> []
  in
  let s_closed_order =
    match closed_eids with
    | [] -> None
    | _ ->
        let m = Hashtbl.create 7 in
        if
          List.for_all
            (fun eid -> Option.is_some (indexed_attr_value db eid "block/order"))
            closed_eids
        then
          List.iter
            (fun eid ->
               Hashtbl.replace m eid
                 (Option.value ~default:Nil (indexed_attr_value db eid "block/order")))
            closed_eids
        else begin
          let sorted =
            List.sort
              (fun a b ->
                 compare_scalars
                   (Option.value ~default:(String "") (indexed_attr_value db a "block/order"))
                   (Option.value ~default:(String "") (indexed_attr_value db b "block/order")))
              closed_eids
          in
          List.iteri (fun i eid -> Hashtbl.replace m eid (Int i)) sorted
        end;
        Some m
  in
  { s_ident = property_ident
  ; s_type = kw_str prop_type
  ; s_ref
  ; s_many =
      property_ident = "block/tags"
      || cardinality = Some (Keyword "db.cardinality/many")
  ; s_closed_order }

(* view/eid-sort-value *)
let eid_sort_value db (schema : attr_schema) (eid : entity_id) : value option =
  if schema.s_ident = "block.temp/refs-count" then
    Some (Int (get_block_refs_count db eid))
  else
    match indexed_attr_values db eid schema.s_ident with
    | [] -> None
    | v0 :: _ as vs ->
        (match schema.s_closed_order with
         | Some m ->
             (match v0 with Ref id -> Hashtbl.find_opt m id | _ -> None)
         | None ->
             if schema.s_ref && schema.s_type = Some "date" then
               (match v0 with
                | Ref id -> indexed_attr_value db id "block/journal-day"
                | _ -> None)
             else if
               schema.s_many
               && (schema.s_type = Some "number" || schema.s_type = Some "datetime")
             then begin
               let nums =
                 List.filter_map
                   (fun v ->
                      let n =
                        match v with
                        | Ref id when schema.s_ref ->
                            (match indexed_attr_value db id "logseq.property/value" with
                             | Some x -> Some x
                             | None -> ref_value_content db id)
                        | _ -> Some v
                      in
                      Option.bind n strict_number_opt)
                   vs
               in
               (match nums with
                | [] -> None
                | _ -> Some (Float (List.fold_left ( +. ) 0. nums)))
             end
             else if schema.s_many then begin
               let col =
                 List.filter_map
                   (fun v ->
                      match v with
                      | Ref id when schema.s_ref -> ref_value_content db id
                      | _ -> Some v)
                   vs
               in
               (match col with
                | [] -> None
                | _ -> Some (String (String.concat ", " (List.map js_str col))))
             end
             else if schema.s_ref then
               (match v0 with
                | Ref id ->
                    if schema.s_type = Some "number" || schema.s_type = Some "datetime" then
                      (match indexed_attr_value db id "logseq.property/value" with
                       | Some x -> Some x
                       | None -> ref_value_content db id)
                    else ref_value_content db id
                | _ -> None)
             else Some v0)

(* view/compare-sort-values — nils last *)
let compare_sort_values (a : value option) (b : value option) (asc_ : bool) : int =
  match a, b with
  | None, None -> 0
  | None, _ -> 1
  | _, None -> -1
  | Some va, Some vb ->
      let c = compare_scalars va vb in
      if asc_ then c else -c

let avet_first_window_sort_attrs =
  [ "block/updated-at"; "block/created-at"; "block/title"; "block/name" ]

(* Test instrumentation: index datoms consumed by avet scans — mirrors
   cljs view_test's instrumented d/datoms / d/rseek-datoms, keyed by
   sort attr. *)
let index_scans : (attr, int) Hashtbl.t = Hashtbl.create 7

let index_scans_reset () = Hashtbl.reset index_scans

(* view/avet-take-eids — map :e → filter → distinct → drop → take.
   Consumes the index seq lazily so a small window does not scan the
   whole index (cljs laziness). *)
let avet_take_eids ~(scan_attr : attr) (ds : datom Seq.t)
    (match_ : entity_id -> bool) (row_limit : int option)
    (row_offset : int) : entity_id list =
  let seen = Hashtbl.create 31 in
  let count () =
    Hashtbl.replace index_scans scan_attr
      (1 + Option.value ~default:0 (Hashtbl.find_opt index_scans scan_attr))
  in
  let rec go ds off acc =
    match row_limit with
    | Some l when List.length acc >= l -> List.rev acc
    | _ ->
        (match Seq.uncons ds with
         | None -> List.rev acc
         | Some (d, tl) ->
             count ();
             if Hashtbl.mem seen d.e || not (match_ d.e) then go tl off acc
             else begin
               Hashtbl.replace seen d.e ();
               if off > 0 then go tl (off - 1) acc
               else go tl off (d.e :: acc)
             end)
  in
  go ds row_offset []

(* view/sort-eids-from-avet — returns None when the fast path doesn't
   apply or can't fill the window *)
let sort_eids_from_avet db (match_ : entity_id -> bool) (sorting : sorting_item list)
    (row_limit : int option) (leftover : entity_id list option) (row_offset : int option)
    : entity_id list option =
  let sorts =
    match sorting with [] -> [ { s_id = "block/updated-at"; s_asc = false } ] | s -> s
  in
  match sorts with
  | [ { s_id; s_asc } ] when List.mem s_id avet_first_window_sort_attrs ->
      let offset = Option.value ~default:0 row_offset in
      (match row_limit with
       | Some limit ->
           let ds =
             if s_asc then datoms db Avet ~a:s_id ()
             else rseek_datoms db Avet ~a:s_id ()
           in
           let matched = avet_take_eids ~scan_attr:s_id ds match_ (Some limit) offset in
           if List.length matched < limit then None else Some matched
       | None ->
           let ds =
             if s_asc then datoms db Avet ~a:s_id ()
             else List.to_seq (List.rev (List.of_seq (datoms db Avet ~a:s_id ())))
           in
           let matched = avet_take_eids ~scan_attr:s_id ds match_ None offset in
           (match leftover with
            | None -> Some matched
            | Some ids ->
                let seen = Hashtbl.create 31 in
                List.iter (fun i -> Hashtbl.replace seen i ()) matched;
                Some (matched @ List.filter (fun i -> not (Hashtbl.mem seen i)) ids)))
  | _ -> None

(* view/sort-eids-by-sorting *)
let sort_eids_by_sorting db (eids : entity_id list) (sorting : sorting_item list) :
    entity_id list =
  let sorts =
    match sorting with [] -> [ { s_id = "block/updated-at"; s_asc = false } ] | s -> s
  in
  let schemas =
    List.map (fun (s : sorting_item) -> (s.s_asc, property_attr_schema db s.s_id)) sorts
  in
  let value_maps =
    List.map
      (fun (_, sc) ->
         let m = Hashtbl.create 31 in
         List.iter
           (fun eid ->
              match eid_sort_value db sc eid with
              | Some v -> Hashtbl.replace m eid v
              | None -> ())
           eids;
         m)
      schemas
  in
  List.stable_sort
    (fun a b ->
       let rec loop = function
         | [] -> 0
         | ((asc, _), vm) :: rest ->
             let c =
               compare_sort_values (Hashtbl.find_opt vm a) (Hashtbl.find_opt vm b) asc
             in
             if c <> 0 then c else loop rest
       in
       loop (List.combine schemas value_maps))
    eids

(* view/take-sorted-eids *)
let take_sorted_eids db (eids : entity_id list) (sorting : sorting_item list)
    (row_limit : int option) (row_offset : int option) : entity_id list =
  let wanted = Hashtbl.create 31 in
  List.iter (fun e -> Hashtbl.replace wanted e ()) eids;
  let match_ e = Hashtbl.mem wanted e in
  let use_eid_sort =
    match row_limit with Some l -> List.length eids <= l | None -> false
  in
  let avet =
    if use_eid_sort then None
    else sort_eids_from_avet db match_ sorting row_limit (Some eids) row_offset
  in
  match avet with
  | Some sorted -> sorted
  | None ->
      let sorted = sort_eids_by_sorting db eids sorting in
      (match row_limit with
       | Some l -> sorted |> List.drop (Option.value ~default:0 row_offset) |> List.take l
       | None -> sorted)

(* view/feature-filters? *)
let feature_filters (filters : view_filters) (input : string) : bool =
  Unicode.trim input <> "" || filters.vf_clauses <> []

(* view/get-exclude-page-ids — shared by the entity and eid paths *)
let get_exclude_page_ids db : entity_id list =
  let prop_tag_eids =
    match Db_class.ident_eid db "logseq.class/Property" with
    | Some tag_id -> [ tag_id ]
    | None -> []
  in
  List.sort_uniq compare
    ( List.map (fun (d : datom) -> d.e)
        (List.of_seq (datoms db Avet ~a:"logseq.property/hide?" ~v:(Bool true) ()))
    @ List.map (fun (d : datom) -> d.e)
        (List.of_seq (datoms db Avet ~a:"logseq.property/deleted-at" ()))
    @ List.map (fun (d : datom) -> d.e)
        (List.of_seq (datoms db Avet ~a:"logseq.property/built-in?" ~v:(Bool true) ()))
    @ List.concat_map
        (fun tag_id ->
           List.map (fun (d : datom) -> d.e)
             (List.of_seq (datoms db Avet ~a:"block/tags" ~v:(Ref tag_id) ())))
        prop_tag_eids )

(* view/count-all-page-ids *)
let count_all_page_ids db (exclude_ids : entity_id list) : int =
  let excluded = Hashtbl.create 31 in
  List.iter (fun id -> Hashtbl.replace excluded id ()) exclude_ids;
  Seq.fold_left
    (fun n (d : datom) -> if Hashtbl.mem excluded d.e then n else n + 1)
    0
    (datoms db Avet ~a:"block/name" ())

(* view/all-pages-eid? *)
let all_pages_eid db (exclude_ids : entity_id list) (eid : entity_id) : bool =
  (not (List.mem eid exclude_ids))
  && Option.is_some (indexed_attr_value db eid "block/name")

(* view/get-all-page-ids *)
let get_all_page_ids db : entity_id list =
  let exclude_ids = get_exclude_page_ids db in
  List.filter_map
    (fun (d : datom) -> if List.mem d.e exclude_ids then None else Some d.e)
    (List.of_seq (datoms db Avet ~a:"block/name" ()))

(* view/first-window-feature-row-data *)
let first_window_feature_row_data db (feat_type : string) (class_id : entity_id option)
    (sorting : sorting_item list) (row_limit : int option) (row_offset : int option) :
    (int * entity_id list) option =
  match feat_type with
  | "all-pages" ->
      let exclude_ids = get_exclude_page_ids db in
      (match
         sort_eids_from_avet db
           (fun e -> all_pages_eid db exclude_ids e)
           sorting row_limit None row_offset
       with
       | Some data -> Some (count_all_page_ids db exclude_ids, data)
       | None -> None)
  | "class-objects" ->
      (match class_id with
       | Some cid ->
           let class_ids = cid :: Db_class.get_structured_children db cid in
           let tag_eids =
             Db_class.filter_visible_class_object_ids db
               (List.concat_map
                  (fun id ->
                     List.map (fun (d : datom) -> d.e)
                       (List.of_seq (datoms db Avet ~a:"block/tags" ~v:(Ref id) ())))
                  class_ids)
           in
           Some
             ( List.length tag_eids,
               take_sorted_eids db tag_eids sorting row_limit row_offset )
       | None -> None)
  | _ -> None

(* view/empty-attr-values? *)
let empty_attr_values (raw : value list) (empty_id : entity_id option) : bool =
  raw = []
  || List.for_all
       (fun v ->
          match v with
          | Nil -> true
          | Ref id -> (match empty_id with Some e -> id = e | None -> false)
          | String s -> Unicode.trim s = ""
          | List [] | Vector [] | Set [] | Map [] -> true
          | _ -> false)
       raw

(* view/compile-filter-clause *)
type compiled_clause =
  { c_schema : attr_schema
  ; c_op : string
  ; c_match : value
  ; c_match_eids : entity_id list
  ; c_match_contents : value list
  ; c_journal_day : value option
  ; c_timestamp : float option }

let compile_filter_clause db (c : filter_clause) : compiled_clause =
  let items =
    match c.f_match with
    | Set xs ->
        if xs = [] || value_mem (Keyword "empty") xs then [] else xs
    | _ -> []
  in
  { c_schema = property_attr_schema db c.f_ident
  ; c_op = c.f_op
  ; c_match = c.f_match
  ; c_match_eids = List.filter_map (match_item_id db) items
  ; c_match_contents = List.filter_map (match_item_content db) items
  ; c_journal_day =
      (match c.f_op with
       | "date-before" | "date-after" -> match_journal_day db c.f_match
       | _ -> None)
  ; c_timestamp =
      (match c.f_op with
       | "before" | "after" -> get_timestamp c.f_match
       | _ -> None) }

(* view/clause-row *)
type clause_row =
  { r_raw : value list
  ; r_ref : bool
  ; r_contents : value list
  ; r_treat_as_entity : bool
  ; r_empty_values : bool }

let clause_row db (eid : entity_id) (schema : attr_schema) (empty_id : entity_id option) : clause_row =
  let raw = indexed_attr_values db eid schema.s_ident in
  let first_raw = match raw with v :: _ -> Some v | [] -> None in
  { r_raw = raw
  ; r_ref = schema.s_ref
  ; r_contents =
      List.map
        (fun v ->
           match v with
           | Ref id when schema.s_ref -> Option.value ~default:Nil (ref_value_content db id)
           | _ -> v)
        raw
  ; r_treat_as_entity =
      (match first_raw, schema.s_ref with
       | Some (Ref id), true ->
           Option.is_some (indexed_attr_value db id "db/ident")
           || (match schema.s_type with
               | Some t -> not (List.mem t closed_value_property_types)
               | None -> true)
       | _ -> false)
  ; r_empty_values = empty_attr_values raw empty_id }

let hits_values (vs : value list) (match_ : value list) : bool =
  List.exists (fun v -> value_mem v match_) vs

(* raw Ref/Int datom values matched against eid lists *)
let hits_eids (vs : value list) (eids : entity_id list) : bool =
  List.exists
    (fun v ->
       match v with
       | Ref id -> List.mem id eids
       | Int i -> List.mem i eids
       | _ -> false)
    vs

(* view/match-is-clause *)
let match_is_clause (row : clause_row) (c : compiled_clause) : bool =
  let scalar_match = match_items c.c_match in
  match c.c_match with
  | Bool m ->
      (match row.r_contents with
       | x :: _ -> js_truthy x = m
       | [] -> not m)
  | Keyword "empty" -> row.r_empty_values
  | m when is_empty_coll m -> true
  | Set _ when row.r_ref ->
      if row.r_treat_as_entity then hits_eids row.r_raw c.c_match_eids
      else hits_values row.r_contents c.c_match_contents
  | _ -> hits_values (if row.r_ref then row.r_contents else row.r_raw) scalar_match

(* view/match-is-not-clause *)
let match_is_not_clause (row : clause_row) (c : compiled_clause) : bool =
  let scalar_match = match_items c.c_match in
  match c.c_match with
  | Bool m ->
      (match row.r_contents with
       | x :: _ -> js_truthy x <> m
       | [] -> m)
  | Keyword "empty" -> not row.r_empty_values
  | m when is_empty_coll m && row.r_raw <> [] -> true
  | m when (not (is_empty_coll m)) && coll_items m <> [] && row.r_empty_values -> true
  | Set _ when row.r_ref ->
      if row.r_treat_as_entity then not (hits_eids row.r_raw c.c_match_eids)
      else not (hits_values row.r_contents c.c_match_contents)
  | _ -> not (hits_values (if row.r_ref then row.r_contents else row.r_raw) scalar_match)

(* view/number-compare-match — strict cljs number? on contents, JS
   coercion on match; nil match → true *)
let number_compare_match (contents : value list) (m : value) (cmp : float -> float -> bool) : bool =
  match contents with
  | [] -> false
  | _ ->
      (match m with
       | Nil -> true
       | _ ->
           (match js_number_opt m with
            | None -> false
            | Some mn ->
                List.exists
                  (fun v ->
                     match strict_number_opt v with
                     | Some cn -> cmp cn mn
                     | None -> false)
                  contents))

(* view/journal-day-of — cljs integer? covers datom ref values *)
let journal_day_of db (v : value) : value option =
  match v with
  | Ref id | Int id -> indexed_attr_value db id "block/journal-day"
  | _ -> Some v

(* view/match-text-or-number-clause — None = unhandled *)
let match_text_or_number_clause (row : clause_row) (op : string) (m : value) : bool option =
  match op with
  | "text-contains" ->
      let needle = lowercase (js_str m) in
      Some
        (List.exists
           (fun v ->
              match v with
              | Nil -> false
              | _ -> contains_substring (lowercase (js_str v)) needle)
           row.r_contents)
  | "text-not-contains" ->
      let needle = js_str m in
      Some
        (not
           (List.exists (fun v -> contains_substring (js_str v) needle) row.r_contents))
  | "number-gt" -> Some (number_compare_match row.r_contents m (fun a b -> a > b))
  | "number-gte" -> Some (number_compare_match row.r_contents m (fun a b -> a >= b))
  | "number-lt" -> Some (number_compare_match row.r_contents m (fun a b -> a < b))
  | "number-lte" -> Some (number_compare_match row.r_contents m (fun a b -> a <= b))
  | "between" ->
      (match coll_items m with
       | [] -> Some true
       | start :: rest ->
           let end_ = match rest with e :: _ -> e | [] -> Nil in
           Some
             (List.exists
                (fun v ->
                   match strict_number_opt v with
                   | Some _ ->
                       (match start with
                        | Nil -> true
                        | _ ->
                            (match js_cmp start v with
                             | Some c -> c <= 0
                             | None -> false))
                       &&
                       (match end_ with
                        | Nil -> true
                        | _ ->
                            (match js_cmp v end_ with
                             | Some c -> c <= 0
                             | None -> false))
                   | None -> false)
                row.r_contents))
  | _ -> None

(* view/match-temporal-clause *)
let match_temporal_clause db (row : clause_row) (op : string) (m : value)
    (journal_day : value option) (timestamp : float option) : bool =
  match op with
  | "date-before" | "date-after" ->
      (match row.r_raw with
       | [] -> false
       | _ ->
           (match m with
            | Nil -> true
            | _ ->
                (match journal_day with
                 | None -> false
                 | Some jd ->
                     List.exists
                       (fun v ->
                          match journal_day_of db v, jd with
                          | Some d, jd ->
                              (match d, jd with
                               | Int d, Int jd ->
                                   if op = "date-before" then d < jd else d > jd
                               | _ -> false)
                          | None, _ -> false)
                       row.r_raw)))
  | "before" | "after" ->
      (match row.r_raw with
       | [] -> false
       | _ ->
           (match timestamp with
            | None -> true
            | Some ts ->
                let vs = if row.r_ref then row.r_contents else row.r_raw in
                List.exists
                  (fun v ->
                     match strict_number_opt v with
                     | Some n -> if op = "before" then n <= ts else n >= ts
                     | None -> false)
                  vs))
  | _ -> true

(* view/match-compare-clause *)
let match_compare_clause db (row : clause_row) (op : string) (m : value)
    (journal_day : value option) (timestamp : float option) : bool =
  match match_text_or_number_clause row op m with
  | Some r -> r
  | None -> match_temporal_clause db row op m journal_day timestamp

(* view/eid-clause-match? *)
let eid_clause_match db (eid : entity_id) (c : compiled_clause) (empty_id : entity_id option) : bool =
  if c.c_match = Nil then true
  else
    let row = clause_row db eid c.c_schema empty_id in
    match c.c_op with
    | "is" -> match_is_clause row c
    | "is-not" -> match_is_not_clause row c
    | op -> match_compare_clause db row op c.c_match c.c_journal_day c.c_timestamp

(* view/title-matches-input? *)
let title_matches_input db (eid : entity_id) (input : string) : bool =
  Unicode.trim input = ""
  || (match indexed_attr_value db eid "block/title" with
      | Some (String t) -> contains_substring (lowercase t) (lowercase input)
      | Some v -> contains_substring (lowercase (js_str v)) (lowercase input)
      | None -> false)

(* view/filter-eids *)
let filter_eids db (eids : entity_id list) (filters : view_filters) (input : string) :
    entity_id list =
  let clauses = filters.vf_clauses in
  if Unicode.trim input = "" && clauses = [] then eids
  else begin
    let compiled = List.map (compile_filter_clause db) clauses in
    let empty_id = Db_class.ident_eid db "logseq.property/empty-placeholder" in
    let check =
      if filters.vf_or then List.exists else List.for_all
    in
    List.filter
      (fun eid ->
         title_matches_input db eid input
         && (compiled = []
            || check (fun c -> eid_clause_match db eid c empty_id) compiled))
      eids
  end

(* view/get-feature-row-data *)
let get_feature_row_data db (feat_type : string) (class_id : entity_id option)
    (sorting : sorting_item list) (filters : view_filters) (input : string)
    (row_limit : int option) (row_offset : int option) : (int * entity_id list) option =
  let first_window =
    match row_limit with Some _ -> not (feature_filters filters input) | None -> false
  in
  match
    if first_window then
      first_window_feature_row_data db feat_type class_id sorting row_limit row_offset
    else None
  with
  | Some r -> Some r
  | None ->
      let eids_opt =
        match feat_type with
        | "all-pages" -> Some (get_all_page_ids db)
        | "class-objects" ->
            Option.map (Db_class.get_class_object_ids db) class_id
        | _ -> None
      in
      (match eids_opt with
       | Some eids ->
           let filtered = filter_eids db eids filters input in
           Some
             ( List.length filtered,
               take_sorted_eids db filtered sorting row_limit row_offset )
       | None -> None)

(* view/maybe-limit-rows *)
let maybe_limit_rows (rows : 'a list) (row_limit : int option) (row_offset : int option) :
    'a list =
  match row_limit with
  | Some l -> rows |> List.drop (Option.value ~default:0 row_offset) |> List.take l
  | None -> rows

(* view/recycled-eid? — deleted-at on the entity or a block/parent
   ancestor, raw datoms only *)
let recycled_eid db (eid : entity_id) : bool =
  let rec loop id seen =
    match id with
    | None -> false
    | Some id ->
        if Hashtbl.mem seen id then false
        else if
          Option.is_some
            (Seq.uncons (datoms db Eavt ~e:id ~a:"logseq.property/deleted-at" ()))
        then true
        else begin
          Hashtbl.replace seen id ();
          match indexed_attr_value db id "block/parent" with
          | Some (Ref p) -> loop (Some p) seen
          | _ -> false
        end
  in
  loop (Some eid) (Hashtbl.create 7)

(* view/latest-journal-day-pairs — newest-first [eid day] pairs *)
let latest_journal_day_pairs db : (entity_id * value) list =
  let today = Date_time_util.date_to_int (Date_time_util.time_ms ()) in
  let journal_tag_eid = Db_class.ident_eid db "logseq.class/Journal" in
  let seen = Hashtbl.create 31 in
  List.of_seq
    (rseek_datoms db Avet ~a:"block/journal-day" ~v:(Int today) ())
  |> List.take_while (fun (d : datom) -> d.a = "block/journal-day")
  |> List.filter (fun (d : datom) ->
         if Hashtbl.mem seen d.e then false
         else begin
           Hashtbl.replace seen d.e ();
           true
         end)
  |> List.filter (fun (d : datom) ->
         (match journal_tag_eid with
          | None -> false
          | Some t -> List.exists (fun v -> v = Ref t) (indexed_attr_values db d.e "block/tags"))
         && not (recycled_eid db d.e))
  |> List.map (fun (d : datom) -> (d.e, d.v))

(* view/view-sort-groups-desc? *)
let view_sort_groups_desc (view : entity option) : bool =
  match Option.bind view (fun v -> Ldb.value v "logseq.property.view/sort-groups-desc?") with
  | None -> true
  | Some v -> js_truthy v

(* view/comparable-ref-content *)
let comparable_ref_content db (v : value) : value option =
  match v with
  | Ref id ->
      (match Ldb.ent_of_id db id with
       | Some e ->
           (match Ldb.value e "logseq.property/value" with
            | Some x -> Some x
            | None ->
                (match ref_value_content db id with
                 | Some x -> Some x
                 | None ->
                     (match Ldb.value e "block/title" with
                      | Some x -> Some x
                      | None ->
                          (match Ldb.ident_of e with
                           | Some i -> Some (Keyword i)
                           | None -> Some (Int id)))))
       | None -> Some (Int id))
  | Map kvs ->
      (match vmap_get "db/id" kvs with
       | Some (Int id) ->
           (match vmap_get "logseq.property/value" kvs with
            | Some x -> Some x
            | None ->
                (match ref_value_content db id with
                 | Some x -> Some x
                 | None ->
                     (match vmap_get "block/title" kvs with
                      | Some x -> Some x
                      | None ->
                          (match vmap_get "db/ident" kvs with
                           | Some x -> Some x
                           | None -> Some (Int id)))))
       | _ ->
           (match vmap_get "logseq.property/value" kvs with
            | Some x -> Some x
            | None -> vmap_get "block/title" kvs))
  | _ -> Some v

(* view/comparable-sort-value *)
let comparable_sort_value db (v : value) : value =
  match v with
  | Set xs | Vector xs | List xs ->
      let items =
        List.filter_map
          (fun v ->
             match comparable_ref_content db v with
             | Some Nil | None -> None
             | x -> x)
          xs
      in
      String (String.concat ", " (List.sort String.compare (List.map js_str items)))
  | _ -> Option.value ~default:Nil (comparable_ref_content db v)

(* common-util/by-sorting *)
let by_sorting (sorters : (('a -> value) * bool) list) : 'a -> 'a -> int =
  fun a b ->
    let rec loop = function
      | [] -> 0
      | (f, asc) :: tl ->
          let c =
            if asc then compare_scalars (f a) (f b)
            else compare_scalars (f b) (f a)
          in
          if c <> 0 then c else loop tl
    in
    loop sorters

(* ---------- group-by machinery ---------- *)

type group_key =
  | GEntity of entity
  | GValue of value

let group_key_norm (g : group_key) : int * value =
  match g with GEntity e -> (0, Int e.id) | GValue v -> (1, v)

(* cljs reduce + update conj over {} — insertion-ordered groups *)
let group_entities (entities : entity list) (group_values : entity -> group_key list)
    : (group_key * entity list) list =
  let order = ref [] in
  let tbl : (int * value, group_key * entity list) Hashtbl.t = Hashtbl.create 31 in
  List.iter
    (fun (e : entity) ->
       List.iter
         (fun gk ->
            let norm = group_key_norm gk in
            match Hashtbl.find_opt tbl norm with
            | Some (_, es) -> Hashtbl.replace tbl norm (gk, e :: es)
            | None ->
                order := norm :: !order;
                Hashtbl.replace tbl norm (gk, [ e ]))
         (group_values e))
    entities;
  List.map
    (fun norm ->
       match Hashtbl.find_opt tbl norm with
       | Some (gk, es) -> (gk, List.rev es)
       | None -> (GValue Nil, []))
    (List.rev !order)

(* cljs (group-by f entities) where f returns an entity or nil *)
let group_by_entity (entities : entity list) (f : entity -> entity option)
    : (entity option * entity list) list =
  let order = ref [] in
  let tbl : (int, entity option * entity list) Hashtbl.t = Hashtbl.create 31 in
  List.iter
    (fun (e : entity) ->
       let k = f e in
       let norm = match k with Some p -> p.id | None -> -1 in
       match Hashtbl.find_opt tbl norm with
       | Some (_, es) -> Hashtbl.replace tbl norm (k, e :: es)
       | None ->
           order := norm :: !order;
           Hashtbl.replace tbl norm (k, [ e ]))
    entities;
  List.map (fun id -> Hashtbl.find tbl id) (List.rev !order)

let uuid_wire (v : value option) : Wire.t =
  match v with
  | Some (Uuid u) -> Wire.Uuid u
  | Some v -> Ds_wire.transit_of_value v
  | None -> Wire.Nil

(* {:db/id :block/parent <parent-uuid>} + explicit ref fields *)
let block_row_wire (b : entity) : Wire.t =
  let parent_uuid =
    match Ldb.ref_ent b "block/parent" with
    | Some p -> uuid_wire (Ldb.value p "block/uuid")
    | None -> Wire.Nil
  in
  Wire.Map
    (Plain_value.with_explicit_ref_fields
       [ (Wire.Keyword "db/id", Wire.Int b.id)
       ; (Wire.Keyword "block/parent", parent_uuid) ])

(* nested [block-uuid [block-row ...]] groups by :block/parent *)
let nested_block_groups_wire (blocks : entity list) : Wire.t =
  let parent_groups = group_by_entity blocks (fun b -> Ldb.ref_ent b "block/parent") in
  let sorted =
    List.stable_sort
      (fun (p1, _) (p2, _) ->
         compare_scalars
           (match p1 with Some p -> Option.value ~default:Nil (Ldb.value p "block/order") | None -> Nil)
           (match p2 with Some p -> Option.value ~default:Nil (Ldb.value p "block/order") | None -> Nil))
      parent_groups
  in
  Wire.Array
    (List.map
       (fun (_parent, bs) ->
          let head_uuid =
            match bs with
            | b :: _ -> uuid_wire (Ldb.value b "block/uuid")
            | [] -> Wire.Nil
          in
          Wire.Array
            [ head_uuid
            ; Wire.Array (List.map block_row_wire (Ldb.sort_by_order bs)) ])
       sorted)

(* plain-value of a scalar/collection value (worker-plain-value for
   non-entity values inside select-keys maps) *)
let rec plain_value_wire db (v : value) : Wire.t =
  match v with
  | Ref id ->
      (match Ldb.ent_of_id db id with
       | Some e -> Plain_value.worker_plain_entity db e
       | None -> Wire.Map [ (Wire.Keyword "db/id", Wire.Int id) ])
  | Set xs -> Wire.Set (List.map (plain_value_wire db) xs)
  | Vector xs | List xs -> Wire.Array (List.map (plain_value_wire db) xs)
  | Map kvs ->
      Wire.Map
        (Plain_value.with_explicit_ref_fields
           (List.map
              (fun (k, v) -> (Ds_wire.transit_of_value k, plain_value_wire db v))
              kvs))
  | _ -> Ds_wire.transit_of_value v

let view_select_keys =
  [ "db/id"; "db/ident"; "block/uuid"; "block/title"; "block/name"
  ; "logseq.property/value"; "logseq.property/icon"; "block/tags" ]

(* cljs (select-keys entity ks) — present attrs only, then
   worker-plain-value'd *)
let select_keys_wire db (e : entity) : Wire.t =
  Wire.Map
    (List.filter_map
       (fun a ->
          match a with
          | "db/id" -> Some (Wire.Keyword "db/id", Wire.Int e.id)
          | _ ->
              (match Ldb.value e a with
               | Some v -> Some (Wire.Keyword a, plain_value_wire db v)
               | None -> None))
       view_select_keys)

(* view/linked-references-page-list-view-data *)
let linked_references_page_list_view_data db (view : entity option)
    (entities_result : linked_reference_result) (entities : entity list) : Wire.t =
  let gs_ident =
    match
      Option.bind view (fun v -> Ldb.ref_ent v "logseq.property.view/sort-groups-by-property")
    with
    | Some p -> Option.value ~default:"block/journal-day" (Ldb.ident_of p)
    | None -> "block/journal-day"
  in
  let desc = view_sort_groups_desc view in
  let page_sort_value (page : entity) : value =
    let v = row_get page gs_ident in
    if
      gs_ident = "block/journal-day" && (not desc)
      && Ldb.value page "block/journal-day" = None
    then Float 9007199254740991.
    else Option.value ~default:Nil v
  in
  let sorters =
    ((fun (page, _blocks) -> page_sort_value page), not desc)
    :: (if gs_ident <> "block/title" then
          [ ((fun (page, _blocks) -> Option.value ~default:Nil (Ldb.value page "block/title")), not desc) ]
        else [])
  in
  let groups =
    group_by_entity entities
      (fun (e : entity) -> Some (Option.value ~default:e (Ldb.ref_ent e "block/page")))
    |> List.map (fun (k, es) -> (Option.get k, es))
  in
  let sorted_page_groups = List.stable_sort (by_sorting sorters) groups in
  let data =
    Wire.Array
      (List.map
         (fun (page, blocks) ->
            Wire.Array
              [ select_keys_wire db page
              ; nested_block_groups_wire blocks ])
         sorted_page_groups)
  in
  let pairs =
    [ (Wire.Keyword "count", Wire.Int (List.length entities))
    ; (Wire.Keyword "data", data) ]
  in
  let pairs =
    match entities_result.ref_pages_count with
    | Some (Some cs) ->
        pairs
        @ [ ( Wire.Keyword "ref-pages-count",
              Wire.Array
                (List.map
                   (fun (t, n) ->
                      Wire.Array
                        [ (match t with Some s -> Wire.String s | None -> Wire.Nil)
                        ; Wire.Int n ])
                   cs) ) ]
    | Some None -> pairs @ [ (Wire.Keyword "ref-pages-count", Wire.Nil) ]
    | None -> pairs
  in
  let pairs =
    pairs
    @ [ ( Wire.Keyword "ref-matched-children-ids",
          match entities_result.ref_matched_children_ids with
          | Some ids -> Wire.Set (List.map (fun i -> Wire.Int i) ids)
          | None -> Wire.Nil ) ]
  in
  Wire.Map pairs

(* view/get-query-properties — query is the wire form of the option *)
let get_query_properties db (query : Wire.t option) (entities : entity list) :
    Wire.t option =
  let props =
    match query with
    | Some (Wire.Array ((Wire.Keyword "find" | Wire.Symbol "find") :: expr :: _))
    | Some (Wire.List ((Wire.Keyword "find" | Wire.Symbol "find") :: expr :: _)) ->
        (match expr with
         | Wire.Array ((Wire.Symbol "pull" | Wire.Keyword "pull") :: _ :: p :: _)
         | Wire.List ((Wire.Symbol "pull" | Wire.Keyword "pull") :: _ :: p :: _) ->
             Some p
         | _ -> None)
    | _ -> None
  in
  let is_star = function
    | Wire.Array [ (Wire.Symbol "*" | Wire.Keyword "*") ]
    | Wire.List [ (Wire.Symbol "*" | Wire.Keyword "*") ] -> true
    | _ -> false
  in
  (match props with
   | Some p when not (is_star p) ->
       (match p with
        | Wire.Array _ | Wire.List _ -> Some p
        | _ -> Some (Wire.Array [ p ]))
   | _ ->
       let keys =
         List.concat_map
           (fun (e : entity) ->
              List.map (fun (d : datom) -> d.a)
                (List.of_seq (datoms db Eavt ~e:e.id ())))
           entities
       in
       let seen = Hashtbl.create 31 in
       let keys =
         List.filter
           (fun a ->
              if Hashtbl.mem seen a then false
              else begin
                Hashtbl.replace seen a ();
                true
              end)
           keys
       in
       Some (Wire.Array (List.map (fun a -> Wire.Keyword a) keys)))

(* view/get-view-data *)
let get_view_data db (view_id_opt : entity_id option) (opt : Wire.t) : Wire.t =
  let opt_v k =
    match opt with Wire.Map _ -> Wire.get k opt | _ -> None
  in
  let opt_int k =
    match opt_v k with Some (Wire.Int i) -> Some i | _ -> None
  in
  let opt_bool k =
    match opt_v k with Some (Wire.Bool b) -> b | _ -> false
  in
  let opt_string k =
    match opt_v k with Some (Wire.String s) -> Some s | _ -> None
  in
  let opt_ident k =
    match opt_v k with
    | Some (Wire.Keyword s) | Some (Wire.String s) -> Some s
    | _ -> None
  in
  if opt_bool "journals?" then begin
    let journal_days = latest_journal_day_pairs db in
    let offset = Option.value ~default:0 (opt_int "row-offset") in
    let limit = opt_int "row-limit" in
    let window =
      journal_days
      |> (fun l -> if offset > 0 then List.drop offset l else l)
      |> (fun l -> match limit with Some n -> List.take n l | None -> l)
    in
    let index =
      Wire.Array
        (List.map
           (fun (eid, day) ->
              Wire.Map
                [ (Wire.Keyword "db/id", Wire.Int eid)
                ; (Wire.Keyword "block/journal-day", Ds_wire.transit_of_value day) ])
           window)
    in
    Wire.Map
      [ ( Wire.Keyword "count",
          Wire.Int
            (match limit, offset > 0 with
             | Some _, _ | _, true -> List.length journal_days
             | _ -> List.length window) )
      ; (Wire.Keyword "data", index) ]
  end
  else begin
    let view_opt = Option.bind view_id_opt (Ldb.ent_of_id db) in
    let ident_of_ref_value = function
      | Some (Ref id) -> Option.bind (Ldb.ent_of_id db id) Ldb.ident_of
      | Some (Keyword k) -> Some k
      | _ -> None
    in
    let stored_group_ident =
      Option.bind view_opt (fun v ->
          ident_of_ref_value (Ldb.value v "logseq.property.view/group-by-property"))
    in
    let group_by_ident =
      match stored_group_ident with
      | Some i -> Some i
      | None -> opt_ident "group-by-property-ident"
    in
    let group_by_property =
      match
        Option.bind view_opt
          (fun v -> Ldb.ref_ent v "logseq.property.view/group-by-property")
      with
      | Some p -> Some p
      | None -> Option.bind group_by_ident (fun i -> Ldb.ent_of_ref db (Ident i))
    in
    let view_type_ident =
      Option.bind view_opt (fun v ->
          ident_of_ref_value (Ldb.value v "logseq.property.view/type"))
    in
    let list_view = view_type_ident = Some "logseq.property.view/type.list" in
    let group_by_closed_values =
      match group_by_property with
      | Some p -> closed_value_ents_of db p.id <> []
      | None -> false
    in
    let _ref_property =
      match group_by_property with
      | Some p -> Ldb.value p "db/valueType" = Some (Keyword "db.type/ref")
      | None -> false
    in
    let filters =
      match Option.bind view_opt (fun v -> Ldb.value v "logseq.property.table/filters") with
      | Some v -> parse_filters v
      | None ->
          (match opt_v "filters" with
           | Some w -> parse_filters (Ds_wire.value_of_transit w)
           | None -> no_filters)
    in
    let feat_type =
      match opt_ident "view-feature-type" with
      | Some t -> Some t
      | None ->
          Option.bind view_opt (fun v ->
              ident_of_ref_value (Ldb.value v "logseq.property.view/feature-type"))
    in
    let is_query = feat_type = Some "query-result" in
    let query_entity_ids =
      match opt_v "query-entity-ids" with
      | Some (Wire.Array xs) | Some (Wire.List xs) | Some (Wire.Set xs) ->
          List.filter_map (function Wire.Int i -> Some i | _ -> None) xs
          |> List.sort_uniq compare
      | _ -> []
    in
    let sorting =
      let stored =
        Option.bind view_opt (fun v -> Ldb.value v "logseq.property.table/sorting")
      in
      let use_stored =
        match stored with
        | Some (Keyword "logseq.property/empty-placeholder") | None -> false
        | Some (Vector []) | Some (List []) | Some (Set []) | Some (Map []) -> false
        | Some _ -> true
      in
      if use_stored then sorting_of_value (Option.get stored)
      else
        match opt_v "sorting" with
        | Some w ->
            (match sorting_of_value (Ds_wire.value_of_transit w) with
             | [] -> [ { s_id = "block/updated-at"; s_asc = false } ]
             | s -> s)
        | None -> [ { s_id = "block/updated-at"; s_asc = false } ]
    in
    let class_id =
      match opt_int "view-for-id" with
      | Some id -> Some id
      | None ->
          Option.bind view_opt (fun v ->
              Option.map (fun (e : entity) -> e.id)
                (Ldb.ref_ent v "logseq.property/view-for"))
    in
    let row_limit = opt_int "row-limit" in
    let row_offset = opt_int "row-offset" in
    let input = Option.value ~default:"" (opt_string "input") in
    let include_ref_pages_count =
      match opt_v "include-ref-pages-count?" with
      | Some (Wire.Bool b) -> b
      | _ -> true
    in
    let fast_row_data =
      match feat_type with
      | Some ("all-pages" | "class-objects") as ft
        when (not is_query) && group_by_ident = None ->
          get_feature_row_data db (Option.get ft) class_id sorting filters input
            row_limit row_offset
      | _ -> None
    in
    match fast_row_data with
    | Some (count, eids) ->
        Wire.Map
          [ (Wire.Keyword "count", Wire.Int count)
          ; ( Wire.Keyword "data",
              Wire.Array (List.map (fun i -> Wire.Int i) eids) ) ]
    | None ->
        let entities_result : view_entities =
          if is_query then
            Entities
              (List.filter_map
                 (fun id ->
                    match Ldb.ent_of_id db id with
                    | Some e ->
                        let created_from =
                          match
                            Ldb.ref_ent e "logseq.property/created-from-property"
                          with
                          | Some p -> Ldb.ident_of p
                          | None -> None
                        in
                        if created_from = Some "logseq.property/query" then None
                        else Some e
                    | None -> None)
                 query_entity_ids)
          else
            (match view_id_opt with
             | Some vid ->
                 get_view_entities db vid
                   ~opt_view_for_id:(opt_int "view-for-id")
                   ~opt_feat_type:(opt_ident "view-feature-type")
                   ~include_ref_pages_count ()
             | None -> No_entities)
        in
        let entities =
          match entities_result with
          | Linked r -> r.ref_blocks
          | Entities es -> es
          | No_entities -> []
        in
        let filtered =
          if filters.vf_present || Unicode.trim input <> "" then
            match build_fast_filter_pred db filters input with
            | Some p -> List.filter p entities
            | None -> List.filter (fun e -> row_matched db e filters input) entities
          else entities
        in
        let nested_list_view =
          list_view
          && List.exists
               (fun (e : entity) -> Option.is_some (Ldb.value e "block/page"))
               filtered
        in
        let group_by_page = group_by_ident = Some "block/page" in
        let linked_fast =
          feat_type = Some "linked-references" && group_by_page && list_view
          && (not filters.vf_present) && Unicode.trim input = ""
        in
        let group_values (ent : entity) : group_key list =
          let pvalue =
            match group_by_ident with
            | Some i -> row_get ent i
            | None -> None
          in
          let items =
            match pvalue with
            | Some (Set (_ :: _ as xs)) | Some (Vector (_ :: _ as xs))
            | Some (List (_ :: _ as xs)) -> xs
            | Some v -> [ v ]
            | None -> [ Nil ]
          in
          List.map
            (fun v ->
               match v with
               | Ref id ->
                   (match Ldb.ent_of_id db id with
                    | Some e ->
                        if match_property_value_as_entity db id group_by_property
                        then GEntity e
                        else
                          GValue
                            (Option.value ~default:Nil
                               (get_property_value_content db (Ref id)))
                    | None -> GValue v)
               | _ -> GValue v)
            items
        in
        let sorted_groups, sorted_entities =
          if linked_fast then ([], [])
          else if group_by_ident <> None then begin
            let gs_ident =
              match
                Option.bind view_opt
                  (fun v -> Ldb.ref_ent v "logseq.property.view/sort-groups-by-property")
              with
              | Some p -> Option.value ~default:"block/journal-day" (Ldb.ident_of p)
              | None -> "block/journal-day"
            in
            let desc = view_sort_groups_desc view_opt in
            let keyfn ident (gkey, _es) =
              if group_by_page then
                match gkey with
                | GEntity e ->
                    if
                      ident = "block/journal-day" && (not desc)
                      && Ldb.value e "block/journal-day" = None
                    then Float 9007199254740991.
                    else
                      comparable_sort_value db
                        (Option.value ~default:Nil (row_get e ident))
                | GValue _ ->
                    if ident = "block/journal-day" && not desc then
                      Float 9007199254740991.
                    else Nil
              else if group_by_closed_values then
                match gkey with
                | GEntity e -> Option.value ~default:Nil (Ldb.value e "block/order")
                | GValue _ -> Nil
              else
                match gkey with
                | GEntity e -> comparable_sort_value db (Ref e.id)
                | GValue v -> comparable_sort_value db v
            in
            let sorters =
              ((fun p -> keyfn gs_ident p), not desc)
              :: (if gs_ident <> "block/title" then
                    [ ((fun p -> keyfn "block/title" p), not desc) ]
                  else [])
            in
            ( List.stable_sort (by_sorting sorters)
                (group_entities filtered group_values),
              [] )
          end
          else ([], sort_entities db sorting filtered)
        in
        let data' =
          if linked_fast then []
          else if group_by_ident <> None then
            List.map
              (fun (gkey, es) ->
                 let by_value' =
                   match gkey with
                   | GEntity e -> select_keys_wire db e
                   | GValue v -> plain_value_wire db v
                 in
                 let group_wire =
                   if nested_list_view then nested_block_groups_wire es
                   else
                     Wire.Array
                       (List.map
                          (fun (e : entity) -> Wire.Int e.id)
                          (sort_entities db sorting es))
                 in
                 Wire.Array [ by_value'; group_wire ])
              sorted_groups
          else
            List.map (fun (e : entity) -> Wire.Int e.id) sorted_entities
        in
        if linked_fast then
          match entities_result with
          | Linked r -> linked_references_page_list_view_data db view_opt r entities
          | _ -> linked_references_page_list_view_data db view_opt
                   { ref_blocks = entities; ref_matched_children_ids = None
                   ; ref_pages_count = None } entities
        else begin
          let dedupe = feat_type = Some "property-objects" || is_query in
          let seen_wire = Hashtbl.create 31 in
          let data' =
            if dedupe then
              List.filter
                (fun w ->
                   if Hashtbl.mem seen_wire w then false
                   else begin
                     Hashtbl.replace seen_wire w ();
                     true
                   end)
                data'
            else data'
          in
          let data' =
            if row_limit <> None && group_by_ident = None then
              maybe_limit_rows data' row_limit row_offset
            else data'
          in
          let pairs =
            [ (Wire.Keyword "count", Wire.Int (List.length filtered))
            ; (Wire.Keyword "data", Wire.Array data') ]
          in
          let pairs =
            match feat_type, entities_result with
            | Some "linked-references", Linked r ->
                let pairs =
                  match r.ref_pages_count with
                  | Some (Some cs) ->
                      pairs
                      @ [ ( Wire.Keyword "ref-pages-count",
                            Wire.Array
                              (List.map
                                 (fun (t, n) ->
                                    Wire.Array
                                      [ (match t with
                                         | Some s -> Wire.String s
                                         | None -> Wire.Nil)
                                      ; Wire.Int n ])
                                 cs) ) ]
                  | Some None -> pairs @ [ (Wire.Keyword "ref-pages-count", Wire.Nil) ]
                  | None -> pairs
                in
                pairs
                @ [ ( Wire.Keyword "ref-matched-children-ids",
                      match r.ref_matched_children_ids with
                      | Some ids ->
                          Wire.Set (List.map (fun i -> Wire.Int i) ids)
                      | None -> Wire.Nil ) ]
            | _ -> pairs
          in
          let pairs =
            if is_query then
              match
                get_query_properties db (opt_v "query")
                  (match entities_result with
                   | Entities es -> es
                   | Linked r -> r.ref_blocks
                   | No_entities -> [])
              with
              | Some p -> pairs @ [ (Wire.Keyword "properties", p) ]
              | None -> pairs
            else pairs
          in
          Wire.Map pairs
        end
  end
