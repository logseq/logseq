(* logseq.db.frontend.property.type — property types, ref-type sets, and
   property value validators used by malli_schema's property-tuple
   validation. *)

open Datascript

(* ---------- type sets (cljs vars) ---------- *)

let internal_built_in_property_types =
  [ "keyword"; "map"; "coll"; "any"; "entity"; "class"; "page"; "property"
  ; "string"; "json"; "raw-number" ]

let user_built_in_property_types =
  [ "default"; "number"; "date"; "datetime"; "checkbox"; "url"; "node"; "asset" ]

let user_allowed_internal_property_types = [ "map"; "json"; "string" ]

let closed_value_property_types = [ "default"; "number"; "url" ]

let cardinality_property_types =
  [ "default"; "number"; "url"; "date"; "node"; "asset" ]

let default_value_ref_property_types = [ "default"; "number"; "checkbox" ]

let text_ref_property_types = [ "default"; "url"; "entity" ]

let original_value_ref_property_types = [ "number" ]

let value_ref_property_types =
  [ "default"; "url"; "number" ]

let user_ref_property_types =
  [ "date"; "node"; "asset"; "default"; "url"; "number" ]

let all_ref_property_types =
  [ "entity"; "class"; "page"; "property"; "date"; "node"; "asset"; "default"
  ; "url"; "number" ]

let property_types_with_db =
  [ "default"; "url"; "number"; "date"; "node"; "asset"; "entity"; "class"
  ; "property"; "page" ]

(* ---------- value shape predicates (cljs predicates) ---------- *)

let string_v = function String _ -> true | _ -> false
let number_v = function Int _ | Float _ -> true | _ -> false
let boolean_v = function Bool _ -> true | _ -> false
let keyword_v = function Keyword _ -> true | _ -> false
let map_v = function Map _ -> true | _ -> false
let coll_v = function
  | Map _ | Vector _ | List _ | Set _ | Tuple _ -> true
  | _ -> false
let some_v = function Nil -> false | _ -> true

(* db-property-type/url? — (new js/URL s) parseability; .-origin is only
   checked non-nil, which holds for every parsed URL. *)
let url (v : value) : bool =
  match v with String s -> Ns_util.url_parses s | _ -> false

(* db-property-type/macro-url? *)
let macro_url (v : value) : bool =
  match v with String s -> Macro_util.macro s | _ -> false

(* ---------- entity predicates ---------- *)

(* property values for ref types arrive as Ref eid (or Int eid in some
   paths); resolve to an entity_ref for d/entity. *)
let entity_ref_of_value = function
  | Ref id -> Some (Entity_id id)
  | Int id -> Some (Entity_id id)
  | Keyword s -> Some (Ident s)
  | _ -> None

let entity_of_value db (v : value) : entity option =
  match entity_ref_of_value v with
  | Some r -> entity db r
  | None -> None

let entity_v db (v : value) : bool = Option.is_some (entity_of_value db v)

let class_entity_v db (v : value) : bool =
  match entity_of_value db v with Some e -> Entity_util.is_class e | None -> false

let property_entity_v db (v : value) : bool =
  match entity_of_value db v with
  | Some e -> Entity_util.is_property e
  | None -> false

let page_entity_v db (v : value) : bool =
  match entity_of_value db v with Some e -> Entity_util.page e | None -> false

let node_entity_v db (v : value) : bool =
  match entity_of_value db v with
  | Some e -> Option.is_some (Ldb.string_value e "block/title")
  | None -> false

let asset_entity_v db (v : value) : bool =
  match entity_of_value db v with
  | Some e ->
      Option.is_some (Ldb.string_value e "block/title")
      && Ldb.has_tag e "logseq.class/Asset"
  | None -> false

let date_v db (v : value) : bool =
  match entity_of_value db v with
  | Some e ->
      Option.is_some (Ldb.string_value e "block/title") && Entity_util.journal e
  | None -> false

(* ---------- validators taking db + opts ---------- *)

