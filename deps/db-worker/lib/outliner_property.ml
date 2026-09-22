(* Faithful ports of the fns in logseq.outliner.property that the
   property endpoints reach (get-classes-parents, get-class-properties,
   get-block-classes-properties, validate-property-value), plus the
   db-property-type/db-malli-schema helpers behind validate-property-value. *)

open Datascript

(* ---------- property/type.cljs ---------- *)

(* db-property-type/url? — approximation of (new js/URL s) parseability:
   any <scheme>:<rest> where scheme is [A-Za-z][A-Za-z0-9+.-]* parses
   successfully under the WHATWG URL spec. *)
let url (s : string) : bool =
  let is_scheme_start c =
    (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
  in
  let is_scheme_char c =
    is_scheme_start c || (c >= '0' && c <= '9')
    || c = '+' || c = '-' || c = '.'
  in
  let n = String.length s in
  n > 0 && is_scheme_start s.[0]
  && begin
       let rec go i =
         i < n && (s.[i] = ':' || (is_scheme_char s.[i] && go (i + 1)))
       in
       go 1
     end

(* common-util/macro? (db-property-type/macro-url?) *)
let macro_url (s : string) : bool =
  let t = String.trim s in
  String.length t >= 4 && String.sub t 0 2 = "{{"
  && String.sub t (String.length t - 2) 2 = "}}"

(* db-property-type/entity? *)
let entity_exists db (v : value) : bool =
  let ref_of = function
    | Ref id | Int id -> Some (Entity_id id)
    | Keyword k -> Some (Ident k)
    | Uuid u -> Some (Lookup_ref ("block/uuid", Uuid u))
    | List [ Keyword a; v ] | Vector [ Keyword a; v ] ->
        Some (Lookup_ref (a, v))
    | _ -> None
  in
  match ref_of v with
  | Some r -> Option.is_some (entity db r)
  | None -> false

(* db-property-type/class-entity? *)
let class_entity db v =
  match
    ( match v with
      | Ref id -> Ldb.ent_of_id db id
      | _ -> None )
  with
  | Some e -> Ldb.is_class e
  | None -> false

(* db-property-type/property-entity? *)
let property_entity db v =
  match
    ( match v with
      | Ref id -> Ldb.ent_of_id db id
      | _ -> None )
  with
  | Some e -> Ldb.is_property e
  | None -> false

(* db-property-type/page-entity? *)
let page_entity db v =
  match
    ( match v with
      | Ref id -> Ldb.ent_of_id db id
      | _ -> None )
  with
  | Some e -> Ldb.is_page e
  | None -> false

let entity_of_value db (v : value) : entity option =
  match v with
  | Ref id | Int id -> Ldb.ent_of_id db id
  | Keyword k -> entity db (Ident k)
  | Uuid u -> entity db (Lookup_ref ("block/uuid", Uuid u))
  | List [ Keyword a; x ] | Vector [ Keyword a; x ] ->
      entity db (Lookup_ref (a, x))
  | _ -> None

(* db-property-type/url-entity? (new-closed-value? false,
   skip-strict-url-validate? unset) *)
let url_entity db v =
  match entity_of_value db v with
  | Some ent ->
      (match Ldb.string_value ent "block/title" with
       | Some title ->
           String.trim title = "" || url title || macro_url title
       | None -> false)
  | None -> false

(* db-property-type/number-entity? (new-closed-value? false) *)
let number_entity db v =
  match entity_of_value db v with
  | Some e ->
      (match Ldb.value e "logseq.property/value" with
       | Some (Int _ | Float _) -> true
       | _ -> false)
  | None -> false

(* db-property-type/text-entity? *)
let text_entity db v =
  match entity_of_value db v with
  | Some e ->
      Option.is_some (Ldb.string_value e "block/title")
      && Option.is_some (Ldb.value e "block/page")
  | None -> false

(* db-property-type/node-entity? *)
let node_entity db v =
  match entity_of_value db v with
  | Some e -> Option.is_some (Ldb.value e "block/title")
  | None -> false

(* db-property-type/asset-entity? *)
let asset_entity db v =
  match entity_of_value db v with
  | Some e ->
      Option.is_some (Ldb.value e "block/title")
      && List.exists
           (fun (t : entity) -> Ldb.ident_of t = Some "logseq.class/Asset")
           (Ldb.ref_ents e "block/tags")
  | None -> false

(* db-property-type/date? *)
let date_pred db v =
  match entity_of_value db v with
  | Some e -> Option.is_some (Ldb.value e "block/title") && Ldb.is_journal e
  | None -> false

let value_is_string = function String _ -> true | _ -> false
let value_is_number = function Int _ | Float _ -> true | _ -> false
let value_is_bool = function Bool _ -> true | _ -> false
let value_is_keyword = function Keyword _ -> true | _ -> false
let value_is_map = function Map _ -> true | _ -> false
let value_is_coll = function List _ | Vector _ | Set _ -> true | _ -> false
let value_some = function Nil -> false | _ -> true

(* db-property-type/property-types-with-db *)
let property_type_uses_db (t : string) : bool =
  List.mem t
    [ "default"; "url"; "number"; "date"; "node"; "asset"; "entity";
      "class"; "property"; "page" ]

(* db-property-type/built-in-validation-schemas → (pred, error/message).
   When the type isn't in the map cljs throws. *)
let validate_pred (property_type : string) :
    (db -> value -> bool) option * string =
  match property_type with
  | "default" -> (Some text_entity, "should be a text block")
  | "number" -> (Some number_entity, "should be a number")
  | "date" -> (Some date_pred, "should be a journal date")
  | "datetime" -> (Some (fun _ v -> value_is_number v), "should be a datetime")
  | "checkbox" -> (Some (fun _ v -> value_is_bool v), "should be a boolean")
  | "url" -> (Some url_entity, "should be a URL")
  | "node" -> (Some node_entity, "should be a node with a title")
  | "asset" -> (Some asset_entity, "should be an asset node")
  | "string" -> (Some (fun _ v -> value_is_string v), "should be a string")
  | "json" -> (Some (fun _ v -> value_is_string v), "should be JSON string")
  | "raw-number" ->
      (Some (fun _ v -> value_is_number v), "should be a raw number")
  | "entity" -> (Some entity_exists, "should be an Entity")
  | "class" -> (Some class_entity, "should be a Class")
  | "property" -> (Some property_entity, "should be a Property")
  | "page" -> (Some page_entity, "should be a Page")
  | "keyword" -> (Some (fun _ v -> value_is_keyword v), "should be a Clojure keyword")
  | "map" -> (Some (fun _ v -> value_is_map v), "should be a Clojure map")
  | "coll" -> (Some (fun _ v -> value_is_coll v), "should be a collection")
  | "any" -> (Some (fun _ v -> value_some v), "")
  | _ -> (None, "No validation for property type " ^ property_type)

(* db-property/many? — property is a plain map here *)
let property_many (property : Wire.t) : bool =
  match Wire.get "db/cardinality" property with
  | Some (Wire.Keyword "db.cardinality/many") -> true
  | _ -> false

let property_type_of (property : Wire.t) : string option =
  match Wire.get "logseq.property/type" property with
  | Some (Wire.Keyword t) -> Some t
  | _ -> None

let property_value_type_is_ref (property : Wire.t) : bool =
  match Wire.get "db/valueType" property with
  | Some (Wire.Keyword "db.type/ref") -> true
  | _ -> false

(* db-malli-schema/empty-placeholder-value? *)
let empty_placeholder_value db (property : Wire.t) (v : value) : bool =
  if property_value_type_is_ref property then
    match v with
    | Ref id ->
        (match Ldb.ent_of_id db id with
         | Some e ->
             Ldb.ident_of e = Some "logseq.property/empty-placeholder"
         | None -> false)
    | Int id ->
        (match Ldb.ent_of_id db id with
         | Some e ->
             Ldb.ident_of e = Some "logseq.property/empty-placeholder"
         | None -> false)
    | _ -> false
  else
    v = Keyword "logseq.property/empty-placeholder"

(* db-malli-schema/validate-property-value (closed-values-validate? not
   set by this caller) — `many?`/`every?` + empty-placeholder fallback. *)
let validate_property_value_in_tuple db ~(validate_fn : value -> bool)
    (property : Wire.t) (property_val : value) ~(is_many : bool) : bool =
  if is_many then
    let elems =
      match property_val with
      | Set vs | List vs | Vector vs -> vs
      | v -> [ v ]
    in
    List.for_all validate_fn elems
    || (match elems with
        | first :: _ -> empty_placeholder_value db property first
        | [] -> false)
  else
    validate_fn property_val
    || empty_placeholder_value db property property_val

(* outliner-property/validate-property-value.
   malli's (me/humanize (mu/explain-data [:fn {:error/message m} f] v))
   produces [m] on failure and nil on success, so this returns
   Wire.Array [Wire.String message] or Wire.Nil. *)
let validate_property_value db (property : Wire.t) (value : Wire.t) : Wire.t =
  let property_type =
    match property_type_of property with
    | Some t -> t
    | None -> invalid_arg "No validation for property type"
  in
  let many = property_many property in
  let pred, message = validate_pred property_type in
  let v : value = Ds_wire.value_of_transit value in
  let valid =
    match pred with
    | Some pred ->
        let uses_db = property_type_uses_db property_type in
        let validate_fn v =
          if uses_db then pred db v else pred db v
        in
        (* outliner-property/validate-property-value-aux: for many? a
           non-sequential value is wrapped in a set first *)
        let value' =
          if many then
            match v with
            | List _ | Vector _ | Set _ -> v
            | _ -> Set [ v ]
          else v
        in
        validate_property_value_in_tuple db ~validate_fn:validate_fn property
          value' ~is_many:many
    | None ->
        (* cljs (throw (ex-info (str "No validation for property type " t) {})) *)
        invalid_arg message
  in
  if valid then Wire.Nil else Wire.Array [ Wire.String message ]

(* ---------- outliner/property.cljs ---------- *)

(* outliner-property/get-classes-parents *)
let get_classes_parents (tags : entity list) : entity list =
  Db_class.get_classes_parents tags

(* outliner-property/get-class-properties *)
let get_class_properties (class_ : entity) : entity list =
  let class_parents = get_classes_parents [ class_ ] in
  List.concat_map
    (fun (c : entity) -> Ldb.ref_ents c "logseq.property.class/properties")
    (class_ :: class_parents)
  |> (fun props ->
        let seen = Hashtbl.create 7 in
        List.filter
          (fun (p : entity) ->
             if Hashtbl.mem seen p.id then false
             else begin
               Hashtbl.replace seen p.id ();
               true
             end)
          props)
  |> Ldb.sort_by_order

type block_classes_properties =
  { classes : entity list
  ; all_classes : entity list
  ; classes_properties : entity list }

(* outliner-property/get-block-classes-properties — cljs sorts tags by
   :block/name (NOT filtered to class?) *)
let get_block_classes_properties db (eid : entity_id) : block_classes_properties =
  let block = Ldb.ent_of_id db eid in
  let tags =
    match block with
    | Some b -> Ldb.ref_ents b "block/tags"
    | None -> []
  in
  let classes =
    List.stable_sort
      (fun (a : entity) (b : entity) ->
         let name e =
           match Ldb.string_value e "block/name" with
           | Some s -> s
           | None -> ""
         in
         String.compare (name a) (name b))
      tags
  in
  let class_parents = get_classes_parents classes in
  let all_classes =
    List.filter
      (fun (c : entity) ->
         Ldb.ref_ents c "logseq.property.class/properties" <> [])
      (classes @ class_parents)
  in
  let classes_properties =
    List.concat_map
      (fun (c : entity) -> Ldb.ref_ents c "logseq.property.class/properties")
      all_classes
    |> (fun props ->
          let seen = Hashtbl.create 7 in
          List.filter
            (fun (p : entity) ->
               if Hashtbl.mem seen p.id then false
               else begin
                 Hashtbl.replace seen p.id ();
                 true
               end)
            props)
  in
  { classes; all_classes; classes_properties }

(* ---------- write path (outliner/property.cljs) ---------- *)

let kw s = Wire.Keyword s

(* Entity-based helpers mirroring the map versions above *)
let ent_property_type (e : entity) : string option =
  match Ldb.value e "logseq.property/type" with
  | Some (Keyword s) | Some (String s) -> Some s
  | _ -> None

let ent_many (e : entity) : bool =
  match Ldb.value e "db/cardinality" with
  | Some (Keyword "db.cardinality/many") -> true
  | _ -> false

let ent_ref_type (e : entity) : bool =
  match Ldb.value e "db/valueType" with
  | Some (Keyword "db.type/ref") -> true
  | _ -> false

(* :property/closed-values — reverse refs of
   :block/closed-value-property, minus recycled, sorted by :block/order *)
let closed_values_of (property : entity) : entity list =
  List.of_seq
    (datoms property.db Avet ~a:"block/closed-value-property"
       ~v:(Ref property.id) ())
  |> List.filter_map (fun d -> Ldb.ent_of_id property.db d.e)
  |> List.filter (fun e -> not (Ldb.recycled e))
  |> Ldb.sort_by_order

(* entity->db resolution of a wire value *)
let entity_of_wire db (v : Wire.t) : entity option =
  match v with
  | Wire.Int id -> Ldb.ent_of_id db id
  | Wire.Keyword k -> entity db (Ident k)
  | Wire.Uuid u -> entity db (Lookup_ref ("block/uuid", Uuid u))
  | Wire.Array [ Wire.Keyword a; x ] ->
      (match Ds_wire.value_of_transit x with
       | exception _ -> None
       | v -> entity db (Lookup_ref (a, v)))
  | Wire.Tagged ("datascript/Entity", Wire.Map kvs) ->
      (match Wire.get "db/id" (Wire.Map kvs) with
       | Some (Wire.Int id) -> Ldb.ent_of_id db id
       | _ -> None)
  | _ -> None

(* throw-error-if-read-only-property *)
let throw_error_if_read_only_property (property_ident : string) : unit =
  if List.mem property_ident Db_schema.read_only_properties then
    failwith "Read-only property value shouldn't be edited"

(* db-ident->eid *)
let db_ident_to_eid db (db_ident : string) : entity_id =
  if not (String.contains db_ident '/') then
    invalid_arg "db-ident->eid: not a qualified keyword";
  match entity db (Ident db_ident) with
  | Some e -> e.id
  | None -> failwith ("Wrong property db/ident " ^ db_ident)

(* throw-error-if-deleting-protected-property *)
let throw_error_if_deleting_protected_property (entity_idents : string list)
    (property_ident : string) : unit =
  if
    List.exists
      (fun ei -> Db_property.is_protected_property_pair ei property_ident)
      entity_idents
  then
    raise
      (Outliner_validate.Notification
         (Wire.Map
            [ (kw "type", kw "notification")
            ; (kw "payload",
               Wire.Map
                 [ (kw "type", kw "error")
                 ; (kw "message",
                    Wire.String "Property is protected and can't be deleted.")
                 ; (kw "i18n-key", kw "property.validation/protected")
                 ; (kw "entity-idents",
                    Wire.Array
                      (List.map (fun i -> Wire.Keyword i) entity_idents))
                 ; (kw "property", Wire.Keyword property_ident) ]) ]))

(* throw-error-if-removing-private-tag *)
let throw_error_if_removing_private_tag (entities : entity list) : unit =
  let private_tags =
    List.concat_map
      (fun e ->
         List.filter_map
           (fun (t : entity) ->
              match Ldb.ident_of t with
              | Some i when List.mem i Db_class.private_tags -> Some i
              | _ -> None)
           (Ldb.ref_ents e "block/tags"))
      entities
    |> List.sort_uniq String.compare
  in
  match private_tags with
  | [] -> ()
  | tags ->
      let joined = String.concat ", " tags in
      raise
        (Outliner_validate.Notification
           (Wire.Map
              [ (kw "type", kw "notification")
              ; (kw "payload",
                 Wire.Map
                   [ (kw "message",
                      Wire.String ("Can't remove private tags: " ^ joined ^ "."))
                   ; (kw "i18n-key",
                      kw "class.validation/cant-remove-private-tags")
                   ; (kw "i18n-args", Wire.Array [ Wire.String joined ])
                   ; (kw "type", kw "error") ])
              ; (kw "property-id", kw "block/tags") ]))

(* throw-error-if-deleting-required-property *)
let throw_error_if_deleting_required_property (property_ident : string) : unit =
  if List.mem property_ident Db_schema.required_properties then
    raise
      (Outliner_validate.Notification
         (Wire.Map
            [ (kw "type", kw "notification")
            ; (kw "payload",
               Wire.Map
                 [ (kw "message",
                    Wire.String "Can't remove required property.")
                 ; (kw "i18n-key",
                    kw "property.validation/cant-remove-required")
                 ; (kw "type", kw "error") ])
            ; (kw "property-id", Wire.Keyword property_ident) ]))

(* validate-batch-deletion-of-property *)
let validate_batch_deletion_of_property db (entities : entity list)
    (property_ident : string) : unit =
  throw_error_if_deleting_protected_property
    (List.filter_map Ldb.ident_of entities) property_ident;
  if property_ident = "block/tags" then
    throw_error_if_removing_private_tag entities;
  Outliner_validate.disallow_editing_private_built_in_nodes entities;
  throw_error_if_deleting_required_property property_ident;
  ignore db

(* block-classes-provide-property? *)
let block_classes_provide_property db (block : entity) (property_id : string)
    : bool =
  let r = get_block_classes_properties db block.id in
  List.exists
    (fun p -> Ldb.ident_of p = Some property_id)
    r.classes_properties

(* should-add-task-tag-for-property? *)
let should_add_task_tag_for_property (block : entity) (property_id : string)
    : bool =
  List.mem property_id
    [ "logseq.property/status"; "logseq.property/scheduled";
      "logseq.property/deadline" ]
  && (Ldb.ref_ents block "block/tags" = []
      || not (block_classes_provide_property block.db block property_id))

(* class-lookup-ref? *)
let class_lookup_ref (v : Wire.t) : bool =
  match v with
  | Wire.Array [ Wire.Keyword ("db/ident" | "block/uuid"); _ ] -> true
  | _ -> false

(* single-entity-ref? *)
let single_entity_ref (v : Wire.t) : bool =
  match v with
  | Wire.Tagged ("datascript/Entity", _) | Wire.Int _ | Wire.Keyword _ -> true
  | _ -> class_lookup_ref v

(* ->entity-ids *)
let to_entity_ids db (v : Wire.t) : entity_id list =
  let entity_id (item : Wire.t) : entity_id =
    match item with
    | Wire.Tagged ("datascript/Entity", Wire.Map kvs) ->
        (match Wire.get "db/id" (Wire.Map kvs) with
         | Some (Wire.Int id) -> id
         | _ -> failwith "Unsupported class extends entity reference")
    | Wire.Int id -> id
    | Wire.Keyword k ->
        (match entity db (Ident k) with
         | Some e -> e.id
         | None -> failwith "Unsupported class extends entity reference")
    | Wire.Array [ Wire.Keyword a; x ] ->
        (match Ds_wire.value_of_transit x with
         | exception _ -> failwith "Unsupported class extends entity reference"
         | rv ->
             (match entity db (Lookup_ref (a, rv)) with
              | Some e -> e.id
              | None -> failwith "Unsupported class extends entity reference"))
    | _ -> failwith "Unsupported class extends entity reference"
  in
  let items =
    match v with
    | Wire.Nil -> []
    | _ when single_entity_ref v -> [ v ]
    | Wire.Array vs | Wire.List vs | Wire.Set vs -> vs
    | _ -> [ v ]
  in
  List.map entity_id items

(* class-ancestor-ids *)
let class_ancestor_ids db (class_ids : entity_id list) : entity_id list =
  List.concat_map
    (fun id ->
       match Ldb.ent_of_id db id with
       | Some e -> Db_class.get_class_extends e |> List.map (fun (x : entity) -> x.id)
       | None -> [])
    class_ids
  |> List.sort_uniq compare

(* direct-extends-retraction-tx-data *)
let direct_extends_retraction_tx_data (class_ : entity)
    (redundant_parent_ids : entity_id list) : Wire.t list =
  if Ldb.is_class class_ && redundant_parent_ids <> [] then
    List.filter_map
      (fun (parent : entity) ->
         if List.mem parent.id redundant_parent_ids then
           Some
             (Wire.Array
                [ kw "db/retract"; Wire.Int class_.id
                ; kw "logseq.property.class/extends"; Wire.Int parent.id ])
         else None)
      (Ldb.ref_ents class_ "logseq.property.class/extends")
  else []

(* canonical-extends-ids *)
let canonical_extends_ids db (v : Wire.t) : entity_id list =
  let parent_ids = to_entity_ids db v in
  let ancestors = class_ancestor_ids db parent_ids in
  List.filter (fun id -> not (List.mem id ancestors)) parent_ids

(* normalize-extends-value *)
let normalize_extends_value db (v : Wire.t) : Wire.t =
  let ids = canonical_extends_ids db v in
  if single_entity_ref v then
    match ids with [ id ] -> Wire.Int id | _ -> Wire.Nil
  else Wire.Set (List.map (fun id -> Wire.Int id) ids)

(* redundant-extends-retraction-tx-data *)
let redundant_extends_retraction_tx_data db (class_ : entity) (v : Wire.t)
    : Wire.t list =
  let parent_ids = to_entity_ids db v in
  let ancestor_ids = class_ancestor_ids db parent_ids in
  let inherited_parent_ids = parent_ids @ ancestor_ids |> List.sort_uniq compare in
  direct_extends_retraction_tx_data class_ ancestor_ids
  @ List.concat_map
      (fun child_id ->
         match Ldb.ent_of_id db child_id with
         | Some child -> direct_extends_retraction_tx_data child inherited_parent_ids
         | None -> [])
      (Db_class.get_structured_children db class_.id)

(* build-property-value-tx-data *)
let build_property_value_tx_data conn (block : entity) (property_id : string)
    (value : Wire.t) : Wire.t list =
  match value with
  | Wire.Nil -> []
  | _ ->
      let db = Datascript.db conn in
      let old_value = Ldb.values block property_id in
      let property = entity db (Ident property_id) in
      let multiple_values =
        match property with Some p -> ent_many p | None -> false
      in
      let retract_multiple_values =
        multiple_values
        && (match value with
            | Wire.Array _ | Wire.List _ | Wire.Set _ -> true
            | _ -> false)
      in
      let multiple_values_empty =
        List.exists
          (fun v ->
             match v with
             | Ref id ->
                 (match Ldb.ent_of_id db id with
                  | Some e ->
                      Ldb.ident_of e = Some "logseq.property/empty-placeholder"
                  | None -> false)
             | _ -> false)
          old_value
      in
      let extends_ = property_id = "logseq.property.class/extends" in
      let tx_value =
        if extends_ then
          (match normalize_extends_value db value with
           | Wire.Set _ as s -> s
           | other -> other)
        else value
      in
      let update_block_tx =
        let m =
          Wire.Map
            [ (kw "db/id", Wire.Int block.id)
            ; (kw "block/updated-at",
               Wire.Int64 (Int64.of_float (Clock.now_ms ()))) ]
        in
        let m = Cljs_map.assoc m property_id tx_value in
        let m =
          if should_add_task_tag_for_property block property_id then
            Cljs_map.assoc m "block/tags" (kw "logseq.class/Task")
          else m
        in
        if property_id = "logseq.property/template-applied-to" then
          Cljs_map.assoc m "block/tags" (kw "logseq.class/Template")
        else m
      in
      (if multiple_values_empty then
         [ Wire.Array
             [ kw "db/retract"; Wire.Int block.id; kw property_id
             ; kw "logseq.property/empty-placeholder" ] ]
       else [])
      @ (if retract_multiple_values then
           [ Wire.Array [ kw "db/retract"; Wire.Int block.id; kw property_id ] ]
         else [])
      @ (if extends_ then
           redundant_extends_retraction_tx_data db block value
         else [])
      @ [ update_block_tx ]

(* get-property-value-schema — our port validates via validate_pred;
   new-closed-value? switches the three text-ish types to raw-value
   predicates, mirroring type.cljs validate options. *)
let validate_pred_with_options ~new_closed_value (property_type : string) :
    (db -> value -> bool) option * string =
  if new_closed_value then
    match property_type with
    | "default" -> (Some (fun _ v -> value_is_string v), "should be a text block")
    | "number" -> (Some (fun _ v -> value_is_number v), "should be a number")
    | "url" ->
        (Some
           (fun _ v ->
              match v with
              | String s -> url s || macro_url s
              | _ -> false),
           "should be a URL")
    | _ -> validate_pred property_type
  else validate_pred property_type

(* validate-property-value-aux against an entity property; returns the
   humanized error message option (string) *)
let validate_property_value_aux db ~(new_closed_value : bool)
    (property : entity) (value : value) ~(many : bool) : string option =
  let property_type =
    match ent_property_type property with
    | Some t -> t
    | None -> invalid_arg "No validation for property type"
  in
  let pred, message = validate_pred_with_options ~new_closed_value property_type in
  match pred with
  | None -> invalid_arg message
  | Some pred ->
      let v =
        if many then
          match value with
          | List _ | Vector _ | Set _ -> value
          | _ -> Set [ value ]
        else value
      in
      let pwire =
        Wire.Map
          [ (kw "db/valueType",
             (if ent_ref_type property then kw "db.type/ref" else Wire.Nil)) ]
      in
      let valid =
        validate_property_value_in_tuple db ~validate_fn:(pred db) pwire v
          ~is_many:many
      in
      if valid then None else Some message

(* validate-property-value-aux Wire-value variant used by
   upsert-closed-value (value is a datascript value). *)
let validate_property_value_aux_value db ~new_closed_value (property : entity)
    (value : value) ~(many : bool) : string option =
  validate_property_value_aux db ~new_closed_value property value ~many

(* fail-parse-double *)
let fail_parse_double (v_str : string) : float =
  match float_of_string_opt v_str with
  | Some f -> f
  | None ->
      raise
        (Outliner_validate.Notification
           (Wire.Map
              [ (kw "type", kw "notification")
              ; (kw "payload",
                 Wire.Map
                   [ (kw "message",
                      Wire.String
                        ("Can't convert \"" ^ v_str ^ "\" to a number."))
                   ; (kw "i18n-key",
                      kw "property.validation/cant-convert-to-number")
                   ; (kw "i18n-args", Wire.Array [ Wire.String v_str ])
                   ; (kw "type", kw "error") ]) ]))

(* convert-property-input-string — block-type is the block's
   :logseq.property/type (string option) *)
let convert_property_input_string (block_type : string option)
    (property : entity) (v : Wire.t) : Wire.t =
  let schema_type = ent_property_type property in
  let prop_ident = Ldb.ident_of property in
  match v with
  | Wire.String s
    when schema_type = Some "number"
         || (prop_ident = Some "logseq.property/default-value"
             && block_type = Some "number") ->
      Wire.Float (fail_parse_double s)
  | _ -> v

(* update-datascript-schema *)
let update_datascript_schema (property : entity) (schema : Wire.t) : Wire.t list =
  let new_type =
    match Cljs_map.get schema "logseq.property/type" with
    | Some (Wire.Keyword t) -> Some t
    | _ -> None
  in
  let ident = Ldb.ident_of property in
  let cardinality =
    match Cljs_map.get schema "db/cardinality" with
    | Some (Wire.Keyword ("many" | "db.cardinality/many")) ->
        "db.cardinality/many"
    | _ -> "db.cardinality/one"
  in
  let old_type = ent_property_type property in
  let old_ref_type =
    match old_type with
    | Some t -> List.mem t Db_schema.user_ref_property_types
    | None -> false
  in
  let ref_type =
    match new_type with
    | Some t -> List.mem t Db_schema.user_ref_property_types
    | None -> false
  in
  let base =
    let m =
      Wire.Map
        [ (kw "db/ident",
           (match ident with Some i -> Wire.Keyword i | None -> Wire.Nil))
        ; (kw "db/cardinality", kw cardinality)
        ; (kw "block/updated-at",
           Wire.Int64 (Int64.of_float (Clock.now_ms ()))) ]
    in
    if ref_type then Cljs_map.assoc m "db/valueType" (kw "db.type/ref") else m
  in
  [ base ]
  @ (match new_type with
     | Some _ when old_ref_type && not ref_type ->
         [ Wire.Array
             [ kw "db/retract"; Wire.Int property.id; kw "db/valueType" ] ]
     | _ -> [])

(* validate-property-name-update *)
let validate_property_name_update conn (property : entity)
    (property_name : string option) : unit =
  let current = Ldb.string_value property "block/title" in
  match property_name with
  | Some name when Some name <> current ->
      Outliner_validate.validate_page_title name;
      Outliner_validate.validate_page_title_characters name;
      Outliner_validate.validate_block_title (Datascript.db conn) name
        (Some property);
      Outliner_validate.validate_property_title name
  | _ -> ()

(* update-property *)
let update_property conn (db_ident : string) (property : entity)
    (schema : Wire.t) ~(property_name : string option)
    ~(properties : (string * Wire.t) list) : entity =
  let db = Datascript.db conn in
  validate_property_name_update conn property property_name;
  Outliner_validate.validate_editing_built_in_property property schema;
  let ent_get (e : entity) (k : string) : Wire.t =
    match Ldb.value e k with
    | Some v -> Ds_wire.transit_of_value v
    | None -> Wire.Nil
  in
  let changed_property_attrs =
    let attrs =
      List.filter_map
        (fun (k, v) ->
           if k = "db/cardinality" then None
           else if ent_get property k <> v then Some (k, v)
           else None)
        (match schema with
         | Wire.Map kvs ->
             List.filter_map
               (fun (k, v) ->
                  match k with Wire.Keyword s -> Some (s, v) | _ -> None)
               kvs
         | _ -> [])
    in
    let attrs =
      match property_name with
      | Some name when Some name <> Ldb.string_value property "block/title" ->
          attrs
          @ [ ("block/title", Wire.String name)
            ; ("block/name",
               Wire.String (Outliner_page.page_name_sanity_lc name)) ]
      | _ -> attrs
    in
    attrs
  in
  let property_tx_data =
    (match changed_property_attrs with
     | [] -> []
     | attrs ->
         [ Cljs_map.merge
             (Wire.Map
                [ (kw "db/ident", kw db_ident)
                ; (kw "block/updated-at",
                   Wire.Int64 (Int64.of_float (Clock.now_ms ()))) ])
             (Wire.Map
                (List.map (fun (k, v) -> (Wire.Keyword k, v)) attrs)) ])
    @
    (let schema_nonempty =
       match schema with Wire.Map (_ :: _) -> true | _ -> false
     in
     let type_changed =
       ent_property_type property
       <>
       (match Cljs_map.get schema "logseq.property/type" with
        | Some (Wire.Keyword t) -> Some t
        | _ -> None)
     in
     let cardinality_changed =
       match Cljs_map.get schema "db/cardinality" with
       | Some (Wire.Keyword c) ->
           Some c
           <>
           (match Ldb.value property "db/cardinality" with
            | Some (Keyword k) ->
                Some
                  (match String.split_on_char '/' k with
                   | [ _; n ] -> n
                   | _ -> k)
            | _ -> None)
       | _ -> false
     in
     let default_ref_missing =
       Cljs_map.get schema "logseq.property/type" = Some (kw "default")
       && not (ent_ref_type property)
     in
     let has_closed_values = closed_values_of property <> [] in
     if
       schema_nonempty
       && (type_changed || cardinality_changed || default_ref_missing
           || has_closed_values)
     then update_datascript_schema property schema
     else [])
  in
  let tx_data =
    property_tx_data
    @ List.concat_map
        (fun (property_id, v) ->
           build_property_value_tx_data conn property property_id v)
        properties
  in
  let many_to_one =
    ent_many property
    &&
    (match Cljs_map.get schema "db/cardinality" with
     | Some (Wire.Keyword ("one" | "db.cardinality/one")) -> true
     | _ -> false)
  in
  if
    many_to_one
    && Seq.uncons (datoms db Avet ~a:db_ident ()) |> Option.is_some
  then
    raise
      (Outliner_validate.Notification
         (Wire.Map
            [ (kw "type", kw "notification")
            ; (kw "payload",
               Wire.Map
                 [ (kw "message",
                    Wire.String
                      "This property can't change from multiple values to one \
                       value because it has existing data.")
                 ; (kw "i18n-key", kw "property.validation/many-to-one")
                 ; (kw "type", kw "warning") ]) ]));
  if
    List.exists (fun (k, _) -> k = "logseq.property/type") changed_property_attrs
    && Seq.uncons (datoms db Avet ~a:db_ident ()) |> Option.is_some
  then
    raise
      (Outliner_validate.Notification
         (Wire.Map
            [ (kw "type", kw "notification")
            ; (kw "payload",
               Wire.Map
                 [ (kw "message",
                    Wire.String
                      "This property's type can't be changed because it has \
                       existing data.")
                 ; (kw "type", kw "error") ]) ]));
  if tx_data <> [] then
    Db_transact.transact conn tx_data
      [ ("outliner-op", Keyword "update-property")
      ; ("property-id", Int property.id) ]
    |> ignore;
  property

(* validate! — same contract as cljs validate!: throws when invalid *)
let validate_bang (db : db) (property : entity) (value : value)
    ~(new_closed_value : bool) : unit =
  let skip =
    ent_ref_type property && value = Keyword "logseq.property/empty-placeholder"
  in
  if not skip then
    match
      validate_property_value_aux_value db ~new_closed_value property
        value ~many:(ent_many property)
    with
    | None -> ()
    | Some msg ->
        let title =
          Option.value (Ldb.string_value property "block/title") ~default:""
        in
        let error_msg =
          "Property validation failed: \"" ^ title ^ "\" " ^ msg
        in
        raise
          (Outliner_validate.Notification
             (Wire.Map
                [ (kw "type", kw "notification")
                ; (kw "payload",
                   Wire.Map
                     [ (kw "message", Wire.String error_msg)
                     ; (kw "i18n-key", kw "property.validation/invalid-value")
                     ; (kw "i18n-args",
                        Wire.Array [ Wire.String title; Wire.String msg ])
                     ; (kw "type", kw "warning") ])
                ; (kw "property",
                   (match Ldb.ident_of property with
                    | Some i -> Wire.Keyword i
                    | None -> Wire.Nil))
                ; (kw "value", Ds_wire.transit_of_value value)
                ; (kw "errors", Wire.Array [ Wire.String msg ]) ]))

(* throw-error-if-invalid-property-value *)
let throw_error_if_invalid_property_value db (property : entity) (value : value)
    : unit =
  let many = ent_many property in
  let value' =
    if many then
      match value with List _ | Vector _ | Set _ -> value | _ -> Set [ value ]
    else value
  in
  validate_bang db property value' ~new_closed_value:false

(* throw-error-if-invalid-new-property-value *)
let throw_error_if_invalid_new_property_value db (property : entity)
    (value : value) : unit =
  let many = ent_many property in
  let value' =
    if many then
      match value with List _ | Vector _ | Set _ -> value | _ -> Set [ value ]
    else value
  in
  validate_bang db property value' ~new_closed_value:true

(* ->eid — uuid → lookup ref, other → as-is *)
let to_eid (v : Wire.t) : Wire.t =
  match v with
  | Wire.Uuid _ -> Wire.Array [ kw "block/uuid"; v ]
  | _ -> v

let entity_of_eid db (eid : Wire.t) : entity option =
  match eid with
  | Wire.Array [ Wire.Keyword a; x ] ->
      (match Ds_wire.value_of_transit x with
       | exception _ -> None
       | rv -> entity db (Lookup_ref (a, rv)))
  | _ -> entity_of_wire db eid

(* raw-set-block-property! *)
let raw_set_block_property conn (block : entity) (property : entity)
    (new_value : Wire.t) : unit =
  (match Ldb.ident_of property with
   | Some ident -> throw_error_if_read_only_property ident
   | None -> ());
  throw_error_if_invalid_property_value (Datascript.db conn) property
    (Ds_wire.value_of_transit new_value);
  let property_id =
    match Ldb.ident_of property with
    | Some i -> i
    | None -> failwith "property has no db/ident"
  in
  let tx_data = build_property_value_tx_data conn block property_id new_value in
  Db_transact.transact conn tx_data
    [ ("outliner-op", Keyword "save-block") ]
  |> ignore

(* create-property-text-block! *)
let create_property_text_block conn ~(block_id : Wire.t option)
    (property_id : string) (value : Wire.t)
    ?(new_block_id : string option) ?(set_block_property = true) () : string =
  let db = Datascript.db conn in
  let property =
    match entity db (Ident property_id) with
    | Some p -> p
    | None -> failwith ("Property " ^ property_id ^ " doesn't exist yet")
  in
  let block =
    match block_id with
    | Some id -> entity_of_eid db id
    | None -> None
  in
  let value' =
    convert_property_input_string
      (match block with Some b -> Ldb.string_value b "logseq.property/type" | None -> None)
      property value
  in
  if ent_property_type property <> Some "number" then
    (match value' with
     | Wire.String _ -> ()
     | _ ->
         failwith "value should be a string");
  (* db-property-build/build-property-value-block *)
  let block_ref, page_ref =
    match block with
    | Some b -> (Wire.Int b.id,
                 (match Ldb.value b "block/page" with
                  | Some (Ref pid) -> Wire.Int pid
                  | _ -> Wire.Int b.id))
    | None -> ((match Ldb.ident_of property with
                | Some i -> Wire.Keyword i
                | None -> Wire.Nil),
               (match Ldb.ident_of property with
                | Some i -> Wire.Keyword i
                | None -> Wire.Nil))
  in
  let value_key =
    (* property-value-content? — for :default type the property's own
       type decides; here block-type version only matters for
       default-value properties *)
    match ent_property_type property with
    | Some t when List.mem t Db_schema.original_value_ref_property_types ->
        "logseq.property/value"
    | Some _ ->
        if Ldb.ident_of property = Some "logseq.property/default-value"
           &&
           (match block with
            | Some b ->
                (match Ldb.string_value b "logseq.property/type" with
                 | Some t ->
                     List.mem t Db_schema.original_value_ref_property_types
                 | None -> false)
            | None -> false)
        then "logseq.property/value"
        else "block/title"
    | None -> "block/title"
  in
  let new_value_block =
    let m =
      Wire.Map
        [ (kw "block/uuid",
           (match new_block_id with
            | Some u -> Wire.Uuid u
            | None -> Wire.Uuid (Uuid_gen.uuid ())))
        ; (kw "block/page", page_ref)
        ; (kw "block/parent", block_ref)
        ; (kw "logseq.property/created-from-property",
           (if Ldb.ident_of property = Some "logseq.property/default-value"
            then block_ref
            else
              match Ldb.ident_of property with
              | Some i -> Wire.Keyword i
              | None -> Wire.Int property.id))
        ; (kw "block/order", Wire.String (Db_order.gen_key_from_max ())) ]
    in
    let m = Cljs_map.assoc m value_key value' in
    Sqlite_util.block_with_timestamps m
  in
  Db_transact.batch_transact_with_temp_conn conn
    [ ("outliner-op", Keyword "create-property-text-block") ]
    (fun temp ->
       Db_transact.transact temp [ new_value_block ]
         [ ("outliner-op", Keyword "insert-blocks") ]
       |> ignore;
       if set_block_property then
         match block with
         | Some b ->
             (match Cljs_map.get new_value_block "block/uuid" with
              | Some (Wire.Uuid u) ->
                  (match
                     entity (Datascript.db temp) (Lookup_ref ("block/uuid", Uuid u))
                   with
                   | Some vb ->
                       raw_set_block_property temp b property (Wire.Int vb.id)
                   | None -> ())
              | _ -> ())
         | None -> ())
  |> ignore;
  match Cljs_map.get new_value_block "block/uuid" with
  | Some (Wire.Uuid u) -> u
  | _ -> failwith "no uuid"

(* get-property-value-eid *)
let get_property_value_eid db (property_id : string) (raw_value : value)
    : entity_id option =
  let q =
    if property_id = "block/tags" then
      q_string db
        ~inputs:[ Arg_scalar (Result_value raw_value) ]
        "[:find [?v ...] :in $ ?title :where \
         [?v :block/title ?title] [?v :block/tags :logseq.class/Tag]]"
    else
      q_string db
        ~inputs:
          [ Arg_scalar (Result_value (Keyword property_id))
          ; Arg_scalar (Result_value raw_value) ]
        "[:find [?v ...] :in $ ?property-id ?raw-value :where \
         [?b ?property-id ?v] \
         (or [?v :block/title ?raw-value] \
             [?v :logseq.property/value ?raw-value])]"
  in
  List.find_map
    (function
      | [ Result_entity id ] -> Some id
      | _ -> None)
    q

(* find-or-create-property-value *)
let find_or_create_property_value conn (property_id : string) (v : Wire.t)
    (block_id : Wire.t option) : entity_id =
  let db = Datascript.db conn in
  let property =
    match entity db (Ident property_id) with
    | Some p -> p
    | None -> failwith ("Property " ^ property_id ^ " doesn't exist")
  in
  let closed_values = closed_values_of property in
  let default_or_url =
    List.mem (Option.value (ent_property_type property) ~default:"")
      [ "default"; "url" ]
  in
  if closed_values <> [] then
    let vstr =
      match v with Wire.String s -> s | _ -> ""
    in
    let found =
      List.find_opt
        (fun item ->
           Ldb.string_value item "block/title" = Some vstr
           ||
           (match Ldb.value item "logseq.property/value" with
            | Some pv -> pv = Ds_wire.value_of_transit v
            | None -> false))
        closed_values
    in
    (match found with
     | Some item -> item.id
     | None -> failwith ("No matching closed value for " ^ vstr))
  else if
    default_or_url
    && property_id <> "logseq.property/order-list-type"
  then begin
    throw_error_if_invalid_new_property_value db property
      (Ds_wire.value_of_transit v);
    let v_uuid =
      create_property_text_block conn ~block_id property_id v
        ~set_block_property:false ()
    in
    match
      entity (Datascript.db conn) (Lookup_ref ("block/uuid", Uuid v_uuid))
    with
    | Some e -> e.id
    | None -> failwith "value block not created"
  end else
    let rv = Ds_wire.value_of_transit v in
    match get_property_value_eid db property_id rv with
    | Some id -> id
    | None ->
        let v_uuid =
          create_property_text_block conn ~block_id:None property_id v ()
        in
        (match
           entity (Datascript.db conn) (Lookup_ref ("block/uuid", Uuid v_uuid))
         with
         | Some e -> e.id
         | None -> failwith "value block not created")

(* convert-ref-property-value *)
let convert_ref_property_value conn (property_id : string) (v : Wire.t)
    (property_type : string) (block_id : Wire.t option) : Wire.t =
  let db = Datascript.db conn in
  let number_property = property_type = "number" in
  match v with
  | Wire.Keyword k when property_type <> "keyword" ->
      Wire.Int (db_ident_to_eid db k)
  | Wire.Array _ | Wire.List _ | Wire.Set _
    when (match v with
          | Wire.Array vs | Wire.List vs | Wire.Set vs ->
              List.for_all (function Wire.Int _ -> true | _ -> false) vs
          | _ -> false)
         && not number_property ->
      v
  | Wire.Int id when
      (not number_property)
      ||
      (match Ldb.ent_of_id db id with
       | Some e ->
           (match Ldb.ref_ent e "logseq.property/created-from-property" with
            | Some p -> Ldb.ident_of p = Some property_id
            | None -> false)
       | None -> false) ->
      v
  | _ when property_type = "page" ->
      (match v with
       | Wire.String s when String.trim s <> "" ->
           (match Ldb.get_page db (String s) with
            | Some page when Ldb.is_page page -> Wire.Int page.id
            | _ ->
                let _title, page_uuid =
                  Outliner_page.create_bang conn s ()
                in
                (match page_uuid with
                 | None -> failwith "Failed to create page"
                 | Some u ->
                     (match
                        entity db (Lookup_ref ("block/uuid", Uuid u))
                      with
                      | Some e -> Wire.Int e.id
                      | None -> failwith "Failed to create page")))
       | _ -> failwith "Value should be non-empty string")
  | _ ->
      let v' =
        match v with
        | Wire.String s when number_property ->
            (match float_of_string_opt s with
             | Some f -> Wire.Float f
             | None -> Wire.Nil)
        | _ -> v
      in
      (match v' with
       | Wire.Nil -> Wire.Nil
       | _ ->
           Wire.Int
             (find_or_create_property_value conn property_id v' block_id))

(* convert-ref-property-values *)
let convert_ref_property_values conn (property_id : string) (value : Wire.t)
    (property_type : string) ~(many : bool) ~(block_id : Wire.t option) : Wire.t =
  match value with
  | (Wire.Array vs | Wire.List vs | Wire.Set vs) when many ->
      (try
         Wire.Array
           (List.map
              (fun v ->
                 convert_ref_property_value conn property_id v property_type
                   block_id)
              vs)
       with e ->
         raise
           (Outliner_validate.Notification
              (Wire.Map
                 [ (kw "type", kw "notification")
                 ; (kw "property-id", Wire.Keyword property_id)
                 ; (kw "property-type", Wire.Keyword property_type)
                 ; (kw "value", value)
                 ; (kw "many?", Wire.Bool many)
                 ; (kw "message",
                    Wire.String
                      ("Failed to convert many property values: "
                       ^ Printexc.to_string e)) ])))
  | _ ->
      convert_ref_property_value conn property_id value property_type block_id

(* throw-error-if-self-value *)
let throw_error_if_self_value (block : entity) (value : Wire.t) (ref_ : bool)
    : unit =
  let values =
    match value with
    | Wire.Array vs | Wire.List vs | Wire.Set vs -> vs
    | _ -> [ value ]
  in
  let has_self =
    ref_
    && List.exists
         (fun v ->
            match v with
            | Wire.Int id -> id = block.id
            | _ -> false)
         values
  in
  if has_self then
    raise
      (Outliner_validate.Notification
         (Wire.Map
            [ (kw "type", kw "notification")
            ; (kw "payload",
               Wire.Map
                 [ (kw "message",
                    Wire.String
                      "Can't set this block itself as own property value.")
                 ; (kw "i18n-key",
                    kw "property.validation/cant-set-self-value")
                 ; (kw "type", kw "error") ]) ]))

(* remove-status! *)
let remove_status conn (block_ids : Wire.t list)
    ~(preserve_task_tag : bool) (tx_meta : tx_meta) : unit =
  let db = Datascript.db conn in
  let blocks = List.filter_map (fun id -> entity_of_eid db id) block_ids in
  let task_property_idents =
    match entity db (Ident "logseq.class/Task") with
    | Some t ->
        List.filter_map Ldb.ident_of
          (Ldb.ref_ents t "logseq.property.class/properties")
    | None -> []
  in
  let other_task_properties =
    List.filter (fun i -> i <> "logseq.property/status") task_property_idents
  in
  validate_batch_deletion_of_property db blocks "logseq.property/status";
  match blocks with
  | [] -> ()
  | _ ->
      let txs =
        List.concat_map
          (fun block ->
             let status =
               Ldb.ref_ent block "logseq.property/status"
             in
             let direct_status =
               Ldb.value block "logseq.property/status" |> Option.is_some
             in
             let empty_placeholder =
               direct_status
               &&
               (match status with
                | Some s ->
                    Ldb.ident_of s = Some "logseq.property/empty-placeholder"
                | None -> false)
             in
             let task_tag =
               List.exists
                 (fun (t : entity) -> Ldb.ident_of t = Some "logseq.class/Task")
                 (Ldb.ref_ents block "block/tags")
             in
             let status_provided =
               task_tag
               || block_classes_provide_property db block
                    "logseq.property/status"
             in
             let has_other_task_prop =
               List.exists
                 (fun attr -> Option.is_some (Ldb.value block attr))
                 other_task_properties
             in
             let remove_task =
               task_tag && (not empty_placeholder)
               && (not preserve_task_tag) && (not has_other_task_prop)
             in
             if empty_placeholder then []
             else if remove_task then
               [ Wire.Array
                   [ kw "db/retract"; Wire.Int block.id
                   ; kw "logseq.property/status" ]
               ; Wire.Array
                   [ kw "db/retract"; Wire.Int block.id; kw "block/tags"
                   ; kw "logseq.class/Task" ] ]
             else if status_provided then
               [ Cljs_map.assoc
                   (Wire.Map [ (kw "db/id", Wire.Int block.id) ])
                   "logseq.property/status"
                   (kw "logseq.property/empty-placeholder") ]
             else if direct_status then
               [ Wire.Array
                   [ kw "db/retract"; Wire.Int block.id
                   ; kw "logseq.property/status" ] ]
             else [])
          blocks
      in
      Db_transact.transact conn txs tx_meta |> ignore

(* batch-remove-property! *)
let batch_remove_property conn (block_ids : Wire.t list) (property_id : string)
    ?(preserve_task_tag = false) () : unit =
  let db = Datascript.db conn in
  throw_error_if_read_only_property property_id;
  if property_id = "logseq.property/status" then
    remove_status conn block_ids ~preserve_task_tag
      [ ("outliner-op", Keyword "batch-remove-property") ]
  else begin
    let block_eids = List.map to_eid block_ids in
    let blocks = List.filter_map (entity_of_eid db) block_eids in
    let block_id_set = List.map (fun (b : entity) -> b.id) blocks in
    validate_batch_deletion_of_property db blocks property_id;
    if blocks <> [] then
      if entity db (Ident property_id) <> None then begin
          let txs =
            List.concat_map
              (fun block ->
                 let value_ents =
                   List.filter_map
                     (fun v ->
                        match v with
                        | Ref id -> Ldb.ent_of_id db id
                        | _ -> None)
                     (Ldb.values block property_id)
                 in
                 let deleting_entities =
                   List.filter
                     (fun (v : entity) ->
                        let referrers =
                          q_string db
                            ~inputs:
                              [ Arg_scalar (Result_value (Keyword property_id))
                              ; Arg_scalar (Result_entity v.id) ]
                            "[:find [?e ...] :in $ ?property-id ?value-id \
                             :where [?e ?property-id ?value-id]]"
                          |> List.filter_map (function
                               | [ Result_entity id ] -> Some id
                               | _ -> None)
                        in
                        Option.is_some
                          (Ldb.value v "logseq.property/created-from-property")
                        && (not (Ldb.is_page v)) && (not (Ldb.closed_value v))
                        && List.for_all (fun r -> List.mem r block_id_set) referrers)
                     value_ents
                 in
                 let retract_blocks_tx =
                   if deleting_entities <> [] then
                     Outliner_blocks.delete_blocks db deleting_entities
                   else []
                 in
                 [ Wire.Array
                     [ kw "db/retract"; Wire.Int block.id; kw property_id ] ]
                 @ retract_blocks_tx)
              blocks
          in
          if txs <> [] then
            Db_transact.transact conn txs
              [ ("outliner-op", Keyword "batch-remove-property") ]
            |> ignore
          end
  end

(* validate-batch-set-property *)
let validate_batch_set_property conn (block_eids : entity_id list)
    (property_id : string) (v : Wire.t) : unit =
  let db = Datascript.db conn in
  Outliner_validate.disallow_editing_private_built_in_nodes
    (List.filter_map (Ldb.ent_of_id db) block_eids);
  if property_id = "block/tags" then
    (match to_entity_ids db v with
     | [ vid ] -> Outliner_validate.validate_tags_property db block_eids vid
     | _ -> ());
  if property_id = "logseq.property.class/extends" then
    List.iter
      (fun parent_id ->
         match Ldb.ent_of_id db parent_id with
         | Some parent ->
             Outliner_validate.validate_extends_property db parent
               (List.filter_map (Ldb.ent_of_id db) block_eids)
         | None -> ())
      (to_entity_ids db v)

(* normalize-default-url-property-value *)
let normalize_default_url_property_value db (property : entity) (value : Wire.t)
    : Wire.t =
  match value with
  | Wire.Int _ ->
      throw_error_if_invalid_property_value db property
        (Ds_wire.value_of_transit value);
      (match entity_of_wire db value with
       | Some e ->
           (match Ldb.string_value e "block/title" with
            | Some t -> Wire.String t
            | None -> value)
       | None -> value)
  | _ -> value

let normalize_and_validate_default_url_property_value db (property : entity)
    (value : Wire.t) : Wire.t =
  let value' = normalize_default_url_property_value db property value in
  (match value' with
   | Wire.Keyword _ -> ()
   | _ ->
       throw_error_if_invalid_new_property_value db property
         (Ds_wire.value_of_transit value'));
  value'

let normalize_and_validate_default_url_property_values db (property : entity)
    (value : Wire.t) ~(many : bool) : Wire.t =
  match value with
  | (Wire.Array vs | Wire.List vs | Wire.Set vs) when many ->
      Wire.Array
        (List.map
           (normalize_and_validate_default_url_property_value db property)
           vs)
  | _ -> normalize_and_validate_default_url_property_value db property value

(* throw-error-if-invalid-alias *)
let throw_error_if_invalid_alias db (source_block : entity) (alias_id : entity_id)
    : unit =
  if alias_id = source_block.id then
    raise
      (Outliner_validate.Notification
         (Wire.Map
            [ (kw "type", kw "notification")
            ; (kw "payload",
               Wire.Map
                 [ (kw "type", kw "error")
                 ; (kw "i18n-key", kw "page.validation/alias-self")
                 ; (kw "message",
                    Wire.String "Alias can't be the page itself.") ]) ]));
  (match Ldb.ent_of_id db alias_id with
   | Some alias_entity ->
       let existing_owner =
         List.of_seq
           (datoms db Avet ~a:"block/alias" ~v:(Ref alias_id) ())
         |> List.find_map (fun d -> Ldb.ent_of_id db d.e)
       in
       (match existing_owner with
        | Some owner when owner.id <> source_block.id ->
            raise
              (Outliner_validate.Notification
                 (Wire.Map
                    [ (kw "type", kw "notification")
                    ; (kw "payload",
                       Wire.Map
                         [ (kw "type", kw "error")
                         ; (kw "i18n-key",
                            kw "page.validation/alias-duplicate-owner")
                         ; (kw "message",
                            Wire.String
                              "This page is already an alias of another page.") ]) ]))
        | _ -> ());
       if Ldb.ref_ents alias_entity "block/alias" <> [] then
         raise
           (Outliner_validate.Notification
              (Wire.Map
                 [ (kw "type", kw "notification")
                 ; (kw "payload",
                    Wire.Map
                      [ (kw "type", kw "error")
                      ; (kw "i18n-key",
                         kw "page.validation/alias-owns-aliases")
                      ; (kw "message",
                         Wire.String
                           "A page that has aliases can't be used as an alias.") ]) ]))
   | None -> ());
  let source_aliases =
    List.of_seq
      (datoms db Avet ~a:"block/alias" ~v:(Ref source_block.id) ())
  in
  if source_aliases <> [] then
    raise
      (Outliner_validate.Notification
         (Wire.Map
            [ (kw "type", kw "notification")
            ; (kw "payload",
               Wire.Map
                 [ (kw "type", kw "error")
                 ; (kw "i18n-key",
                    kw "page.validation/alias-source-is-alias")
                 ; (kw "message",
                    Wire.String
                      "A page that is an alias of another page can't have its \
                       own aliases.") ]) ]))

(* throw-error-if-batch-alias-targets *)
let throw_error_if_batch_alias_targets (block_eids : Wire.t list)
    (property_id : string) : unit =
  if property_id = "block/alias" && List.length block_eids > 1 then
    raise
      (Outliner_validate.Notification
         (Wire.Map
            [ (kw "type", kw "notification")
            ; (kw "payload",
               Wire.Map
                 [ (kw "type", kw "error")
                 ; (kw "i18n-key",
                    kw "page.validation/alias-batch-multiple-owners")
                 ; (kw "message",
                    Wire.String
                      "Aliases can't be batch-set on multiple pages.") ]) ]))

(* batch-set-property! *)
let batch_set_property conn (block_ids : Wire.t list) (property_id : string)
    (v : Wire.t) ?(entity_id_opt = false) ?(preserve_task_tag = false) () : unit =
  throw_error_if_read_only_property property_id;
  let db = Datascript.db conn in
  if v = Wire.Nil then
    batch_remove_property conn block_ids property_id ~preserve_task_tag ()
  else begin
    let block_eids = List.map to_eid block_ids in
    throw_error_if_batch_alias_targets block_eids property_id;
    let eid_ints =
      List.filter_map
        (fun e ->
           match entity_of_eid db e with
           | Some x -> Some x.id
           | None -> None)
        block_eids
    in
    validate_batch_set_property conn eid_ints property_id v;
    let property =
      match entity db (Ident property_id) with
      | Some p -> p
      | None -> failwith ("Property " ^ property_id ^ " doesn't exist yet")
    in
    let property_type =
      Option.value (ent_property_type property) ~default:"default"
    in
    let many = ent_many property in
    let entity_id_v = entity_id_opt && (match v with Wire.Int _ -> true | _ -> false) in
    let ref_ = List.mem property_type Db_schema.all_ref_property_types in
    let extends_ = property_id = "logseq.property.class/extends" in
    let default_url_not_closed =
      List.mem property_type [ "default"; "url" ] && (not extends_)
      && closed_values_of property = []
    in
    let v' =
      if extends_ then normalize_extends_value db v
      else if ref_ && not entity_id_v then
        if default_url_not_closed then
          normalize_and_validate_default_url_property_values db property v ~many
        else
          convert_ref_property_values conn property_id v property_type ~many
            ~block_id:None
      else v
    in
    if v' = Wire.Nil then failwith "Property value must be not nil";
    let txs =
      List.concat_map
        (fun eid ->
           match entity_of_eid db eid with
           | Some block ->
               let v' =
                 if
                   default_url_not_closed
                   && not
                        (match v with
                         | Wire.Keyword _ -> entity_id_v
                         | _ -> false)
                 then
                   convert_ref_property_values conn property_id v' property_type
                     ~many ~block_id:(Some (Wire.Int block.id))
                 else v'
               in
               throw_error_if_self_value block v' ref_;
               throw_error_if_invalid_property_value (Datascript.db conn)
                 property (Ds_wire.value_of_transit v');
               if property_id = "block/alias" then
                 (let alias_ids =
                    match v' with
                    | Wire.Array vs | Wire.List vs | Wire.Set vs -> vs
                    | _ -> [ v' ]
                  in
                  List.iter
                    (fun aid ->
                       match aid with
                       | Wire.Int id ->
                           throw_error_if_invalid_alias db block id
                       | _ -> ())
                    alias_ids);
               build_property_value_tx_data conn block property_id v'
           | None -> [])
        block_eids
    in
    if txs <> [] then
      Db_transact.transact conn txs
        [ ("outliner-op", Keyword "batch-set-property") ]
      |> ignore
  end

(* remove-block-property! *)
let remove_block_property conn (eid : Wire.t) (property_id : string) : unit =
  let db = Datascript.db conn in
  throw_error_if_read_only_property property_id;
  let eid' = to_eid eid in
  let block = entity_of_eid db eid' in
  let property = entity db (Ident property_id) in
  let tx_meta = [ ("outliner-op", Keyword "remove-block-property") ] in
  (match block with
   | Some b ->
       if
         not
           (List.mem property_id
              [ "logseq.property.class/extends"; "logseq.property/status" ])
       then validate_batch_deletion_of_property db [ b ] property_id
   | None -> ());
  match block with
  | None -> ()
  | Some b ->
      let cur_ident =
        match Ldb.ref_ent b property_id with
        | Some e -> Ldb.ident_of e
        | None ->
            (match Ldb.value b property_id with
             | Some (Keyword k) -> Some k
             | _ -> None)
      in
      if cur_ident = Some "logseq.property/empty-placeholder" then ()
      else if property_id = "logseq.property/status" then
        remove_status conn [ eid' ] ~preserve_task_tag:false tx_meta
      else
        let default_value_matches =
          match property with
          | Some p ->
              (match Ldb.ref_ent p "logseq.property/default-value" with
               | Some dv ->
                   (match Ldb.ref_ent b property_id with
                    | Some bv -> dv.id = bv.id
                    | None -> false)
               | None -> false)
          | None -> false
        in
        if default_value_matches then
          Db_transact.transact conn
            [ Cljs_map.assoc
                (Wire.Map [ (kw "db/id", Wire.Int b.id) ])
                property_id (kw "logseq.property/empty-placeholder") ]
            tx_meta
          |> ignore
        else if Ldb.is_class b && property_id = "logseq.property.class/extends" then
          Db_transact.transact conn
            [ Wire.Array
                [ kw "db/retract"; Wire.Int b.id
                ; kw "logseq.property.class/extends" ]
            ; Wire.Array
                [ kw "db/add"; Wire.Int b.id
                ; kw "logseq.property.class/extends"; kw "logseq.class/Root" ] ]
            tx_meta
          |> ignore
        else if List.mem property_id Db_schema.db_attribute_properties then
          Db_transact.transact conn
            [ Wire.Array [ kw "db/retract"; Wire.Int b.id; kw property_id ] ]
            tx_meta
          |> ignore
        else batch_remove_property conn [ eid' ] property_id ()

(* set-block-db-attribute! *)
let set_block_db_attribute conn (block : entity) (property : entity option)
    (property_id : string) (raw_v : Wire.t) (tx_v : Wire.t) : unit =
  let db = Datascript.db conn in
  let validation_v =
    match property with
    | Some p when ent_ref_type p && tx_v <> Wire.Nil -> tx_v
    | _ -> raw_v
  in
  (match property with
   | Some p ->
       throw_error_if_invalid_property_value db p
         (Ds_wire.value_of_transit validation_v)
   | None -> ());
  if property_id = "block/alias" then
    (let alias_ids =
       match tx_v with
       | Wire.Array vs | Wire.List vs | Wire.Set vs -> vs
       | _ -> [ tx_v ]
     in
     List.iter
       (fun aid ->
          match aid with
          | Wire.Int id -> throw_error_if_invalid_alias db block id
          | _ -> ())
       alias_ids);
  let tx_data =
    [ Cljs_map.assoc
        (Wire.Map [ (kw "db/id", Wire.Int block.id) ])
        property_id tx_v ]
    @ (if property_id = "logseq.property.class/extends" then
         [ Wire.Array
             [ kw "db/retract"; Wire.Int block.id
             ; kw "logseq.property.class/extends"; kw "logseq.class/Root" ] ]
       else [])
  in
  Db_transact.transact conn tx_data
    [ ("outliner-op", Keyword "save-block") ]
  |> ignore

(* set-block-property! *)
let set_block_property conn (block_eid : Wire.t) (property_id : string)
    (v : Wire.t) : unit =
  Db_transact.batch_transact_with_temp_conn conn
    [ ("outliner-op", Keyword "set-block-property") ]
    (fun conn ->
       let db = Datascript.db conn in
       throw_error_if_read_only_property property_id;
       let block_eid' = to_eid block_eid in
       if not (String.contains property_id '/') then
         invalid_arg "property-id should be a keyword";
       let block = entity_of_eid db block_eid' in
       let db_attribute = Db_schema.db_schema_attr property_id in
       let property = entity db (Ident property_id) in
       let property_type =
         match property with
         | Some p -> Option.value (ent_property_type p) ~default:"default"
         | None -> "default"
       in
       let ref_ = List.mem property_type Db_schema.all_ref_property_types in
       let extends_ = property_id = "logseq.property.class/extends" in
       let v' =
         if extends_ then normalize_extends_value db v
         else if ref_ then
           convert_ref_property_value conn property_id v property_type
             (Some block_eid')
         else v
       in
       (match block, property with
        | Some _, Some _ -> ()
        | _ -> failwith "Set block property failed: block or property doesn't exist");
       if v' = Wire.Nil then remove_block_property conn block_eid' property_id
       else begin
         let block = Option.get block in
         if property_id = "block/tags" then
           (match to_entity_ids db v' with
            | [ vid ] ->
                Outliner_validate.validate_tags_property db [ block.id ] vid
            | _ -> ());
         if extends_ then
           List.iter
             (fun parent_id ->
                match Ldb.ent_of_id db parent_id with
                | Some parent ->
                    Outliner_validate.validate_extends_property db parent [ block ]
                | None -> ())
             (to_entity_ids db v');
         if db_attribute then
           set_block_db_attribute conn block property property_id v v'
         else begin
           let property = Option.get property in
           let ref_ =
             match ent_property_type property with
             | Some t -> List.mem t Db_schema.all_ref_property_types
             | None -> false
           in
           let many = ent_many property in
           let existing_ids =
             let vals = Ldb.values block property_id in
             List.filter_map
               (fun vv -> match vv with Ref id -> Some id | _ -> None)
               vals
             |> List.sort_uniq compare
           in
           let new_ids =
             match v' with
             | Wire.Array vs | Wire.List vs | Wire.Set vs ->
                 List.filter_map
                   (fun x -> match x with Wire.Int id -> Some id | _ -> None)
                   vs
                 |> List.sort_uniq compare
             | Wire.Int id -> [ id ]
             | _ -> []
           in
           let value_matches =
             if ref_ then
               if many && (match v' with Wire.Array _ | Wire.List _ | Wire.Set _ -> true | _ -> false)
               then existing_ids = new_ids
               else
                 (match Ldb.values block property_id with
                  | [ Ref id ] ->
                      (match v' with Wire.Int nid -> id = nid | _ -> false)
                  | _ -> false)
             else
               Ldb.value block property_id
               =
               (match v' with
                | Wire.Nil -> None
                | w -> Some (Ds_wire.value_of_transit w))
           in
           throw_error_if_self_value block v' ref_;
           if not value_matches then
             raw_set_block_property conn block property v'
         end
       end)
  |> ignore

(* upsert-property! *)
let upsert_property conn (property_id : string option) (schema : Wire.t)
    ~(property_name : string option) ~(properties : (string * Wire.t) list)
    : entity =
  let db = Datascript.db conn in
  let db_ident =
    match property_id with
    | Some p -> p
    | None ->
        (match property_name with
         | Some n ->
             (try Db_ident.create_user_property_ident_from_name n
              with _ ->
                raise
                  (Outliner_validate.Notification
                     (Wire.Map
                        [ (kw "type", kw "notification")
                        ; (kw "payload",
                           Wire.Map
                             [ (kw "message",
                                Wire.String
                                  "Property failed to create. Please try a \
                                   different property name.")
                             ; (kw "i18n-key", kw "property/create-error")
                             ; (kw "type", kw "error") ]) ])))
         | None -> failwith "property-id or property-name required")
  in
  if not (String.contains db_ident '/') then
    invalid_arg "db-ident must be qualified";
  (match Cljs_map.get schema "logseq.property/type",
         Cljs_map.get schema "db/cardinality" with
   | Some (Wire.Keyword "checkbox"), Some (Wire.Keyword "db.cardinality/many") ->
       failwith ":checkbox property doesn't allow multiple values"
   | _ -> ());
  match property_id, entity db (Ident db_ident) with
  | Some _, Some property ->
      update_property conn db_ident property schema ~property_name ~properties
  | _ ->
      let k_name =
        match property_name with
        | Some n -> n
        | None ->
            (match String.rindex_opt db_ident '/' with
             | Some i -> String.sub db_ident (i + 1) (String.length db_ident - i - 1)
             | None -> db_ident)
      in
      let db_ident' = Db_ident.ensure_unique_db_ident db db_ident in
      Outliner_validate.validate_page_title k_name;
      Outliner_validate.validate_page_title_characters k_name;
      Outliner_validate.validate_property_title k_name;
      let db_id =
        match Cljs_map.get (Wire.Map (List.map (fun (k, v) -> (Wire.Keyword k, v)) properties)) "db/id" with
        | Some (Wire.Int id) -> Some id
        | _ -> None
      in
      let block_uuid =
        match db_id with
        | Some id ->
            (match Ldb.ent_of_id db id with
             | Some e ->
                 (match Ldb.value e "block/uuid" with
                  | Some (Uuid u) -> Some u
                  | _ -> None)
             | None -> None)
        | None -> None
      in
      let new_property =
        Sqlite_util.build_new_property ~title:k_name ?block_uuid
          ~properties:
            (Wire.Map (List.map (fun (k, v) -> (Wire.Keyword k, v)) properties))
          db_ident'
          (match schema with Wire.Map _ -> schema | _ -> Wire.Map [])
      in
      let tx_data =
        [ new_property ]
        @ (match db_id with
           | Some id ->
               [ Wire.Array
                   [ kw "db/retract"; Wire.Int id; kw "block/tags"
                   ; kw "logseq.class/Page" ] ]
           | None -> [])
      in
      Db_transact.transact conn tx_data
        [ ("outliner-op", Keyword "upsert-property") ]
      |> ignore;
      (match entity (Datascript.db conn) (Ident db_ident') with
       | Some e -> e
       | None -> failwith "upsert-property failed to create entity")

(* batch-delete-property-value! *)
let batch_delete_property_value conn (block_eids : Wire.t list)
    (property_id : string) (property_value : Wire.t) : unit =
  let block_eids = List.map to_eid block_eids in
  Db_transact.batch_transact_with_temp_conn conn
    [ ("outliner-op", Keyword "batch-delete-property-value") ]
    (fun conn ->
       let db = Datascript.db conn in
       match entity db (Ident property_id) with
       | Some property when ent_many property ->
           let property_is_block =
             List.exists
               (fun e ->
                  match entity_of_eid db e with
                  | Some ent -> Ldb.ident_of ent = Some property_id
                  | None -> false)
               block_eids
           in
           if not property_is_block then begin
             (match property_value with
              | Wire.Int vid when property_id = "block/tags" ->
                  let ids =
                    List.filter_map
                      (fun e ->
                         match entity_of_eid db e with
                         | Some x -> Some x.id
                         | None -> None)
                      block_eids
                  in
                  Outliner_validate.validate_tags_property_deletion db ids vid
              | _ -> ());
             if property_id = "block/tags" then begin
               let tx_data =
                 List.map
                   (fun e ->
                      Wire.Array
                        [ kw "db/retract"; e; kw property_id; property_value ])
                   (List.filter_map
                      (fun e ->
                         match entity_of_eid db e with
                         | Some x -> Some (Wire.Int x.id)
                         | None -> None)
                      block_eids)
               in
               Db_transact.transact conn tx_data
                 [ ("outliner-op", Keyword "save-block") ]
               |> ignore
             end else
               List.iter
                 (fun e ->
                    match entity_of_eid db e with
                    | Some block ->
                        let current_val = Ldb.values block property_id in
                        let fv = List.nth_opt current_val 0 in
                        if
                          List.length current_val = 1
                          &&
                          (match fv, property_value with
                           | Some (Ref id), Wire.Int vid -> id = vid
                           | Some rv, _ ->
                               rv = Ds_wire.value_of_transit property_value
                           | _ -> false)
                        then
                          remove_block_property conn (Wire.Int block.id)
                            property_id
                        else
                          Db_transact.transact conn
                            [ Wire.Array
                                [ kw "db/retract"; Wire.Int block.id
                                ; kw property_id; property_value ] ]
                            [ ("outliner-op", Keyword "save-block") ]
                          |> ignore
                    | None -> ())
                 block_eids
           end
       | _ -> ())
  |> ignore

(* delete-property-value! *)
let delete_property_value conn (block_eid : Wire.t) (property_id : string)
    (property_value : Wire.t) : unit =
  batch_delete_property_value conn [ block_eid ] property_id property_value

(* build-closed-value-tx *)
let build_closed_value_tx db (property : entity) (resolved_value : Wire.t)
    ~(id : string option) ~(icon : Wire.t) ~(scoped_class_id : Wire.t) :
    Wire.t list =
  let block =
    match id with
    | Some u -> entity db (Lookup_ref ("block/uuid", Uuid u))
    | None -> None
  in
  let block_id =
    match id with Some u -> u | None -> Uuid_gen.uuid ()
  in
  let icon' =
    match icon with
    | Wire.String s when String.trim s = "" -> Wire.Nil
    | _ -> icon
  in
  let prop_type =
    match block with
    | Some b -> Ldb.string_value b "logseq.property/type"
    | None -> None
  in
  let value_key =
    match ent_property_type property with
    | Some t when List.mem t Db_schema.original_value_ref_property_types ->
        "logseq.property/value"
    | _ ->
        if Ldb.ident_of property = Some "logseq.property/default-value"
           && (match prop_type with
               | Some t -> List.mem t Db_schema.original_value_ref_property_types
               | None -> false)
        then "logseq.property/value"
        else "block/title"
  in
  let tx_data =
    match block with
    | Some _ ->
        let m =
          Wire.Map
            [ (kw "block/uuid", Wire.Uuid block_id)
            ; (kw "block/closed-value-property", Wire.Int property.id)
            ; (kw "block/updated-at",
               Wire.Int64 (Int64.of_float (Clock.now_ms ()))) ]
        in
        let m = Cljs_map.assoc m value_key resolved_value in
        let m =
          if icon' <> Wire.Nil then Cljs_map.assoc m "logseq.property/icon" icon'
          else m
        in
        [ m ]
    | None ->
        let max_order =
          match List.rev (closed_values_of property) with
          | last :: _ ->
              (match Ldb.value last "block/order" with
               | Some (String s) -> Some s
               | _ -> None)
          | [] -> None
        in
        let new_block =
          let m =
            Wire.Map
              [ (kw "block/uuid", Wire.Uuid block_id)
              ; (kw "block/page",
                 (match Ldb.ident_of property with
                  | Some i -> Wire.Keyword i
                  | None -> Wire.Int property.id))
              ; (kw "block/closed-value-property",
                 (match Ldb.ident_of property with
                  | Some i -> Wire.Keyword i
                  | None -> Wire.Int property.id))
              ; (kw "logseq.property/created-from-property",
                 (if
                    Ldb.ident_of property
                    = Some "logseq.property/default-value"
                  then Wire.Array [ kw "block/uuid"; Wire.Uuid block_id ]
                  else
                    match Ldb.ident_of property with
                    | Some i -> Wire.Keyword i
                    | None -> Wire.Int property.id))
              ; (kw "block/parent",
                 (match Ldb.ident_of property with
                  | Some i -> Wire.Keyword i
                  | None -> Wire.Int property.id)) ]
          in
          let m = Cljs_map.assoc m value_key resolved_value in
          let m =
            if icon' <> Wire.Nil then Cljs_map.assoc m "logseq.property/icon" icon'
            else m
          in
          let m = Sqlite_util.block_with_timestamps m in
          Cljs_map.assoc m "block/order"
            (Wire.String (Db_order.gen_key max_order None))
        in
        [ new_block
        ; Wire.Map
            [ (kw "db/id", Wire.Int property.id)
            ; (kw "block/updated-at",
               Wire.Int64 (Int64.of_float (Clock.now_ms ()))) ] ]
  in
  let tx_data' =
    match block with
    | Some b when icon' = Wire.Nil ->
        tx_data
        @ [ Wire.Array
              [ kw "db/retract"; Wire.Int b.id; kw "logseq.property/icon" ] ]
    | _ -> tx_data
  in
  tx_data'
  @ (if scoped_class_id <> Wire.Nil then
       [ Wire.Array
           [ kw "db/add"; Wire.Array [ kw "block/uuid"; Wire.Uuid block_id ]
           ; kw "logseq.property/choice-classes"; scoped_class_id ] ]
     else [])

(* upsert-closed-value! *)
let upsert_closed_value conn (property_id : string)
    ~(id : string option) ~(value : Wire.t) ~(description : string option)
    ~(scoped_class_id : Wire.t) : unit =
  let db = Datascript.db conn in
  let property =
    match entity db (Ident property_id) with
    | Some p -> p
    | None -> failwith ("Property " ^ property_id ^ " doesn't exist")
  in
  (match ent_property_type property with
   | Some t when List.mem t Db_schema.closed_value_property_types ->
       let value' =
         match value with Wire.String s -> Wire.String (String.trim s) | _ -> value
       in
       let resolved_value = convert_property_input_string None property value' in
       let validate_message =
         match Ds_wire.value_of_transit resolved_value with
         | exception _ -> Some "invalid"
         | rv ->
             validate_property_value_aux_value db ~new_closed_value:true
               property rv ~many:(ent_many property)
       in
       let exists =
         List.exists
           (fun (b : entity) ->
              let content =
                match Ldb.value b "logseq.property/value" with
                | Some v -> v
                | None ->
                    (match Ldb.string_value b "block/title" with
                     | Some t -> String t
                     | None -> Nil)
              in
              let content_str =
                match content with
                | String s -> s
                | v -> Ds_wire.edn_of_transit (Ds_wire.transit_of_value v)
              in
              let resolved_str =
                match resolved_value with
                | Wire.String s -> s
                | w -> Ds_wire.edn_of_transit w
              in
              content_str = resolved_str
              &&
              (match id, Ldb.value b "block/uuid" with
               | Some i, Some (Uuid u) -> i <> u
               | _ -> true))
           (closed_values_of property)
       in
       if exists then
         raise
           (Outliner_validate.Notification
              (Wire.Map
                 [ (kw "error", kw "value-exists")
                 ; (kw "type", kw "notification")
                 ; (kw "payload",
                    Wire.Map
                      [ (kw "message", Wire.String "Choice already exists.")
                      ; (kw "i18n-key", kw "property.choice/already-exists")
                      ; (kw "type", kw "warning") ]) ]));
       (match validate_message with
        | Some msg ->
            let vstr =
              match value' with Wire.String s -> s | _ -> ""
            in
            raise
              (Outliner_validate.Notification
                 (Wire.Map
                    [ (kw "error", kw "value-invalid")
                    ; (kw "type", kw "notification")
                    ; (kw "payload",
                       Wire.Map
                         [ (kw "message",
                            Wire.String
                              ("Invalid choice \"" ^ vstr
                               ^ "\" for this property: " ^ msg ^ "."))
                         ; (kw "i18n-key", kw "property.choice/invalid")
                         ; (kw "i18n-args",
                            Wire.Array
                              [ Wire.String vstr; Wire.String msg ])
                         ; (kw "type", kw "warning") ]) ]))
        | None -> ());
       (match resolved_value with
        | Wire.Nil -> ()
        | _ ->
            let tx_data =
              build_closed_value_tx db property resolved_value ~id
                ~icon:Wire.Nil ~scoped_class_id
            in
            ignore
              (Db_transact.batch_transact_with_temp_conn conn
              [ ("outliner-op", Keyword "upsert-closed-value") ]
              (fun conn ->
                 Db_transact.transact conn tx_data [] |> ignore;
                 match description with
                 | Some desc when String.trim desc <> "" ->
                     let existing_desc =
                       match id with
                       | Some u ->
                           (match
                              entity db (Lookup_ref ("block/uuid", Uuid u))
                            with
                            | Some e ->
                                Ldb.ref_ent e "logseq.property/description"
                            | None -> None)
                       | None -> None
                     in
                     (match existing_desc with
                      | Some de ->
                          Db_transact.transact conn
                            [ Cljs_map.assoc_list
                                (Wire.Map [ (kw "db/id", Wire.Int de.id) ])
                                [ "block/title", Wire.String desc
                                ; "block/updated-at",
                                  Wire.Int64
                                    (Int64.of_float (Clock.now_ms ())) ] ]
                            []
                          |> ignore
                      | None ->
                          let target =
                            match id with
                            | Some u -> u
                            | None ->
                                (match tx_data with
                                 | Wire.Map _ :: _ ->
                                     (match Cljs_map.get (List.hd tx_data) "block/uuid" with
                                      | Some (Wire.Uuid u) -> u
                                      | _ -> "")
                                 | _ -> "")
                          in
                          set_block_property conn
                            (Wire.Array [ kw "block/uuid"; Wire.Uuid target ])
                            "logseq.property/description"
                            (Wire.String desc))
                 | _ -> ())))
   | _ -> ())

(* add-existing-values-to-closed-values! *)
let add_existing_values_to_closed_values conn (property_id : string)
    (values : string list) : unit =
  let db = Datascript.db conn in
  match entity db (Ident property_id) with
  | Some property ->
      let values' = List.filter (fun s -> String.trim s <> "") values in
      (match values' with
       | [] -> ()
       | _ ->
           let ents =
             List.filter_map
               (fun u -> entity db (Lookup_ref ("block/uuid", Uuid u)))
               values'
           in
           if ents <> [] then begin
             let property_db_id = property.id in
             let value_tx =
               List.map
                 (fun (v : entity) ->
                    Wire.Map
                      [ (kw "db/id", Wire.Int v.id)
                      ; (kw "block/closed-value-property",
                         Wire.Int property_db_id)
                      ; (kw "block/parent", Wire.Int property_db_id)
                      ; (kw "block/page", Wire.Int property_db_id) ])
                 ents
             in
             let property_tx =
               Wire.Map
                 [ (kw "db/id", Wire.Int property_db_id)
                 ; (kw "block/updated-at",
                    Wire.Int64 (Int64.of_float (Clock.now_ms ()))) ]
             in
             Db_transact.transact conn (property_tx :: value_tx)
               [ ("outliner-op",
                  Keyword "add-existing-values-to-closed-values") ]
             |> ignore
           end)
  | None -> ()

(* delete-closed-value! *)
let delete_closed_value conn (property_id : string) (value_block_id : string)
    : unit =
  let db = Datascript.db conn in
  let property =
    match entity db (Ident property_id) with
    | Some p -> p
    | None -> failwith "Invalid property"
  in
  if not (Ldb.is_property property) then failwith "Invalid property";
  match entity db (Lookup_ref ("block/uuid", Uuid value_block_id)) with
  | Some value_block ->
      if Ldb.built_in value_block then
        raise
          (Outliner_validate.Notification
             (Wire.Map
                [ (kw "type", kw "notification")
                ; (kw "payload",
                   Wire.Map
                     [ (kw "message",
                        Wire.String
                          "The choice can't be deleted because it's built-in.")
                     ; (kw "i18n-key",
                        kw "property.choice/cant-delete-built-in")
                     ; (kw "type", kw "warning") ]) ]))
      else begin
        let tx_data =
          Outliner_blocks.delete_blocks db [ value_block ]
          @ [ Wire.Map
                [ (kw "db/id", Wire.Int property.id)
                ; (kw "block/updated-at",
                   Wire.Int64 (Int64.of_float (Clock.now_ms ()))) ] ]
        in
        Db_transact.transact conn tx_data
          [ ("outliner-op", Keyword "delete-closed-value") ]
        |> ignore
      end
  | None -> ()

(* class-add-property! / class-remove-property! resolve class-id via
   (d/entity @conn class-id), which accepts a db/ident keyword or a
   [:block/uuid] lookup-ref — op args arrive as uuid strings while direct
   calls pass ident strings. *)
let entity_of_class_id db (class_id : string) =
  match entity db (Ident class_id) with
  | Some _ as r -> r
  | None -> entity db (Lookup_ref ("block/uuid", Uuid class_id))

(* class-add-property! *)
let class_add_property conn (class_id : string) (property_id : string) : unit =
  let db = Datascript.db conn in
  if property_id <> "logseq.property/empty-placeholder" then
    match entity_of_class_id db class_id with
    | Some class_ ->
        if Ldb.is_class class_ then
          match entity db (Ident property_id) with
          | Some property when Ldb.is_property property ->
              Db_transact.transact conn
                [ Wire.Array
                    [ kw "db/add"; Wire.Int class_.id
                    ; kw "logseq.property.class/properties"; kw property_id ] ]
                [ ("outliner-op", Keyword "class-add-property") ]
              |> ignore
          | _ -> ()
        else failwith "Can't add a property to a block that isn't a class"
    | None -> ()

(* class-remove-property! *)
let class_remove_property conn (class_id : string) (property_id : string) : unit =
  let db = Datascript.db conn in
  match entity_of_class_id db class_id with
  | Some class_ when Ldb.is_class class_ ->
      (match entity db (Ident property_id) with
       | Some property when Ldb.is_property property ->
           if not (Db_class.built_in_class_property class_ property) then
             Db_transact.transact conn
               [ Wire.Array
                   [ kw "db/retract"; Wire.Int class_.id
                   ; kw "logseq.property.class/properties"; kw property_id ] ]
               [ ("outliner-op", Keyword "class-remove-property") ]
             |> ignore
       | _ -> ())
  | _ -> ()
