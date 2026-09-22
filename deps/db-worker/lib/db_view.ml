(* Faithful ports of the parts of logseq.db.common.view that the
   property endpoints reach (get-property-values → get-view-property-values
   → get-view-entities → get-entities), plus the supporting fns in
   logseq.db.common.reference and logseq.db.common.initial-data. *)

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
   direction (same as the bidirectional :alias rule). *)
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
  forward @ backward

(* common-initial-data/get-block-alias — query with the :alias rule *)
let get_block_alias db (eid : entity_id) : entity_id list =
  q_string db
    ~inputs:
      [ Arg_scalar (Result_entity eid)
      ; Arg_rules (Lazy.force Db_class.alias_rules) ]
    "[:find [?e ...] :in $ ?eid % :where (alias ?eid ?e)]"
  |> List.filter_map (function
       | [ Result_entity id ] -> Some id
       | [ Result_value (Int id) ] -> Some id
       | _ -> None)

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

(* reference/get-ref-pages-count — [(title, count)] desc by count *)
let get_ref_pages_count db (id : entity_id) (ref_blocks : entity list)
    (children_ids : entity_id list) : (string option * int) list =
  match ref_blocks with
  | [] -> []
  | _ ->
      let children = List.filter_map (Ldb.ent_of_id db) children_ids in
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
      |> List.sort (fun (_, a) (_, b) -> compare b a)

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
  ; ref_matched_children_ids : entity_id list
  ; ref_pages_count : (string option * int) list option }

(* reference/get-linked-references (include-ref-pages-count? true — the
   only caller passes the cljs default) *)
let get_linked_references db (id : entity_id) : linked_reference_result =
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
    else
      List.concat_map
        (fun (r : entity) -> get_block_children_ids db r.id)
        ref_blocks
      |> List.sort_uniq compare
  in
  { ref_blocks
  ; ref_matched_children_ids = (if has_filters then children_ids else [])
  ; ref_pages_count = Some (get_ref_pages_count db id ref_blocks children_ids)
  }

(* reference/get-unlinked-references *)
let get_unlinked_references db (id : entity_id) : entity list =
  match Ldb.ent_of_id db id with
  | Some e ->
      (match Ldb.string_value e "block/title" with
       | Some title when String.trim title <> "" ->
           let title_lc = String.lowercase_ascii title in
           List.of_seq (datoms db Avet ~a:"block/title" ())
           |> List.filter_map (fun (d : datom) ->
                  match d.v with
                  | String s
                    when d.e <> id
                         && contains_substring
                              (String.lowercase_ascii s) title_lc ->
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
      (match entity db (Lookup_ref ("block/uuid", Uuid u)) with
       | Some e ->
           Option.map (fun s -> String s) (Ldb.property_value_content e)
       | None -> None)
  | Ref id ->
      (match Ldb.ent_of_id db id with
       | Some e ->
           Option.map (fun s -> String s) (Ldb.property_value_content e)
       | None -> None)
  | Keyword k -> Some (String (":" ^ k))
  | v -> Some v

let str_of_value = function
  | String s -> s
  | Int i -> string_of_int i
  | Float f -> Printf.sprintf "%g" f
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

(* view/get-entities (include-ref-pages-count? = true — the only call
   site passes the cljs default) *)
let get_entities db ~feat_type ~index_attr ~view_for_id : view_entities =
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
             (q_string db
                ~inputs:
                  [ Arg_rules (Lazy.force Db_class.property_objects_rules)
                  ; Arg_scalar (Result_attr prop_ident) ]
                "[:find [?b ...] :in $ % ?prop :where \
                 (has-property-or-object-property? ?b ?prop)]"
              |> List.filter_map (function
                   | [ Result_entity id ] -> non_hidden id
                   | [ Result_value (Int id) ] -> non_hidden id
                   | _ -> None))
       | None -> No_entities)
  | Some "linked-references" ->
      (match view_for_id with
       | Some id -> Linked (get_linked_references db id)
       | None -> No_entities)
  | Some "unlinked-references" ->
      (match view_for_id with
       | Some id -> Entities (get_unlinked_references db id)
       | None -> No_entities)
  | _ -> No_entities

(* view/get-view-entities — our callers only pass :view-id *)
let get_view_entities db (view_id : entity_id) : view_entities =
  match Ldb.ent_of_id db view_id with
  | None -> No_entities
  | Some view ->
      let feat_type =
        match Ldb.value view "logseq.property.view/feature-type" with
        | Some (Keyword k) -> Some k
        | Some (Ref id) -> Option.bind (Ldb.ent_of_id db id) Ldb.ident_of
        | _ -> None
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
        Option.map
          (fun (e : entity) -> e.id)
          (Ldb.ref_ent view "logseq.property/view-for")
      in
      get_entities db ~feat_type ~index_attr ~view_for_id

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
        (match get_view_entities db view_id with
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
                  if String.trim label_s = "" || Option.equal Int.equal empty_id value_eid
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
let get_property_values db (property_ident : attr) ~view_id ~query_entity_ids :
    Wire.t list =
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
