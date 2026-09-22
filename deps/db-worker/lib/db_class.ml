(* Faithful ports of logseq.db.frontend.class and the class helpers in
   logseq.db.frontend.db used by the property/class endpoints. *)

open Datascript

(* ---------- tag ident sets (logseq.db.frontend.class) ---------- *)

(* db-class/internal-tags *)
let internal_tags =
  [ "logseq.class/Page"; "logseq.class/Property"; "logseq.class/Tag";
    "logseq.class/Root"; "logseq.class/Asset" ]

(* db-class/private-tags = (internal-tags - Root) u
   {Journal, Whiteboard, Pdf-annotation} *)
let private_tags =
  [ "logseq.class/Page"; "logseq.class/Property"; "logseq.class/Tag";
    "logseq.class/Asset"; "logseq.class/Journal";
    "logseq.class/Whiteboard"; "logseq.class/Pdf-annotation" ]

(* db-class/block-kind-tags *)
let block_kind_tags =
  [ "logseq.class/Cards"; "logseq.class/Code-block";
    "logseq.class/Math-block"; "logseq.class/Quote-block";
    "logseq.class/Query"; "logseq.class/Pdf-annotation";
    "logseq.class/Template" ]

(* db-class/extends-hidden-tags = private-tags u block-kind-tags *)
let extends_hidden_tags = private_tags @ block_kind_tags

(* db-class/hidden-tags *)
let hidden_tags = [ "logseq.class/Page"; "logseq.class/Root"; "logseq.class/Asset" ]

(* db-class/built-in-classes — data needed by helpers: per class ident the
   top-level :properties map keys, [:schema :properties] list and
   [:schema :required-properties] list (cljs class.cljs 16-99). *)
type built_in_class =
  { ident : string
  ; title : string
  ; properties : (string * value) list (* cljs :properties map *)
  ; schema_properties : string list (* cljs [:schema :properties] *)
  ; schema_required_properties : string list
  }

let icon id =
  Map [ Keyword "type", Keyword "tabler-icon"; Keyword "id", String id ]

let built_in_classes =
  [ { ident = "logseq.class/Root"; title = "Root Tag"; properties = [];
      schema_properties = []; schema_required_properties = [] }
  ; { ident = "logseq.class/Tag"; title = "Tag"; properties = [];
      schema_properties = []; schema_required_properties = [] }
  ; { ident = "logseq.class/Property"; title = "Property"; properties = [];
      schema_properties = []; schema_required_properties = [] }
  ; { ident = "logseq.class/Page"; title = "Page"; properties = [];
      schema_properties = []; schema_required_properties = [] }
  ; { ident = "logseq.class/Journal"; title = "Journal";
      properties =
        [ "logseq.property.class/extends", Keyword "logseq.class/Page"
        ; "logseq.property.journal/title-format", String "MMM do, yyyy" ];
      schema_properties = []; schema_required_properties = [] }
  ; { ident = "logseq.class/Whiteboard"; title = "Whiteboard";
      properties =
        [ "logseq.property.class/extends", Keyword "logseq.class/Page" ];
      schema_properties = []; schema_required_properties = [] }
  ; { ident = "logseq.class/Task"; title = "Task"; properties = [];
      schema_properties =
        [ "logseq.property/status"; "logseq.property/priority";
          "logseq.property/deadline"; "logseq.property/scheduled" ];
      schema_required_properties = [] }
  ; { ident = "logseq.class/Comments"; title = "Comments";
      properties =
        [ "logseq.property.class/hide-from-node", Bool true
        ; "logseq.property/icon", icon "message-circle" ];
      schema_properties = [ "logseq.property.comments/blocks" ];
      schema_required_properties = [] }
  ; { ident = "logseq.class/Comment"; title = "Comment";
      properties = [ "logseq.property.class/hide-from-node", Bool true ];
      schema_properties = []; schema_required_properties = [] }
  ; { ident = "logseq.class/Query"; title = "Query";
      properties = [ "logseq.property/icon", icon "search" ];
      schema_properties = [ "logseq.property/query" ];
      schema_required_properties = [] }
  ; { ident = "logseq.class/Card"; title = "Card"; properties = [];
      schema_properties = [ "logseq.property.fsrs/state"; "logseq.property.fsrs/due" ];
      schema_required_properties = [] }
  ; { ident = "logseq.class/Cards"; title = "Cards";
      properties =
        [ "logseq.property/icon", icon "search"
        ; "logseq.property.class/extends", Keyword "logseq.class/Query" ];
      schema_properties = []; schema_required_properties = [] }
  ; { ident = "logseq.class/Asset"; title = "Asset";
      properties =
        [ "logseq.property.class/hide-from-node", Bool true
        ; "logseq.property.view/type", Keyword "logseq.property.view/type.gallery" ];
      schema_properties =
        [ "logseq.property.asset/type"; "logseq.property.asset/size";
          "logseq.property.asset/checksum" ];
      schema_required_properties =
        [ "logseq.property.asset/type"; "logseq.property.asset/size";
          "logseq.property.asset/checksum" ] }
  ; { ident = "logseq.class/Code-block"; title = "Code";
      properties = [ "logseq.property.class/hide-from-node", Bool true ];
      schema_properties =
        [ "logseq.property.node/display-type"; "logseq.property.code/lang" ];
      schema_required_properties = [] }
  ; { ident = "logseq.class/Quote-block"; title = "Quote";
      properties = [ "logseq.property.class/hide-from-node", Bool true ];
      schema_properties = [ "logseq.property.node/display-type" ];
      schema_required_properties = [] }
  ; { ident = "logseq.class/Math-block"; title = "Math";
      properties = [ "logseq.property.class/hide-from-node", Bool true ];
      schema_properties = [ "logseq.property.node/display-type" ];
      schema_required_properties = [] }
  ; { ident = "logseq.class/Pdf-annotation"; title = "PDF Annotation";
      properties = [ "logseq.property.class/hide-from-node", Bool true ];
      schema_properties =
        [ "logseq.property/ls-type"; "logseq.property.pdf/hl-color";
          "logseq.property/asset"; "logseq.property.pdf/hl-page";
          "logseq.property.pdf/hl-value"; "logseq.property.pdf/hl-type";
          "logseq.property.pdf/hl-image" ];
      schema_required_properties =
        [ "logseq.property/ls-type"; "logseq.property.pdf/hl-color";
          "logseq.property/asset"; "logseq.property.pdf/hl-page";
          "logseq.property.pdf/hl-value" ] }
  ; { ident = "logseq.class/Template"; title = "Template"; properties = [];
      schema_properties = [ "logseq.property.template-applied-to" ];
      schema_required_properties = [] }
  ]

