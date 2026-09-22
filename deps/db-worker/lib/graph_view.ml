(* frontend.worker.graph-view — build-graph port.
   Produces {:nodes [...] :links [...]} (+ :meta / :all-pages) wire maps
   identical in shape to the cljs implementation. *)

open Datascript

module IntSet = Set.Make (Int)
module IntMap = Map.Make (Int)

let kw s = Wire.Keyword s
let imadd m k v = IntMap.add k v m

(* ---------- datom helpers ---------- *)

let datom_e (d : datom) = d.e

let datom_v_id (d : datom) : entity_id option =
  match d.v with
  | Ref id | Int id -> Some id
  | _ -> None

(* cljs datoms-for — guard by (d/entid db attr) *)
let datoms_for (db : db) (a : attr) : datom list =
  if Option.is_some (Datascript.entid_ref db (Ident a)) then
    List.of_seq (datoms db Avet ~a ())
  else []

let datoms_for_v (db : db) (a : attr) (v : value) : datom list =
  let vid =
    match v with
    | Keyword k -> Datascript.entid_ref db (Ident k)
    | Ref id | Int id -> Some id
    | _ -> None
  in
  match vid, Option.is_some (Datascript.entid_ref db (Ident a)) with
  | Some id, true -> List.of_seq (datoms db Avet ~a ~v:(Ref id) ())
  | _ -> []

let entity_ids_with (db : db) (a : attr) : IntSet.t =
  List.fold_left (fun s d -> IntSet.add d.e s) IntSet.empty (datoms_for db a)

let entity_ids_with_v (db : db) (a : attr) (v : value) : IntSet.t =
  List.fold_left
    (fun s d -> IntSet.add d.e s)
    IntSet.empty
    (datoms_for_v db a v)

let entity_value_map (db : db) (a : attr) (ids : IntSet.t) : value IntMap.t =
  if IntSet.is_empty ids then IntMap.empty
  else
    List.fold_left
      (fun m d -> if IntSet.mem d.e ids then imadd m d.e d.v else m)
      IntMap.empty
      (datoms_for db a)

let entity_value_map_by_id (db : db) (a : attr) (ids : IntSet.t)
    : value IntMap.t =
  IntSet.fold
    (fun id m ->
      match Seq.uncons (datoms db Eavt ~e:id ~a ()) with
      | Some (d, _) -> imadd m id d.v
      | None -> m)
    ids IntMap.empty

(* ---------- titles ---------- *)