type validate_opts =
  { new_closed_value : bool
  ; skip_strict_url_validate : bool }

let default_validate_opts =
  { new_closed_value = false; skip_strict_url_validate = false }

let number_entity db (v : value) (opts : validate_opts) : bool =
  if opts.new_closed_value then number_v v
  else
    match entity_of_value db v with
    | Some e -> number_v (Option.value ~default:Nil (Ldb.value e "logseq.property/value"))
    | None -> false

let text_entity db (v : value) (opts : validate_opts) : bool =
  if opts.new_closed_value then string_v v
  else
    match entity_of_value db v with
    | Some e ->
        Option.is_some (Ldb.string_value e "block/title")
        && Option.is_some (Ldb.value e "block/page")
    | None -> false

let url_entity db (v : value) (opts : validate_opts) : bool =
  if opts.new_closed_value then url v || macro_url v
  else
    match entity_of_value db v with
    | Some e ->
        (match Ldb.string_value e "block/title" with
         | None -> false
         | Some title ->
             if opts.skip_strict_url_validate then true
             else
               Unicode.trim title = "" || url (String title) || macro_url (String title))
    | None -> false

(* ---------- per-type schema-fn dispatch ---------- *)

(* The cljs :fn leaf of each built-in-validation-schemas entry, called
   with db (only for property-types-with-db types) and validate-options. *)
let validate_value ~type_ ~opts ~(db : db) (v : value) : bool =
  match type_ with
  | "default" -> text_entity db v opts
  | "number" -> number_entity db v opts
  | "date" -> date_v db v
  | "datetime" -> number_v v
  | "checkbox" -> boolean_v v
  | "url" -> url_entity db v opts
  | "node" -> node_entity_v db v
  | "asset" -> asset_entity_v db v
  | "string" -> string_v v
  | "json" -> string_v v
  | "raw-number" -> number_v v
  | "entity" -> entity_v db v
  | "class" -> class_entity_v db v
  | "property" -> property_entity_v db v
  | "page" -> page_entity_v db v
  | "keyword" -> keyword_v v
  | "map" -> map_v v
  | "coll" -> coll_v v
  | "any" -> some_v v
  | _ -> false

let needs_db (type_ : string) : bool = List.mem type_ property_types_with_db

let error_message_of_type (type_ : string) : string option =
  match type_ with
  | "default" -> Some "should be a text block"
  | "number" -> Some "should be a number"
  | "date" -> Some "should be a journal date"
  | "datetime" -> Some "should be a datetime"
  | "checkbox" -> Some "should be a boolean"
  | "url" -> Some "should be a URL"
  | "node" -> Some "should be a node with a title"
  | "asset" -> Some "should be an asset node"
  | "string" -> Some "should be a string"
  | "json" -> Some "should be JSON string"
  | "raw-number" -> Some "should be a raw number"
  | "entity" -> Some "should be an Entity"
  | "class" -> Some "should be a Class"
  | "property" -> Some "should be a Property"
  | "page" -> Some "should be a Page"
  | "keyword" -> Some "should be a Clojure keyword"
  | "map" -> Some "should be a Clojure map"
  | "coll" -> Some "should be a collection"
  | "any" -> None
  | _ -> None

(* ---------- helper fns ---------- *)

(* db-property-type/infer-property-type-from-value *)
let infer_property_type_from_value (v : value) : string =
  match v with
  | Int _ | Float _ -> "number"
  | String s when url (String s) -> "url"
  | Bool _ -> "checkbox"
  | _ -> "default"

(* db-property-type/property-value-content? — whether the property value
   should be stored in :logseq.property/value. `block_type` is the value's
   inferred schema type; `property` a map with :logseq.property/type and
   :db/ident. *)
let property_value_content ~(block_type : string)
    ~(property_type : string option) ~(property_ident : string option) : bool =
  let t = Option.value ~default:"" property_type in
  List.mem t original_value_ref_property_types
  || (Option.value ~default:"" property_ident = "logseq.property/default-value"
      && List.mem block_type original_value_ref_property_types)
