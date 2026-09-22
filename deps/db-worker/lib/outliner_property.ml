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
    | Ref id -> Some (Entity_id id)
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
  | Ref id -> Ldb.ent_of_id db id
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
