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
  ; properties : string list
  ; schema_properties : string list
  ; schema_required_properties : string list
  }

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
        [ "logseq.property.class/extends"; "logseq.property.journal/title-format" ];
      schema_properties = []; schema_required_properties = [] }
  ; { ident = "logseq.class/Whiteboard"; title = "Whiteboard";
      properties = [ "logseq.property.class/extends" ];
      schema_properties = []; schema_required_properties = [] }
  ; { ident = "logseq.class/Task"; title = "Task"; properties = [];
      schema_properties =
        [ "logseq.property/status"; "logseq.property/priority";
          "logseq.property/deadline"; "logseq.property/scheduled" ];
      schema_required_properties = [] }
  ; { ident = "logseq.class/Comments"; title = "Comments";
      properties = [ "logseq.property.class/hide-from-node"; "logseq.property/icon" ];
      schema_properties = [ "logseq.property.comments/blocks" ];
      schema_required_properties = [] }
  ; { ident = "logseq.class/Comment"; title = "Comment";
      properties = [ "logseq.property.class/hide-from-node" ];
      schema_properties = []; schema_required_properties = [] }
  ; { ident = "logseq.class/Query"; title = "Query";
      properties = [ "logseq.property/icon" ];
      schema_properties = [ "logseq.property/query" ];
      schema_required_properties = [] }
  ; { ident = "logseq.class/Card"; title = "Card"; properties = [];
      schema_properties = [ "logseq.property.fsrs/state"; "logseq.property.fsrs/due" ];
      schema_required_properties = [] }
  ; { ident = "logseq.class/Cards"; title = "Cards";
      properties = [ "logseq.property/icon"; "logseq.property.class/extends" ];
      schema_properties = []; schema_required_properties = [] }
  ; { ident = "logseq.class/Asset"; title = "Asset";
      properties = [ "logseq.property.class/hide-from-node"; "logseq.property.view/type" ];
      schema_properties =
        [ "logseq.property.asset/type"; "logseq.property.asset/size";
          "logseq.property.asset/checksum" ];
      schema_required_properties =
        [ "logseq.property.asset/type"; "logseq.property.asset/size";
          "logseq.property.asset/checksum" ] }
  ; { ident = "logseq.class/Code-block"; title = "Code";
      properties = [ "logseq.property.class/hide-from-node" ];
      schema_properties =
        [ "logseq.property.node/display-type"; "logseq.property.code/lang" ];
      schema_required_properties = [] }
  ; { ident = "logseq.class/Quote-block"; title = "Quote";
      properties = [ "logseq.property.class/hide-from-node" ];
      schema_properties = [ "logseq.property.node/display-type" ];
      schema_required_properties = [] }
  ; { ident = "logseq.class/Math-block"; title = "Math";
      properties = [ "logseq.property.class/hide-from-node" ];
      schema_properties = [ "logseq.property.node/display-type" ];
      schema_required_properties = [] }
  ; { ident = "logseq.class/Pdf-annotation"; title = "PDF Annotation";
      properties = [ "logseq.property.class/hide-from-node" ];
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
      schema_properties = [ "logseq.property/template-applied-to" ];
      schema_required_properties = [] }
  ]

let built_in_class (ident : string) : built_in_class option =
  List.find_opt (fun c -> c.ident = ident) built_in_classes

(* db-class/page-children-classes *)
let page_children_classes =
  List.filter_map
    (fun c ->
       (* cljs checks (:properties m :logseq.property.class/extends) =
          :logseq.class/Page — only Journal and Whiteboard extend Page via
          top-level :properties; Cards extends Query, not Page. *)
       if c.ident = "logseq.class/Journal" || c.ident = "logseq.class/Whiteboard"
       then Some c.ident
       else None)
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
    (fun c -> List.map (fun p -> (c.ident, p)) ("block/tags" :: c.properties))
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

(* ---------- rules (logseq.db.frontend.rules/rules) ---------- *)

(* The :class-extends clause of rules/rules, passed to queries through
   the % input — same EDN text the cljs side uses. *)
let class_extends_rules_edn =
  "[[(class-extends ?p ?c) [?c :logseq.property.class/extends ?p]] \
   [(class-extends ?p ?c) [?t :logseq.property.class/extends ?p] \
   (class-extends ?t ?c)]]"

(* The :alias clause of rules/rules. *)
let alias_rules_edn =
  "[[(alias ?e2 ?e1) [?e2 :block/alias ?e1]] \
   [(alias ?e2 ?e1) [?e1 :block/alias ?e2]]]"

(* :has-property-or-object-property + its :deps
   (:object-has-class-property -> :class-extends), exactly what
   rules/extract-rules returns for
   (extract-rules db-query-dsl-rules [:has-property-or-object-property]
                  {:deps rules-dependencies}). *)
let property_objects_rules_edn =
  "[[(has-property-or-object-property? ?b ?prop) \
     [?prop-e :db/ident ?prop] \
     (or [?b ?prop _] (object-has-class-property? ?b ?prop))] \
   [(object-has-class-property? ?b ?prop) \
     [?prop-e :db/ident ?prop] \
     [?t :logseq.property.class/properties ?prop-e] \
     [?b :block/tags ?tc] \
     (or [(= ?t ?tc)] (class-extends ?t ?c))] \
   [(class-extends ?p ?c) [?c :logseq.property.class/extends ?p]] \
   [(class-extends ?p ?c) [?t :logseq.property.class/extends ?p] \
    (class-extends ?t ?c)]]"

let lazy_rules edn =
  lazy (Parser.parse_rules (Parser.read_edn edn))

let class_extends_rules = lazy_rules class_extends_rules_edn
let alias_rules = lazy_rules alias_rules_edn
let property_objects_rules = lazy_rules property_objects_rules_edn

(* db-class/get-structured-children *)
let get_structured_children db (eid : entity_id) : entity_id list =
  q_string db
    ~inputs:
      [ Arg_scalar (Result_entity eid); Arg_rules (Lazy.force class_extends_rules) ]
    "[:find [?c ...] :in $ ?p % :where (class-extends ?p ?c)]"
  |> List.filter_map (function
       | [ Result_entity id ] -> Some id
       | [ Result_value (Int id) ] -> Some id
       | _ -> None)
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