let strip_ref_re =
  Regexp.compile {|#?\[\[([^\]]+)\]\]|}

let strip_title_refs (s : string) : string =
  Regexp.replace_all strip_ref_re s
    ~f:(fun ~match_:_ ~groups ~offset:_ ~input:_ ->
      match groups.(1) with Some g -> g | None -> "")

let entity_display_title (e : entity) : string option =
  match Ldb.string_value e "block/title" with
  | Some title ->
      let has_ref = Regexp.test Db_content.id_ref_re title in
      let title' =
        if has_ref then
          match Db_content.recur_replace_uuid_in_block_title e ~max_depth:10 with
          | Some t -> t
          | None -> title
        else title
      in
      if has_ref then Some (strip_title_refs title') else Some title'
  | None -> None

(* entity-title-map — title per id via eavt, with id-ref normalization *)
let entity_title_map ?(normalize_id_refs = true) (db : db)
    (ids : entity_id list) : string IntMap.t =
  List.fold_left
    (fun m id ->
      match Seq.uncons (datoms db Eavt ~e:id ~a:"block/title" ()) with
      | Some (d, _) -> (
          match d.v with
          | String title ->
              let contains_ref = Ns_util.str_contains title "[[" in
              let title' =
                if
                  normalize_id_refs && contains_ref
                  && Regexp.test Db_content.id_ref_re title
                then
                  match Ldb.ent_of_id db id with
                  | Some e -> (
                      match
                        Db_content.recur_replace_uuid_in_block_title e
                          ~max_depth:10
                      with
                      | Some t -> t
                      | None -> title)
                  | None -> title
                else title
              in
imadd m id (if contains_ref then strip_title_refs title' else title')
          | _ -> m)
      | None -> m)
    IntMap.empty
    (List.filter_map (fun i -> Some i) ids)

let entity_id_subset_with (db : db) (a : attr) (ids : IntSet.t) : IntSet.t =
  List.fold_left
    (fun s d -> if IntSet.mem d.e ids then IntSet.add d.e s else s)
    IntSet.empty
    (datoms_for db a)

(* ---------- node context ---------- *)

type node_context =
  { title_by_id : string IntMap.t
  ; name_by_id : string IntMap.t
  ; uuid_by_id : string IntMap.t
  ; icon_by_id : value IntMap.t
  ; created_at_by_id : value IntMap.t
  ; ident_by_id : string IntMap.t
  }

let string_map_of_value_map m =
  IntMap.fold
    (fun k v acc ->
      match v with
      | String s -> imadd acc k s
      | _ -> acc)
    m IntMap.empty

let uuid_map_of_value_map m =
  IntMap.fold
    (fun k v acc ->
      match v with
      | Uuid s -> imadd acc k s
      | _ -> acc)
    m IntMap.empty

let build_node_context ?(normalize_id_refs = true) (db : db)
    (node_ids : IntSet.t) : node_context =
  let title_by_id = entity_title_map ~normalize_id_refs db (IntSet.elements node_ids) in
  let title_missing =
    IntSet.diff node_ids
      (IntMap.fold (fun k _ acc -> IntSet.add k acc) title_by_id IntSet.empty)
  in
  let name_by_id =
    if IntSet.is_empty title_missing then IntMap.empty
    else string_map_of_value_map (entity_value_map db "block/name" title_missing)
  in
  let uuid_by_id =
    uuid_map_of_value_map (entity_value_map_by_id db "block/uuid" node_ids)
  in
  let icon_by_id = entity_value_map db "logseq.property/icon" node_ids in
  let created_at_by_id =
    entity_value_map db "block/created-at" node_ids
  in
  let ident_by_id =
    string_map_of_value_map
      (entity_value_map_by_id db "db/ident" node_ids)
  in
  { title_by_id
  ; name_by_id
  ; uuid_by_id
  ; icon_by_id
  ; created_at_by_id
  ; ident_by_id
  }

(* ---------- visibility ---------- *)

let hidden_or_recycled (e : entity) : bool = Ldb.hidden e || Ldb.recycled e

let entity_or_parent_matches (e : entity) (pred : entity -> bool) : bool =
  let rec loop (e : entity) (seen : IntSet.t) =
    if IntSet.mem e.id seen then false
    else if pred e then true
    else
      match Ldb.ref_ent e "block/parent" with
      | Some p -> loop p (IntSet.add e.id seen)
      | None -> false
  in
  loop e IntSet.empty

let graph_visible_entity (e : entity) : bool =
  (not (entity_or_parent_matches e hidden_or_recycled))
  &&
  (match Ldb.ref_ent e "block/page" with
   | Some p -> not (hidden_or_recycled p)
   | None -> true)

let truthy_value = function
  | Some (Bool true) -> true
  | _ -> false

let excluded_from_graph (e : entity) : bool =
  entity_or_parent_matches e (fun x ->
    truthy_value (Ldb.value x "logseq.property/exclude-from-graph-view"))
  ||
  (match Ldb.ref_ent e "block/page" with
   | Some p ->
       truthy_value (Ldb.value p "logseq.property/exclude-from-graph-view")
   | None -> false)

let visible_entity (e : entity) : bool =
  graph_visible_entity e && not (excluded_from_graph e)

let invisible_id_set (db : db) : IntSet.t =
  IntSet.union
    (entity_ids_with_v db "logseq.property/hide?" (Bool true))
    (IntSet.union
       (entity_ids_with db "logseq.property/deleted-at")
       (entity_ids_with_v db "logseq.property/exclude-from-graph-view"
          (Bool true)))

(* parent-id-map: transitive map id -> parent-id for all ancestors *)
let parent_id_map (db : db) (ids : IntSet.t) : entity_id IntMap.t =
  let rec loop result frontier seen =
    let frontier = IntSet.diff frontier seen in
    if IntSet.is_empty frontier then result
    else
      let parents = entity_value_map db "block/parent" frontier in
      let parent_eids =
        IntMap.fold
          (fun _ v acc ->
            match Db_view.entid v with
            | Some id -> IntSet.add id acc
            | None -> acc)
          parents IntSet.empty
      in
      loop
        (IntMap.fold
           (fun k v acc ->
             match Db_view.entid v with
             | Some id -> imadd acc k id
             | None -> acc)
           parents result)
        parent_eids
        (IntSet.union seen frontier)
  in
  loop IntMap.empty ids IntSet.empty

let invalid_id_or_parent (invalid_ids : IntSet.t) (parent_by_id : entity_id IntMap.t)
    (id : entity_id) : bool =
  let rec loop id seen =
    if IntSet.mem id seen then false
    else if IntSet.mem id invalid_ids then true
    else
      match IntMap.find_opt id parent_by_id with
      | Some p -> loop p (IntSet.add id seen)
      | None -> false
  in
  loop id IntSet.empty

let visible_object_id_set (db : db) ~(class_ids : IntSet.t)
    ~(property_ids : IntSet.t) (object_ids : IntSet.t) : IntSet.t =
  let object_ids =
    object_ids
    |> IntSet.filter (fun id -> not (IntSet.mem id class_ids))
    |> IntSet.filter (fun id -> not (IntSet.mem id property_ids))
  in
  let invalid_ids = invisible_id_set db in
  let parent_by_id = parent_id_map db object_ids in
  let page_by_id = entity_value_map db "block/page" object_ids in
  object_ids
  |> IntSet.filter (fun id ->
       not (invalid_id_or_parent invalid_ids parent_by_id id))
  |> IntSet.filter (fun id ->
       match IntMap.find_opt id page_by_id with
       | Some (Ref pid | Int pid) -> not (IntSet.mem pid invalid_ids)
       | _ -> true)

(* ---------- link maps ---------- *)

let str_map_get (m : (string, 'v) Hashtbl.t) k = Hashtbl.find_opt m k

type link_raw =
  { from_id : entity_id option
  ; to_id : entity_id option
  ; label : string option
  ; class_extends : bool
  }

let link from to_ ?label ?(ce = false) () =
  { from_id = Some from; to_id = Some to_; label; class_extends = ce }

(* build-links: dedupe by [source target] endpoints; class-extends sets
   edge/type + label on the first-seen link *)
let build_links (links : link_raw list) : Wire.t list =
  let index_by_endpoints : (string * string, int) Hashtbl.t =
    Hashtbl.create 64
  in
  let result = ref [] in
  List.iter
    (fun l ->
      match l.from_id, l.to_id with
      | Some from, Some to_ ->
          let source = string_of_int from and target = string_of_int to_ in
          let endpoints = (source, target) in
          let label_ =
            match l.label with
            | Some s when String.trim s <> "" -> Some s
            | _ -> None
          in
          (match Hashtbl.find_opt index_by_endpoints endpoints with
           | Some idx ->
               if l.class_extends then (
                 (* replace entry at idx *)
                 let entry =
                   Wire.Map
                     ( [ (kw "source", Wire.String source)
                       ; (kw "target", Wire.String target)
                       ; (kw "edge/type", Wire.String "class-extends") ]
                     @
                     match label_ with
                     | Some s -> [ (kw "label", Wire.String s) ]
                     | None -> [] )
                 in
                 result := List.mapi (fun i x -> if i = idx then entry else x) !result)
               else
                 (match label_ with
                  | Some s -> (
                      (* assoc label onto existing entry *)
                      match List.nth_opt !result idx with
                      | Some (Wire.Map kvs)
                        when not
                               (List.exists
                                  (fun (k, _) -> Wire.key_matches "label" k)
                                  kvs) ->
                          result :=
                            List.mapi
                              (fun i x ->
                                if i = idx then
                                  Wire.Map (kvs @ [ (kw "label", Wire.String s) ])
                                else x)
                              !result
                      | _ -> ())
                  | None -> ())
           | None ->
               let entry =
                 Wire.Map
                   ( [ (kw "source", Wire.String source)
                     ; (kw "target", Wire.String target) ]
                   @ (if l.class_extends then
                        [ (kw "edge/type", Wire.String "class-extends") ]
                      else [])
                   @
                   match label_ with
                   | Some s -> [ (kw "label", Wire.String s) ]
                   | None -> [] )
               in
               Hashtbl.replace index_by_endpoints endpoints (List.length !result);
               result := !result @ [ entry ])
      | _ -> ())
    links;
  !result

(* ---------- helpers ---------- *)

let normalize_view_mode = function
  | "all-pages" -> "all-pages"
  | _ -> "tags-and-objects"

let large_all_pages_fast_threshold = 10000
let large_all_pages_link_limit = 20000

let hidden_built_in_tag_idents =
  [ "logseq.class/Root"; "logseq.class/Tag"; "logseq.class/Property"
  ; "logseq.class/Page"; "logseq.class/Whiteboard"; "logseq.class/Comments"
  ; "logseq.class/Asset" ]

let dark_theme = function
  | Some (Wire.String "dark" | Wire.Keyword "dark") -> true
  | _ -> false

let property_link_title (db : db) (property_ident : string) : string =
  match entity db (Ident property_ident) with
  | Some e -> (
      match Ldb.string_value e "block/title" with
      | Some t -> t
      | None -> (
          match String.index_opt property_ident '/' with
          | Some i ->
              String.sub property_ident (i + 1)
                (String.length property_ident - i - 1)
          | None -> property_ident))
  | None -> (
      match String.index_opt property_ident '/' with
      | Some i ->
          String.sub property_ident (i + 1)
            (String.length property_ident - i - 1)
      | None -> property_ident)

(* ref-property-idents: user.property/* attrs with :db.type/ref schema
   whose entity is a property *)
let ref_property_idents (db : db) : string list =
  List.filter_map
    (fun (a, sa) ->
      match sa.value_type with
      | Some RefType ->
          (match String.index_opt a '/' with
           | Some i when String.sub a 0 i = "user.property" ->
               (match entity db (Ident a) with
                | Some e when Ldb.is_property e -> Some a
                | _ -> None)
           | _ -> None)
      | _ -> None)
    (Datascript.schema db)

(* graph-link-node-id-map: entity-id -> node-id *)
let graph_link_node_id_map (db : db) (mode : [ `Entity | `Page ])
    (entity_ids : entity_id list) (node_id_set : IntSet.t) :
    entity_id IntMap.t =
  match mode with
  | `Entity ->
      List.fold_left (fun m id -> imadd m id id) IntMap.empty entity_ids
  | `Page ->
      let eid_set =
        List.fold_left (fun s id -> IntSet.add id s) IntSet.empty entity_ids
      in
      let direct = IntSet.inter eid_set node_id_set in
      let child = IntSet.diff eid_set direct in
      let page_by_child = entity_value_map db "block/page" child in
      let m =
        IntSet.fold (fun id m -> imadd m id id) direct IntMap.empty
      in
      IntMap.fold
        (fun cid v m ->
          match Db_view.entid v with Some p -> imadd m cid p | None -> m)
        page_by_child m

let property_ref_link_tuples (db : db) (node_id_set : IntSet.t)
    ~(source_mode : [ `Entity | `Page ]) ~(target_mode : [ `Entity | `Page ])
    : link_raw list =
  let raw_links =
    List.concat_map
      (fun property_ident ->
        let label = property_link_title db property_ident in
        List.filter_map
          (fun (d : datom) ->
            match datom_v_id d with
            | Some v -> Some (d.e, v, label)
            | None -> None)
          (datoms_for db property_ident))
      (ref_property_idents db)
  in
  let source_map =
    graph_link_node_id_map db source_mode (List.map (fun (s, _, _) -> s) raw_links)
      node_id_set
  and target_map =
    graph_link_node_id_map db target_mode (List.map (fun (_, t, _) -> t) raw_links)
      node_id_set
  in
  List.filter_map
    (fun (se, te, label) ->
      match IntMap.find_opt se source_map, IntMap.find_opt te target_map with
      | Some sid, Some tid
        when sid <> tid && IntSet.mem sid node_id_set
             && IntSet.mem tid node_id_set ->
          Some (link sid tid ~label ())
      | _ -> None)
    (List.sort_uniq compare raw_links)

(* class-extends-links BFS *)
let class_extends_links (db : db) (seed_class_ids : IntSet.t)
    (allowed_class_id : entity_id -> bool) : link_raw list =
  let label = property_link_title db "logseq.property.class/extends" in
  let has_attr =
    Option.is_some (Datascript.entid_ref db (Ident "logseq.property.class/extends"))
  in
  let rec loop frontier seen links =
    match frontier with
    | [] -> links
    | class_id :: rest ->
        if IntSet.mem class_id seen then loop rest seen links
        else
          let parent_ids =
            if has_attr then
              datoms db Eavt ~e:class_id ~a:"logseq.property.class/extends" ()
              |> Seq.filter_map datom_v_id
              |> List.of_seq
              |> List.filter allowed_class_id
            else []
          in
          loop
            (rest @ parent_ids)
            (IntSet.add class_id seen)
            (links
             @ List.map
                 (fun pid -> link class_id pid ~label ~ce:true ())
                 parent_ids)
  in
  loop (IntSet.elements seed_class_ids) IntSet.empty []
  |> List.sort_uniq compare

let link_node_ids (links : link_raw list) : IntSet.t =
  List.fold_left
    (fun s l ->
      let s =
        match l.from_id with Some f -> IntSet.add f s | None -> s
      in
      match l.to_id with Some t -> IntSet.add t s | None -> s)
    IntSet.empty links

let all_pages_class_extends_links (db : db) (page_id_set : IntSet.t)
    (ident_by_page_id : string IntMap.t) : link_raw list =
  let class_page_ids =
    IntSet.inter page_id_set
      (entity_ids_with_v db "block/tags" (Keyword "logseq.class/Tag"))
  in
  class_extends_links db class_page_ids (fun id ->
    IntSet.mem id page_id_set
    &&
    match IntMap.find_opt id ident_by_page_id with
    | Some ident -> not (List.mem ident hidden_built_in_tag_idents)
    | None -> true)

let visible_page_class_extends_links (db : db) (page_id : entity_id)
    : link_raw list =
  class_extends_links db (IntSet.singleton page_id) (fun id ->
    match Ldb.ent_of_id db id with
    | Some e ->
        visible_entity e && (not (Ldb.is_property e))
        && (match Ldb.ident_of e with
            | Some ident -> not (List.mem ident hidden_built_in_tag_idents)
            | None -> true)
    | None -> false)

let built_in_class_ident (ident : string) : bool =
  match String.index_opt ident '/' with
  | Some i -> String.sub ident 0 i = "logseq.class"
  | None -> false

(* ---------- scalar-node ---------- *)

let scalar_node (ctx : node_context) (id : entity_id) (kind : string)
    (page : bool) : Wire.t =
  let title = IntMap.find_opt id ctx.title_by_id in
  let name = IntMap.find_opt id ctx.name_by_id in
  let uuid = IntMap.find_opt id ctx.uuid_by_id in
  let icon = IntMap.find_opt id ctx.icon_by_id in
  let created_at = IntMap.find_opt id ctx.created_at_by_id in
  let ident = IntMap.find_opt id ctx.ident_by_id in
  let label =
    match title, name, uuid with
    | Some t, _, _ -> t
    | None, Some n, _ -> n
    | None, None, Some u -> u
    | _ -> string_of_int id
  in
  Wire.Map
    ( [ (kw "id", Wire.String (string_of_int id))
      ; (kw "db-id", Wire.Int id)
      ; (kw "uuid", (match uuid with Some u -> Wire.String u | None -> Wire.Nil))
      ; (kw "page?", Wire.Bool page)
      ; (kw "label", Wire.String label)
      ; (kw "kind", Wire.String kind) ]
    @ (match created_at with
       | Some v -> [ (kw "block/created-at", Ds_wire.transit_of_value v) ]
       | None -> [])
    @ (if kind = "tag" then
         match ident with
         | Some i -> [ (kw "db-ident", kw i) ]
         | None -> []
       else [])
    @
    match icon with
    | Some v -> [ (kw "icon", Ds_wire.transit_of_value v) ]
    | None -> [] )

(* ---------- tags-and-objects graph ---------- *)

let build_tags_and_objects_graph (db : db) : Wire.t =
  let tag_datoms = datoms_for db "block/tags" in
  let class_ids = entity_ids_with_v db "block/tags" (Keyword "logseq.class/Tag") in
  let property_ids =
    entity_ids_with_v db "block/tags" (Keyword "logseq.class/Property")
  in
  let ident_by_class_id =
    IntSet.fold
      (fun id m ->
        match Ldb.ent_of_id db id with
        | Some e -> (
            match Ldb.ident_of e with
            | Some i -> imadd m id i
            | None -> m)
        | None -> m)
      class_ids IntMap.empty
  in
  let allowed_tag_id id =
    match Ldb.ent_of_id db id with
    | Some e ->
        visible_entity e && (not (IntSet.mem id property_ids))
        && (match IntMap.find_opt id ident_by_class_id with
            | Some ident -> not (List.mem ident hidden_built_in_tag_idents)
            | None -> true)
    | None -> false
  in
  let user_tag_id_set =
    class_ids
    |> IntSet.filter allowed_tag_id
    |> IntSet.filter (fun id ->
         match IntMap.find_opt id ident_by_class_id with
         | Some i -> not (built_in_class_ident i)
         | None -> true)
  in
  let allowed_builtin_tag_id_set =
    class_ids
    |> IntSet.filter allowed_tag_id
    |> IntSet.filter (fun id ->
         match IntMap.find_opt id ident_by_class_id with
         | Some i -> built_in_class_ident i
         | None -> false)
  in
  let candidate_tag_id_set = IntSet.union user_tag_id_set allowed_builtin_tag_id_set in
  let candidate_tag_links =
    List.filter_map
      (fun (d : datom) ->
        match datom_v_id d with
        | Some tag_id
          when IntSet.mem tag_id candidate_tag_id_set
               && not (IntSet.mem d.e candidate_tag_id_set) ->
            Some (d.e, tag_id)
        | _ -> None)
      tag_datoms
    |> List.sort_uniq compare
  in
  let visible_object_ids =
    candidate_tag_links
    |> List.map fst
    |> List.fold_left (fun s id -> IntSet.add id s) IntSet.empty
    |> visible_object_id_set db ~class_ids ~property_ids
  in
  let visible_tag_links =
    List.filter
      (fun (from_id, _) -> IntSet.mem from_id visible_object_ids)
      candidate_tag_links
  in
  let visible_tag_id_set0 =
    List.fold_left (fun s (_, t) -> IntSet.add t s) IntSet.empty visible_tag_links
  in
  let used_builtin_tag_id_set =
    IntSet.inter allowed_builtin_tag_id_set visible_tag_id_set0
  in
  let visible_tag_id_set =
    IntSet.union
      (IntSet.inter user_tag_id_set visible_tag_id_set0)
      used_builtin_tag_id_set
  in
  let extends_links =
    class_extends_links db visible_tag_id_set
      (fun id -> IntSet.mem id candidate_tag_id_set)
  in
  let tag_id_set = IntSet.union visible_tag_id_set (link_node_ids extends_links) in
  if IntSet.is_empty tag_id_set || IntSet.is_empty visible_object_ids then
    Wire.Map [ (kw "nodes", Wire.Array []); (kw "links", Wire.Array []) ]
  else begin
    let tag_links =
      List.filter (fun (_, t) -> IntSet.mem t tag_id_set) visible_tag_links
    in
    let object_id_set =
      List.fold_left (fun s (f, _) -> IntSet.add f s) IntSet.empty tag_links
    in
    let node_ids = IntSet.union tag_id_set object_id_set in
    let page_ids = entity_id_subset_with db "block/name" object_id_set in
    let context = build_node_context db node_ids in
    let tags =
      List.map (fun id -> scalar_node context id "tag" true)
        (IntSet.elements tag_id_set)
    in
    let objects =
      List.map
        (fun id -> scalar_node context id "object" (IntSet.mem id page_ids))
        (IntSet.elements object_id_set)
    in
    let nodes = tags @ objects in
    let node_id_set_str =
      List.fold_left
        (fun s n ->
          match n with
          | Wire.Map kvs -> (
              match Wire.get "id" (Wire.Map kvs) with
              | Some (Wire.String i) -> s |> fun s -> i :: s
              | _ -> s)
          | _ -> s)
        [] nodes
    in
    let node_id_str_set =
      List.fold_left
        (fun (s : (string, unit) Hashtbl.t) i -> Hashtbl.replace s i (); s)
        (Hashtbl.create 64) node_id_set_str
    in
    let links =
      build_links
        ( List.map (fun (f, t) -> link f t ()) tag_links
        @ extends_links )
      |> List.filter (fun l ->
           match l with
           | Wire.Map kvs -> (
               match
                 Wire.get "source" (Wire.Map kvs),
                 Wire.get "target" (Wire.Map kvs)
               with
               | Some (Wire.String s), Some (Wire.String t) ->
                   Hashtbl.mem node_id_str_set s && Hashtbl.mem node_id_str_set t
               | _ -> false)
           | _ -> false)
    in
    let property_links =
      build_links
        (property_ref_link_tuples db node_ids ~source_mode:`Entity
           ~target_mode:`Entity)
      |> List.filter (fun l ->
           match l with
           | Wire.Map kvs -> (
               match
                 Wire.get "source" (Wire.Map kvs),
                 Wire.get "target" (Wire.Map kvs)
               with
               | Some (Wire.String s), Some (Wire.String t) ->
                   Hashtbl.mem node_id_str_set s && Hashtbl.mem node_id_str_set t
               | _ -> false)
           | _ -> false)
    in
    let all_links = List.sort_uniq compare (links @ property_links) in
    Wire.Map
      [ (kw "nodes", Wire.Array nodes)
      ; (kw "links", Wire.Array all_links) ]
  end

(* ---------- page/block graphs ---------- *)

let page_kind (tag_idents : string list) : string =
  if List.mem "logseq.class/Tag" tag_idents then "tag"
  else if List.mem "logseq.class/Property" tag_idents then "property"
  else if List.mem "logseq.class/Journal" tag_idents then "journal"
  else "page"

let page_graph_node_color ~dark kind ~current_page : string =
  if current_page then (if dark then "#93C5FD" else "#2563EB")
  else if kind = "tag" then (if dark then "#A78BFA" else "#8B5CF6")
  else if kind = "property" then (if dark then "#F0B891" else "#D97706")
  else if kind = "journal" then (if dark then "#7DD3FC" else "#0284C7")
  else if dark then "#9CA3AF"
  else "#CBD5E1"

let cbrt n = Float.of_int n ** (1.0 /. 3.0)

(* build-nodes — page-graph/node entries with size+color *)
let build_nodes ~dark ~current_page (page_links : int IntMap.t option)
    (nodes : entity list) : Wire.t list =
  let seen = Hashtbl.create 64 in
  List.filter_map
    (fun (p : entity) ->
      if Hashtbl.mem seen p.id || Ldb.hidden p then None
      else begin
        Hashtbl.replace seen p.id ();
        match entity_display_title p with
        | Some page_title ->
            let current_page' = page_title = current_page in
            let kind =
              if Ldb.is_class p then "tag"
              else if Ldb.is_property p then "property"
              else if Ldb.is_journal p then "journal"
              else "page"
            in
            let color = page_graph_node_color ~dark kind ~current_page:current_page' in
            let n =
              match page_links with
              | Some m -> Option.value (IntMap.find_opt p.id m) ~default:1
              | None -> 1
            in
            let size =
              int_of_float (8.0 *. Float.max 1.0 (cbrt n))
            in
            let uuid =
              match Ldb.value p "block/uuid" with
              | Some (Uuid u) -> Some u
              | _ -> None
            in
            Some
              (Wire.Map
                 ( [ (kw "id", Wire.String (string_of_int p.id))
                   ; (kw "db-id", Wire.Int p.id)
                   ; (kw "uuid",
                       (match uuid with Some u -> Wire.String u | None -> Wire.Nil))
                   ; (kw "page?", Wire.Bool true)
                   ; (kw "label", Wire.String page_title)
                   ; (kw "kind", Wire.String kind)
                   ; (kw "size", Wire.Int size)
                   ; (kw "color", Wire.String color) ]
                 @
                 match Ldb.value p "block/created-at" with
                 | Some v -> [ (kw "block/created-at", Ds_wire.transit_of_value v) ]
                 | None -> [] ))
        | None -> None
      end)
    nodes

let tag_ident_by_id (db : db) (tag_ids : IntSet.t) : string IntMap.t =
  IntSet.fold
    (fun id m ->
      match Ldb.ent_of_id db id with
      | Some e -> (
          match Ldb.ident_of e with
          | Some i -> imadd m id i
          | None -> m)
      | None -> m)
    tag_ids IntMap.empty

(* tagged pages: [page-id, tag-id] from :block/tags *)
let tagged_page_links (db : db) : (entity_id * entity_id) list =
  datoms db Avet ~a:"block/tags" ()
  |> Seq.filter_map (fun (d : datom) ->
       match datom_v_id d with Some t -> Some (d.e, t) | None -> None)
  |> List.of_seq

let page_tag_links (tagged : (entity_id * entity_id) list)
    (page_id_set : IntSet.t) =
  List.filter (fun (f, _) -> IntSet.mem f page_id_set) tagged

let rendered_page_tag_links (tagged : (entity_id * entity_id) list)
    (page_id_set : IntSet.t) =
  List.filter (fun (f, t) -> IntSet.mem f page_id_set && IntSet.mem t page_id_set) tagged

let page_parent_links (db : db) (page_id_set : IntSet.t) : link_raw list =
  datoms_for db "block/parent"
  |> List.filter_map (fun (d : datom) ->
       match datom_v_id d with
       | Some pid
         when IntSet.mem d.e page_id_set && IntSet.mem pid page_id_set ->
           Some (link d.e pid ())
       | _ -> None)
  |> List.sort_uniq compare

let page_relation_links (db : db) ~(with_journal : bool)
    (page_id_tag_idents : string list IntMap.t) : link_raw list =
  let ref_datoms = List.of_seq (datoms db Avet ~a:"block/refs" ()) in
  let block_ids =
    List.fold_left (fun s (d : datom) -> IntSet.add d.e s) IntSet.empty ref_datoms
  in
  let page_by_block = entity_value_map db "block/page" block_ids in
  List.filter_map
    (fun (d : datom) ->
      match datom_v_id d, IntMap.find_opt d.e page_by_block with
      | Some ref_page_id, Some page_v -> (
          match Db_view.entid page_v with
          | Some page_id ->
              let journal =
                match IntMap.find_opt page_id page_id_tag_idents with
                | Some idents -> List.mem "logseq.class/Journal" idents
                | None -> false
              in
              if with_journal || not journal then
                Some (link page_id ref_page_id ())
              else None
          | None -> None)
      | _ -> None)
    ref_datoms

let property_page (tag_idents : string list) : bool =
  List.mem "logseq.class/Property" tag_idents

let show_orphan_pages = function
  | Some (Wire.Bool false) -> false
  | _ -> true

let built_in_pages_lower =
  List.map String.lowercase_ascii Ldb.built_in_pages_names

let opts_bool (opts : Wire.t) k ~default =
  match Wire.get k opts with
  | Some (Wire.Bool b) -> b
  | _ -> default

(* bounded-visible-page-links *)
let bounded_visible_page_links (db : db) (visible_page_ids : IntSet.t)
    (tagged_pages : (entity_id * entity_id) list) : link_raw list * IntSet.t =
  let tag_links =
    List.filter
      (fun (f, t) -> IntSet.mem f visible_page_ids && IntSet.mem t visible_page_ids)
      tagged_pages
    |> List.sort_uniq compare
    |> List.map (fun (f, t) -> link f t ())
  in
  let initial_linked =
    List.fold_left
      (fun s l ->
        let s =
          match l.from_id with Some f -> IntSet.add f s | None -> s
        in
        match l.to_id with Some t -> IntSet.add t s | None -> s)
      IntSet.empty tag_links
  in
  let rec loop (ds : datom Seq.t) links linked =
    match Seq.uncons ds with
    | None -> (links, linked)
    | Some (d, rest) -> (
        match datom_v_id d, Ldb.ent_of_id db d.e with
        | Some ref_page_id, Some block_ent -> (
            match Ldb.ref_ent block_ent "block/page" with
            | Some p ->
                let page_id = p.id in
                let visible =
                  IntSet.mem page_id visible_page_ids
                  && IntSet.mem ref_page_id visible_page_ids
                in
                let links' =
                  if visible && List.length links < large_all_pages_link_limit then
                    links @ [ link page_id ref_page_id () ]
                  else links
                in
                let linked' =
                  if visible then
                    IntSet.add ref_page_id (IntSet.add page_id linked)
                  else linked
                in
                loop rest links' linked'
            | None -> loop rest links linked)
        | _ -> loop rest links linked)
  in
  loop (datoms db Avet ~a:"block/refs" ()) tag_links initial_linked

type all_pages_vis =
  { journal : bool
  ; orphan_pages : bool
  ; builtin_pages : bool
  ; excluded_pages : bool
  ; hidden_page_ids : IntSet.t
  ; excluded_page_ids : IntSet.t
  ; linked_page_ids : IntSet.t
  }

let all_pages_visible_page (v : all_pages_vis) (page : entity)
    (tag_idents : string list) : bool =
  graph_visible_entity page
  && not (property_page tag_idents)
  && (v.journal || not (List.mem "logseq.class/Journal" tag_idents))
  && (v.excluded_pages || not (excluded_from_graph page))
  && (v.builtin_pages
      ||
      match Ldb.string_value page "block/name" with
      | Some n -> not (List.mem (String.lowercase_ascii n) built_in_pages_lower)
      | None -> true)
  && (v.orphan_pages || IntSet.mem page.id v.linked_page_ids)

let all_pages_visible_page_id (v : all_pages_vis) (page_id : entity_id)
    (page_name : string) (tag_idents : string list) : bool =
  (not (IntSet.mem page_id v.hidden_page_ids))
  && not (property_page tag_idents)
  && (v.journal || not (List.mem "logseq.class/Journal" tag_idents))
  && (v.excluded_pages || not (IntSet.mem page_id v.excluded_page_ids))
  && (v.builtin_pages
      || not (List.mem (String.lowercase_ascii page_name) built_in_pages_lower))
  && (v.orphan_pages || IntSet.mem page_id v.linked_page_ids)

(* ---------- normalize ---------- *)

let str_ends_with (s : string) (suffix : string) : bool =
  let n = String.length s and m = String.length suffix in
  n >= m && String.sub s (n - m) m = suffix

let uuid_or_asset (label : string) : bool =
  Ldb.is_uuid_string label
  || Ns_util.str_starts_with label "../assets/"
  || label = ".."
  || Ns_util.str_starts_with label "assets/"
  || str_ends_with label ".gif"
  || str_ends_with label ".jpg"
  || str_ends_with label ".png"

let node_label = function
  | Wire.Map kvs -> (
      match Wire.get "label" (Wire.Map kvs) with
      | Some (Wire.String s) -> Some s
      | _ -> None)
  | _ -> None

let node_id_str = function
  | Wire.Map kvs -> (
      match Wire.get "id" (Wire.Map kvs) with
      | Some (Wire.String s) -> Some s
      | _ -> None)
  | _ -> None

(* normalize-page-name: drop uuid/asset-labeled nodes, dedupe by :id,
   drop links to missing nodes *)
let normalize_page_name (nodes : Wire.t list) (links : Wire.t list) :
    Wire.t =
  let nodes' =
    List.filter
      (fun n -> match node_label n with Some l -> not (uuid_or_asset l) | None -> true)
      nodes
  in
  let seen = Hashtbl.create 64 in
  let nodes' =
    List.filter
      (fun n ->
        match node_id_str n with
        | Some id when Hashtbl.mem seen id -> false
        | Some id -> Hashtbl.replace seen id (); true
        | None -> false)
      nodes'
  in
  let links' =
    List.filter
      (fun l ->
        match l with
        | Wire.Map kvs -> (
            match
              Wire.get "source" (Wire.Map kvs), Wire.get "target" (Wire.Map kvs)
            with
            | Some (Wire.String s), Some (Wire.String t) ->
                Hashtbl.mem seen s && Hashtbl.mem seen t
            | _ -> false)
        | _ -> false)
      links
  in
  Wire.Map
    [ (kw "nodes", Wire.Array nodes'); (kw "links", Wire.Array links') ]

(* ---------- large all-pages graph ---------- *)

let build_large_all_pages_graph (db : db) ~(dark : bool) ~(journal : bool)
    ~(orphan_pages : bool) ~(builtin_pages : bool) ~(excluded_pages : bool)
    (name_datoms : datom list) : Wire.t =
  let page_ids =
    List.fold_left (fun s (d : datom) -> IntSet.add d.e s) IntSet.empty name_datoms
  in
  let tagged = page_tag_links (tagged_page_links db) page_ids in
  let tag_id_ident =
    tag_ident_by_id db
      (List.fold_left (fun s (_, t) -> IntSet.add t s) IntSet.empty tagged)
  in
  let page_id_tag_idents =
    List.fold_left
      (fun m (pid, tid) ->
        match IntMap.find_opt tid tag_id_ident with
        | Some ident -> (
            let cur =
              match IntMap.find_opt pid m with
              | Some l -> l
              | None -> []
            in
imadd m pid (ident :: cur))
        | None -> m)
      IntMap.empty tagged
  in
  let title_by_id = entity_title_map db (IntSet.elements page_ids) in
  let icon_by_id = entity_value_map db "logseq.property/icon" page_ids in
  let uuid_by_id = uuid_map_of_value_map (entity_value_map_by_id db "block/uuid" page_ids) in
  let ident_by_id =
    string_map_of_value_map (entity_value_map_by_id db "db/ident" page_ids)
  in
  let created_at_by_id = entity_value_map db "block/created-at" page_ids in
  let base_visible =
    IntSet.filter
      (fun page_id ->
        match Ldb.ent_of_id db page_id with
        | Some page ->
            let tag_idents =
              Option.value (IntMap.find_opt page_id page_id_tag_idents)
                ~default:[]
            in
            all_pages_visible_page
              { journal
              ; orphan_pages = true
              ; builtin_pages
              ; excluded_pages
              ; hidden_page_ids = IntSet.empty
              ; excluded_page_ids = IntSet.empty
              ; linked_page_ids = IntSet.singleton page_id
              }
              page tag_idents
        | None -> false)
      page_ids
  in
  let raw_links, linked_page_ids =
    bounded_visible_page_links db base_visible tagged
  in
  let property_link_tuples =
    property_ref_link_tuples db base_visible ~source_mode:`Page
      ~target_mode:`Page
  in
  let parent_link_tuples = page_parent_links db base_visible in
  let extends_link_tuples =
    all_pages_class_extends_links db base_visible ident_by_id
  in
  let raw_links =
    List.sort_uniq compare
      (raw_links @ property_link_tuples @ parent_link_tuples @ extends_link_tuples)
    |> (fun l -> if List.length l > large_all_pages_link_limit then
                  List.filteri (fun i _ -> i < large_all_pages_link_limit) l
                 else l)
  in
  let linked_page_ids =
    IntSet.union linked_page_ids
      (link_node_ids
         (property_link_tuples @ parent_link_tuples @ extends_link_tuples))
  in
  let visible_page_ids =
    if orphan_pages then base_visible
    else IntSet.inter base_visible linked_page_ids
  in
  let nodes =
    List.filter_map
      (fun (d : datom) ->
        let page_id = d.e in
        let page_name =
          match d.v with String s -> s | _ -> ""
        in
        let tag_idents =
          Option.value (IntMap.find_opt page_id page_id_tag_idents) ~default:[]
        in
        match Ldb.ent_of_id db page_id with
        | Some page
          when IntSet.mem page_id visible_page_ids
               && all_pages_visible_page
                    { journal
                    ; orphan_pages = true
                    ; builtin_pages
                    ; excluded_pages
                    ; hidden_page_ids = IntSet.empty
                    ; excluded_page_ids = IntSet.empty
                    ; linked_page_ids = visible_page_ids
                    }
                    page tag_idents ->
            let page_title =
              match IntMap.find_opt page_id title_by_id with
              | Some t -> t
              | None -> page_name
            in
            let color = if dark then "#93a1a1" else "#999" in
            let uuid = IntMap.find_opt page_id uuid_by_id in
            Some
              (Wire.Map
                 ( [ (kw "id", Wire.String (string_of_int page_id))
                   ; (kw "db-id", Wire.Int page_id)
                   ; (kw "uuid",
                       (match uuid with Some u -> Wire.String u | None -> Wire.Nil))
                   ; (kw "page?", Wire.Bool true)
                   ; (kw "label", Wire.String page_title)
                   ; (kw "kind", Wire.String (page_kind tag_idents))
                   ; (kw "size", Wire.Int 8)
                   ; (kw "color", Wire.String color) ]
                 @ (match IntMap.find_opt page_id created_at_by_id with
                    | Some v ->
                        [ (kw "block/created-at", Ds_wire.transit_of_value v) ]
                    | None -> [])
                 @
                 match IntMap.find_opt page_id icon_by_id with
                 | Some v -> [ (kw "icon", Ds_wire.transit_of_value v) ]
                 | None -> [] ))
        | _ -> None)
      name_datoms
  in
  let links = build_links raw_links in
  let norm = normalize_page_name nodes links in
  (match norm with
   | Wire.Map kvs ->
       Wire.Map
         (kvs
          @ [ ( kw "all-pages"
              , Wire.Map
                  [ (kw "created-at-min", Wire.Int 0)
                  ; (kw "created-at-max", Wire.Int 0) ] ) ])
   | w -> w)

(* ---------- all-pages graph ---------- *)

let build_all_pages_node ~(dark : bool) ~(page_links : int IntMap.t)
    ~(title_by_id : string IntMap.t) ~(uuid_by_id : string IntMap.t)
    ~(icon_by_id : value IntMap.t) ~(created_at_by_id : value IntMap.t)
    ~(page_id_tag_idents : string list IntMap.t) (page_id : entity_id)
    (page_name : string) : Wire.t option =
  let page_title =
    match IntMap.find_opt page_id title_by_id with
    | Some t -> t
    | None -> page_name
  in
  let created_at = IntMap.find_opt page_id created_at_by_id in
  let tag_idents =
    Option.value (IntMap.find_opt page_id page_id_tag_idents) ~default:[]
  in
  let kind = page_kind tag_idents in
  let color = page_graph_node_color ~dark kind ~current_page:false in
  let n = Option.value (IntMap.find_opt page_id page_links) ~default:1 in
  let size =
    int_of_float (8.0 *. Float.max 1.0 (cbrt n))
  in
  let uuid = IntMap.find_opt page_id uuid_by_id in
  Some
    (Wire.Map
       ( [ (kw "id", Wire.String (string_of_int page_id))
         ; (kw "db-id", Wire.Int page_id)
         ; (kw "uuid",
             (match uuid with Some u -> Wire.String u | None -> Wire.Nil))
         ; (kw "page?", Wire.Bool true)
         ; (kw "label", Wire.String page_title)
         ; (kw "kind", Wire.String kind)
         ; (kw "size", Wire.Int size)
         ; (kw "color", Wire.String color) ]
       @ (match created_at with
          | Some v -> [ (kw "block/created-at", Ds_wire.transit_of_value v) ]
          | None -> [])
       @
       match IntMap.find_opt page_id icon_by_id with
       | Some v -> [ (kw "icon", Ds_wire.transit_of_value v) ]
       | None -> [] ))

let build_all_pages_graph (db : db) (opts : Wire.t) : Wire.t =
  let dark = dark_theme (Wire.get "theme" opts) in
  let journal = opts_bool opts "journal?" ~default:false in
  let orphan_pages = show_orphan_pages (Wire.get "orphan-pages?" opts) in
  let builtin_pages = opts_bool opts "builtin-pages?" ~default:false in
  let excluded_pages = opts_bool opts "excluded-pages?" ~default:false in
  let created_at_filter =
    match Wire.get "created-at-filter" opts with
    | Some (Wire.Int n) -> Some n
    | Some (Wire.Int64 n) -> Some (Int64.to_int n)
    | Some (Wire.Float f) -> Some (int_of_float f)
    | _ -> None
  in
  let all_name_datoms = List.of_seq (datoms db Avet ~a:"block/name" ()) in
  if
    created_at_filter = None
    && List.length all_name_datoms >= large_all_pages_fast_threshold
  then
    build_large_all_pages_graph db ~dark ~journal ~orphan_pages ~builtin_pages
      ~excluded_pages all_name_datoms
  else begin
    let name_page_ids =
      List.fold_left (fun s (d : datom) -> IntSet.add d.e s) IntSet.empty
        all_name_datoms
    in
    let hidden_name_page_ids =
      IntSet.union
        (entity_ids_with_v db "logseq.property/hide?" (Bool true))
        (entity_ids_with db "logseq.property/deleted-at")
    in
    let ident_by_name_page_id =
      string_map_of_value_map
        (entity_value_map_by_id db "db/ident" name_page_ids)
    in
    let name_datoms =
      List.filter
        (fun (d : datom) ->
          (not (IntSet.mem d.e hidden_name_page_ids))
          &&
          match IntMap.find_opt d.e ident_by_name_page_id with
          | Some ident -> not (List.mem ident Db_class.internal_tags)
          | None -> true)
        all_name_datoms
    in
    let page_id_set =
      List.fold_left (fun s (d : datom) -> IntSet.add d.e s) IntSet.empty
        name_datoms
    in
    let title_by_id = entity_title_map db (IntSet.elements page_id_set) in
    let uuid_by_id =
      uuid_map_of_value_map (entity_value_map_by_id db "block/uuid" page_id_set)
    in
    let icon_by_id = entity_value_map db "logseq.property/icon" page_id_set in
    let created_at_by_id = entity_value_map db "block/created-at" page_id_set in
    let tagged = page_tag_links (tagged_page_links db) page_id_set in
    let rendered_tagged = rendered_page_tag_links tagged page_id_set in
    let property_link_tuples =
      property_ref_link_tuples db page_id_set ~source_mode:`Page ~target_mode:`Page
    in
    let parent_link_tuples = page_parent_links db page_id_set in
    let extends_link_tuples =
      all_pages_class_extends_links db page_id_set ident_by_name_page_id
    in
    let tag_id_ident =
      tag_ident_by_id db
        (List.fold_left (fun s (_, t) -> IntSet.add t s) IntSet.empty tagged)
    in
    let page_id_tag_idents =
      List.fold_left
        (fun m (pid, tid) ->
          match IntMap.find_opt tid tag_id_ident with
          | Some ident -> (
              let cur =
                match IntMap.find_opt pid m with
                | Some l -> l
                | None -> []
              in
imadd m pid (ident :: cur))
          | None -> m)
        IntMap.empty tagged
    in
    let relation =
      page_relation_links db ~with_journal:journal page_id_tag_idents
    in
    let links0 =
      relation
      @ List.map (fun (f, t) -> link f t ()) rendered_tagged
      @ property_link_tuples @ parent_link_tuples @ extends_link_tuples
    in
    let linked = link_node_ids links0 in
    let excluded_page_ids =
      entity_ids_with_v db "logseq.property/exclude-from-graph-view" (Bool true)
    in
    let vis =
      { journal
      ; orphan_pages
      ; builtin_pages
      ; excluded_pages
      ; hidden_page_ids = hidden_name_page_ids
      ; excluded_page_ids
      ; linked_page_ids = linked
      }
    in
    (* page-links: count by string id *)
    let str_links =
      List.filter_map
        (fun l ->
          match l.from_id, l.to_id with
          | Some f, Some t -> Some (string_of_int f, string_of_int t, l.label)
          | _ -> None)
        links0
    in
    let page_links =
      List.fold_left
        (fun m (a, b, _) ->
          let add k m =
            let n =
              match IntMap.find_opt k m with
              | Some n -> n + 1
              | None -> 1
            in
imadd m k n
          in
          (* keys are string ids — parse back to int *)
          let to_id s = try int_of_string s with _ -> 0 in
          add (to_id a) m |> add (to_id b))
        IntMap.empty str_links
    in
    let links = build_links links0 in
    let created_ats =
      IntMap.fold
        (fun _ v acc ->
          match v with
          | Int n | Ref n -> n :: acc
          | Float f -> int_of_float f :: acc
          | _ -> acc)
        created_at_by_id []
    in
    let created_at_min =
      match created_ats with [] -> 0 | xs -> List.fold_left min max_int xs
    and created_at_max =
      match created_ats with [] -> 0 | xs -> List.fold_left max min_int xs
    in
    let created_at_cutoff =
      Option.map (fun f -> created_at_min + f) created_at_filter
    in
    let nodes =
      List.filter_map
        (fun (d : datom) ->
          let page_id = d.e in
          let page_name = match d.v with String s -> s | _ -> "" in
          let created_at_v = IntMap.find_opt page_id created_at_by_id in
          let created_at_int =
            match created_at_v with
            | Some (Int n | Ref n) -> Some n
            | Some (Float f) -> Some (int_of_float f)
            | _ -> None
          in
          let tag_idents =
            Option.value (IntMap.find_opt page_id page_id_tag_idents)
              ~default:[]
          in
          let too_new =
            match created_at_cutoff, created_at_int with
            | Some cutoff, Some c -> c > cutoff
            | _ -> false
          in
          if too_new
             || not (all_pages_visible_page_id vis page_id page_name tag_idents)
          then None
          else
            build_all_pages_node ~dark ~page_links ~title_by_id ~uuid_by_id
              ~icon_by_id ~created_at_by_id ~page_id_tag_idents page_id
              page_name)
        name_datoms
    in
    let norm = normalize_page_name nodes links in
    match norm with
    | Wire.Map kvs ->
        Wire.Map
          (kvs
           @ [ ( kw "all-pages"
               , Wire.Map
                   [ (kw "created-at-min", Wire.Int created_at_min)
                   ; (kw "created-at-max", Wire.Int created_at_max) ] ) ])
    | w -> w
  end

(* ---------- global graph ---------- *)

let build_global_graph (db : db) (opts : Wire.t) : Wire.t =
  let view_mode =
    normalize_view_mode
      (match Wire.get "view-mode" opts with
       | Some (Wire.Keyword s | Wire.String s) -> s
       | _ -> "")
  in
  let result =
    match view_mode with
    | "all-pages" -> build_all_pages_graph db opts
    | _ -> build_tags_and_objects_graph db
  in
  match result with
  | Wire.Map kvs ->
      Wire.Map
        (kvs
         @ [ (kw "meta", Wire.Map [ (kw "view-mode", kw view_mode) ]) ])
  | w -> w

(* ---------- page graph ---------- *)

let page_alias_set db (page_id : entity_id) : IntSet.t =
  IntSet.add page_id
    (List.fold_left (fun s id -> IntSet.add id s) IntSet.empty
       (Db_view.get_block_alias_ids db page_id))

let get_pages_that_mentioned_page (db : db) (page_id : entity_id)
    (include_journals : bool) : entity_id list =
  let pages = page_alias_set db page_id in
  let mentioned =
    IntSet.fold
      (fun id acc ->
        match Ldb.ent_of_id db id with
        | Some page ->
            List.filter_map
              (fun ref_ ->
                if Ldb.is_page ref_ then Some page
                else Ldb.ref_ent ref_ "block/page")
              (Ldb.ref_ents page "block/_refs")
            @ acc
        | None -> acc)
      pages []
  in
  let seen = Hashtbl.create 16 in
  List.filter_map
    (fun (page : entity) ->
      if Hashtbl.mem seen page.id then None
      else begin
        Hashtbl.replace seen page.id ();
        if (not include_journals) && Ldb.is_journal page then None
        else Some page.id
      end)
    mentioned

let get_page_referenced_pages (db : db) (page_id : entity_id)
    : entity_id list =
  let pages = IntSet.elements (page_alias_set db page_id) in
  let rows =
    Datascript.q_string db
      "[:find [?ref-page ...]
        :in $ [?pages ...]
        :where
        [?block :block/page ?pages]
        [?block :block/refs ?ref-page]]"
      ~inputs:[ Arg_collection (List.map (fun id -> Result_entity id) pages) ]
  in
  List.filter_map
    (fun r ->
      match r with
      | Result_entity id -> Some id
      | _ -> None)
    (List.concat rows)

let build_page_graph_other_page_links (db : db) (other_pages : entity_id list)
    (show_journal : bool) : link_raw list =
  let other_set =
    List.fold_left (fun s id -> IntSet.add id s) IntSet.empty other_pages
  in
  List.concat_map
    (fun page_id ->
      let ref_pages =
        get_page_referenced_pages db page_id
        |> List.filter (fun id -> IntSet.mem id other_set)
      and mentioned =
        get_pages_that_mentioned_page db page_id show_journal
        |> List.filter (fun id -> IntSet.mem id other_set)
      in
      List.map (fun p -> link page_id p ()) ref_pages
      @ List.map (fun p -> link p page_id ()) mentioned)
    other_pages

let build_page_graph (db : db) (page_uuid : string) (theme : Wire.t option)
    (show_journal : bool) : Wire.t =
  match entity db (Lookup_ref ("block/uuid", Uuid page_uuid)) with
  | None -> Wire.Nil
  | Some page_entity ->
      let dark = dark_theme theme in
      let page_id = page_entity.id in
      let tags =
        Ldb.ref_ents page_entity "block/tags"
        |> List.map (fun (t : entity) -> t.id)
        |> List.filter (fun id -> id <> page_id)
      in
      let ref_pages = get_page_referenced_pages db page_id in
      let mentioned = get_pages_that_mentioned_page db page_id show_journal in
      let extends_links = visible_page_class_extends_links db page_id in
      let extends_page_ids = link_node_ids extends_links in
      let links0 =
        List.map (fun p -> link page_id p ()) ref_pages
        @ List.map (fun p -> link page_id p ()) mentioned
        @ List.map (fun t -> link page_id t ()) tags
        @ extends_links
      in
      let other_links =
        build_page_graph_other_page_links db (ref_pages @ mentioned) show_journal
      in
      let links =
        build_links
          (List.sort_uniq compare (links0 @ other_links))
      in
      let node_ids =
        List.sort_uniq compare
          ( page_id :: ref_pages @ mentioned @ tags
          @ IntSet.elements extends_page_ids )
      in
      let nodes =
        List.filter_map (fun id -> Ldb.ent_of_id db id) node_ids
      in
      let current_page_title =
        Option.value (Ldb.string_value page_entity "block/title") ~default:""
      in
      let built = build_nodes ~dark ~current_page:current_page_title None nodes in
      let built =
        List.map
          (fun n ->
            match n with
            | Wire.Map kvs -> (
                match Wire.get "db-id" (Wire.Map kvs) with
                | Some (Wire.Int id) when id = page_id ->
                    Wire.Map (kvs @ [ (kw "root?", Wire.Bool true) ])
                | _ -> n)
            | _ -> n)
          built
      in
      normalize_page_name built links

let build_block_graph (db : db) (block_uuid : string) (theme : Wire.t option)
    : Wire.t =
  match entity db (Lookup_ref ("block/uuid", Uuid block_uuid)) with
  | None -> Wire.Nil
  | Some block ->
      let dark = dark_theme theme in
      let ref_blocks =
        Ldb.ref_ents block "block/_refs" @ Ldb.ref_ents block "block/refs"
        |> List.map (fun (b : entity) ->
             if Ldb.is_page b then b
             else
               match Ldb.ref_ent b "block/page" with
               | Some p -> p
               | None -> b)
        |> List.filter (fun (n : entity) -> n.id <> block.id)
      in
      let seen = Hashtbl.create 16 in
      let ref_blocks =
        List.filter
          (fun (b : entity) ->
            if Hashtbl.mem seen b.id then false
            else begin
              Hashtbl.replace seen b.id ();
              true
            end)
          ref_blocks
      in
      let links =
        build_links
          (List.map (fun (p : entity) -> link block.id p.id ()) ref_blocks
           |> List.sort_uniq compare)
      in
      let nodes =
        List.sort_uniq (fun (a : entity) (b : entity) -> compare a.id b.id)
          (block :: ref_blocks)
      in
      let current_title =
        match entity_display_title block with
        | Some t -> t
        | None -> ""
      in
      let built = build_nodes ~dark ~current_page:current_title None nodes in
      normalize_page_name built links

(* ---------- entry ---------- *)

let build_graph (db : db) (opts : Wire.t) : Wire.t =
  let opt_str k =
    match Wire.get k opts with
    | Some (Wire.String s | Wire.Keyword s) -> Some s
    | _ -> None
  in
  match opt_str "type" with
  | Some "global" -> build_global_graph db opts
  | Some "block" -> (
      match Wire.get "block/uuid" opts with
      | Some (Wire.Uuid u) -> build_block_graph db u (Wire.get "theme" opts)
      | _ -> Wire.Nil)
  | Some "page" -> (
      match Wire.get "block/uuid" opts with
      | Some (Wire.Uuid u) ->
          build_page_graph db u (Wire.get "theme" opts)
            (opts_bool opts "show-journal?" ~default:false)
      | _ -> Wire.Nil)
  | _ -> Wire.Nil