let built_in_class (ident : string) : built_in_class option =
  List.find_opt (fun c -> c.ident = ident) built_in_classes

(* db-class/page-children-classes *)
let page_children_classes =
  List.filter_map
    (fun c ->
       match List.assoc_opt "logseq.property.class/extends" c.properties with
       | Some (Keyword "logseq.class/Page") -> Some c.ident
       | _ -> None)
    built_in_classes

(* db-class/page-classes *)
let page_classes =
  "logseq.class/Page" :: "logseq.class/Tag" :: "logseq.class/Property"
  :: page_children_classes

(* db-class/disallowed-inline-tags = page-classes u private-tags u
   block-kind-tags *)
let disallowed_inline_tags = page_classes @ private_tags @ block_kind_tags

(* db-class/private-tag-titles — titles of private-tags minus Page *)
let private_tag_titles =
  List.filter_map
    (fun c ->
       if List.mem c.ident private_tags && c.ident <> "logseq.class/Page"
       then Some c.title
       else None)
    built_in_classes

(* db-class/private-create-page-tag? — tag is an entity or ident option pair;
   callers pass the resolved ident (or None) plus the title. *)
let private_create_page_tag ?(ident : string option) ~(title : string option) () : bool =
  (match ident with
   | Some i -> List.mem i private_tags && i <> "logseq.class/Page"
   | None -> false)
  || (ident = None
      && (match title with Some t -> List.mem t private_tag_titles | None -> false))

(* outliner-property/built-in-class-property->properties — set of
   (class-or-property-ident, property-ident) pairs: each built-in class's
   top-level :properties keys + :block/tags, plus the same for each built-in
   property. The property-side pairs come from Db_builtin (kept in
   outliner_property to avoid a cyclic dep; see there). *)
let built_in_class_property_pairs : (string * string) list =
  List.concat_map
    (fun c ->
      List.map (fun p -> (c.ident, p))
        ("block/tags" :: List.map fst c.properties))
    built_in_classes

(* logseq.db.frontend.db/built-in-class-property? *)
let built_in_class_property (class_ : entity) (property : entity) : bool =
  Ldb.built_in class_ && Ldb.is_class class_ && Ldb.built_in property
  &&
  (match (Ldb.ident_of class_, Ldb.ident_of property) with
   | Some ci, Some pi ->
       (match built_in_class ci with
        | Some c -> List.mem pi c.schema_properties
        | None -> false)
   | _ -> false)

(* db-class/get-structured-children — BFS over
   :logseq.property.class/extends, equivalent to the recursive
   (class-extends ?p ?c) rule. Verified engine limitation
   (datascript-ocaml @ 8db9e3c): bound :in args — even literal head
   args — are dropped inside recursive rule calls, so the faithful
   query returns children of every class, not just ?p's. *)
let get_structured_children db (eid : entity_id) : entity_id list =
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

(* db-class/get-class-extends — breadth-first walk of
   :logseq.property.class/extends, reverse of the deduped result. *)
let get_class_extends (class_ : entity) : entity list =
  let rec loop extends result =
    match extends with
    | [] -> result
    | _ ->
        let next =
          List.concat_map
            (fun (e : entity) -> Ldb.ref_ents e "logseq.property.class/extends")
            extends
        in
        loop next (result @ extends)
  in
  let result = loop (Ldb.ref_ents class_ "logseq.property.class/extends") [] in
  (* cljs (reverse (distinct result)) — distinct keeps first occurrence. *)
  let seen = Hashtbl.create 7 in
  List.rev
    (List.filter
       (fun (e : entity) ->
          if Hashtbl.mem seen e.id then false
          else begin
            Hashtbl.replace seen e.id ();
            true
          end)
       result)

(* logseq.db.frontend.db/get-classes-parents *)
let get_classes_parents (tags : entity list) : entity list =
  let seen = Hashtbl.create 7 in
  List.filter Ldb.is_class tags
  |> List.concat_map get_class_extends
  |> List.filter (fun (e : entity) ->
         if Hashtbl.mem seen e.id then false
         else begin
           Hashtbl.replace seen e.id ();
           true
         end)

(* ---------- class objects ---------- *)

(* db-class/eids-with-attr *)
let eids_with_attr db (a : attr) : entity_id list =
  List.map (fun (d : datom) -> d.e)
    (List.of_seq (datoms db Avet ~a ()))

(* db-class/eids-with-attr-value *)
let eids_with_attr_value db (a : attr) (v : value) : entity_id list =
  List.map (fun (d : datom) -> d.e)
    (List.of_seq (datoms db Avet ~a ~v ()))

(* db-class/parent-eid *)
let parent_eid db (eid : entity_id) : entity_id option =
  match
    Seq.uncons (datoms db Eavt ~e:eid ~a:"block/parent" ())
  with
  | Some (d, _) -> (match d.v with Ref id -> Some id | _ -> None)
  | None -> None

(* db-class/hidden-by-ancestor? *)
let hidden_by_ancestor db (eid : entity_id) ~hide_eids ~deleted_eids : bool =
  let rec loop id seen =
    match id with
    | None -> false
    | Some id when List.mem id seen -> false
    | Some id ->
        if List.mem id hide_eids || List.mem id deleted_eids then true
        else loop (parent_eid db id) (id :: seen)
  in
  loop (Some eid) []

(* db-class/eid-has-true-attr? *)
let eid_has_true_attr db (eid : entity_id) (a : attr) : bool =
  Seq.exists
    (fun (d : datom) -> d.v = Bool true)
    (datoms db Eavt ~e:eid ~a ())

(* db-class/ident-eid *)
let ident_eid db (ident : attr) : entity_id option =
  match
    Seq.uncons (datoms db Avet ~a:"db/ident" ~v:(Keyword ident) ())
  with
  | Some (d, _) -> Some d.e
  | None -> None

(* db-class/class-object-hidden-index (no WeakMap cache — recomputed per
   call like the cljs cache miss path) *)
type class_object_hidden_index =
  { property_eids : entity_id list
  ; hide_eids : entity_id list
  ; deleted_eids : entity_id list
  ; built_in_eids : entity_id list
  }

let class_object_hidden_index db : class_object_hidden_index =
  let property_eids =
    match ident_eid db "logseq.class/Property" with
    | Some tag_id -> eids_with_attr_value db "block/tags" (Ref tag_id)
    | None -> []
  in
  { property_eids
  ; hide_eids = eids_with_attr_value db "logseq.property/hide?" (Bool true)
  ; deleted_eids = eids_with_attr db "logseq.property/deleted-at"
  ; built_in_eids = eids_with_attr_value db "logseq.property/built-in?" (Bool true)
  }

(* db-class/hidden-class-object-eid? *)
let hidden_class_object_eid db (eid : entity_id) (idx : class_object_hidden_index) : bool =
  if List.mem eid idx.property_eids then
    List.mem eid idx.deleted_eids
    || (List.mem eid idx.built_in_eids
        && not (eid_has_true_attr db eid "logseq.property/public?"))
  else
    (idx.hide_eids <> [] || idx.deleted_eids <> [])
    && hidden_by_ancestor db eid ~hide_eids:idx.hide_eids
         ~deleted_eids:idx.deleted_eids

(* db-class/filter-visible-class-object-ids *)
let filter_visible_class_object_ids db (eids : entity_id list) : entity_id list =
  let idx = class_object_hidden_index db in
  let seen = Hashtbl.create 31 in
  List.filter
    (fun eid ->
       if Hashtbl.mem seen eid then false
       else begin
         Hashtbl.replace seen eid ();
         not (hidden_class_object_eid db eid idx)
       end)
    eids

(* db-class/class-object-eids *)
let class_object_eids db (class_id : entity_id) : entity_id list =
  let class_children = get_structured_children db class_id in
  let seen = Hashtbl.create 7 in
  let class_ids =
    List.filter
      (fun id ->
         if Hashtbl.mem seen id then false
         else begin
           Hashtbl.replace seen id ();
           true
         end)
      (class_id :: class_children)
  in
  List.concat_map
    (fun id ->
       List.map (fun (d : datom) -> d.e)
         (List.of_seq (datoms db Avet ~a:"block/tags" ~v:(Ref id) ())))
    class_ids
  |> filter_visible_class_object_ids db

(* db-class/get-class-object-ids *)
let get_class_object_ids db (class_id : entity_id) : entity_id list =
  class_object_eids db class_id

(* db-class/get-class-objects *)
let get_class_objects db (class_id : entity_id) : entity list =
  List.filter_map (Ldb.ent_of_id db) (class_object_eids db class_id)

(* rules/has-property-or-object-property? as a direct datom scan —
   verified engine limitations (datascript-ocaml @ 8db9e3c): the
   faithful rules query binds ?prop in attribute position
   ([?b ?prop _]) and calls the recursive class-extends rule from an
   or-branch, neither of which the engine evaluates correctly.
   A block is a property object of ?prop when it has the attr itself,
   or when it is tagged with a class (or a class extending it, per
   class-extends) that declares ?prop in
   :logseq.property.class/properties. *)
let property_object_eids db (prop_ident : string) : entity_id list =
  (* the rules query scans by attr alone, so Aevt — a user property is not
     :db/index'ed and would throw on Avet *)
  let direct =
    List.map (fun (d : datom) -> d.e)
      (List.of_seq (datoms db Aevt ~a:prop_ident ()))
  in
  let via_tags =
    match ident_eid db prop_ident with
    | Some prop_eid ->
        List.map (fun (d : datom) -> d.e)
          (List.of_seq
             (datoms db Avet ~a:"logseq.property.class/properties"
                ~v:(Ref prop_eid) ()))
        |> List.concat_map
             (fun cid -> cid :: get_structured_children db cid)
        |> List.sort_uniq compare
        |> List.concat_map
             (fun tag_id ->
                List.map (fun (d : datom) -> d.e)
                  (List.of_seq
                     (datoms db Avet ~a:"block/tags" ~v:(Ref tag_id) ())))
    | None -> []
  in
  List.sort_uniq compare (direct @ via_tags)

(* db-class/build-new-class — creates a fresh :db/ident via
   create-user-class-ident-from-name then sqlite-util/build-new-class. *)
let build_new_class db ?(ident_namespace : string option) (page_m : Wire.t)
    : Wire.t =
  let title =
    match Cljs_map.get page_m "block/title" with
    | Some (Wire.String t) -> t
    | _ -> invalid_arg "build_new_class: :block/title must be a string"
  in
  let db_ident =
    Db_ident.create_user_class_ident_from_name ~db
      ?ident_namespace title
  in
  Sqlite_util.build_new_class
    (Cljs_map.assoc page_m "db/ident" (Wire.Keyword db_ident))

(* db-class/logseq-class? — kw whose namespace is "logseq.class" *)
let logseq_class_kw (kw : string) : bool =
  match String.rindex_opt kw '/' with
  | Some i -> String.sub kw 0 i = "logseq.class"
  | None -> false

(* db-class/user-class-namespace? — namespace string contains ".class" *)
let user_class_namespace (s : string) : bool =
  Ns_util.str_contains s ".class"

(* db-db/class-instance? — object tagged with class or a child class of it.
   Lives here (not ldb.ml) to keep the module graph acyclic: ldb must not
   depend on db_class. *)
let class_instance (class_ : entity) (object_ : entity) : bool =
  let tag_ids = Ldb.ref_ids object_ "block/tags" in
  List.mem class_.id tag_ids
  || List.exists
       (fun (p : entity) -> p.id = class_.id)
       (get_classes_parents (Ldb.ref_ents object_ "block/tags"))

