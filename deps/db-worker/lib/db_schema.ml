open Datascript

(* Static schema/property data ported from
   logseq.db.frontend.property, logseq.db.frontend.property.type and
   logseq.db.frontend.malli-schema. *)

(* property-type/internal-built-in-property-types *)
let internal_built_in_property_types =
  [ "keyword"; "map"; "coll"; "any"; "entity"; "class"; "page"; "property";
    "string"; "json"; "raw-number" ]

(* property-type/user-built-in-property-types *)
let user_built_in_property_types =
  [ "default"; "number"; "date"; "datetime"; "checkbox"; "url"; "node"; "asset" ]

(* property-type/user-allowed-internal-property-types *)
let user_allowed_internal_property_types = [ "map"; "json"; "string" ]

(* property-type/closed-value-property-types *)
let closed_value_property_types = [ "default"; "number"; "url" ]

(* property-type/cardinality-property-types *)
let cardinality_property_types =
  [ "default"; "number"; "url"; "date"; "node"; "asset" ]

(* property-type/default-value-ref-property-types *)
let default_value_ref_property_types = [ "default"; "number"; "checkbox" ]

(* property-type/text-ref-property-types *)
let text_ref_property_types = [ "default"; "url"; "entity" ]

(* property-type/original-value-ref-property-types *)
let original_value_ref_property_types = [ "number" ]

(* property-type/value-ref-property-types *)
let value_ref_property_types = [ "default"; "url"; "number" ]

(* property-type/user-ref-property-types *)
let user_ref_property_types =
  [ "date"; "node"; "asset"; "default"; "url"; "number" ]

(* property-type/all-ref-property-types *)
let all_ref_property_types =
  [ "entity"; "class"; "page"; "property"; "date"; "node"; "asset"; "default";
    "url"; "number" ]

(* db-property/db-attribute-properties *)
let db_attribute_properties =
  [ "block/alias"; "block/tags"; "block/parent"; "block/order";
    "block/collapsed?"; "block/page"; "block/refs"; "block/link"; "block/title";
    "block/closed-value-property"; "block/journal-day"; "block/created-at";
    "block/updated-at" ]

(* db-property/read-only-properties *)
let read_only_properties = [ "logseq.property/built-in?" ]

(* db-property/schema-properties *)
let schema_properties =
  [ "db/cardinality"; "logseq.property/type"; "logseq.property/hide?";
    "logseq.property/public?"; "logseq.property/view-context";
    "logseq.property/ui-position"; "logseq.property/classes" ]

(* db-property/logseq-property-namespaces *)
let logseq_property_namespaces =
  [ "logseq.property"; "logseq.property.tldraw"; "logseq.property.pdf";
    "logseq.property.fsrs"; "logseq.property.linked-references";
    "logseq.property.asset"; "logseq.property.table"; "logseq.property.node";
    "logseq.property.code"; "logseq.property.repeat"; "logseq.property.journal";
    "logseq.property.class"; "logseq.property.view"; "logseq.property.user";
    "logseq.property.history"; "logseq.property.reaction"; "logseq.property.sync";
    "logseq.property.publish"; "logseq.property.recycle";
    "logseq.property.comments"; "logseq.property.agent" ]

(* malli-schema/logseq-ident-namespaces *)
let logseq_ident_namespaces =
  "logseq.class" :: "logseq.kv" :: logseq_property_namespaces

(* malli-schema/internal-ident? *)
let internal_ident (ident : string) : bool =
  List.mem ident db_attribute_properties
  ||
  match String.index_opt ident '/' with
  | None -> false
  | Some i ->
      let ns = String.sub ident 0 i in
      List.mem ns logseq_ident_namespaces

(* db-property/private-db-attribute-properties *)
let private_db_attribute_properties =
  [ "block/parent"; "block/order"; "block/collapsed?"; "block/page";
    "block/refs"; "block/link"; "block/title"; "block/closed-value-property";
    "block/journal-day"; "block/created-at"; "block/updated-at" ]

(* db-property/public-db-attribute-properties *)
let public_db_attribute_properties = [ "block/alias"; "block/tags" ]

(* malli-schema/required-properties — :schema :required-properties
   across built-in-classes plus db-property's own set. *)
let required_properties =
  [ "logseq.property.asset/type"; "logseq.property.asset/size";
    "logseq.property.asset/checksum"; "logseq.property/created-from-property";
    "logseq.property/value"; "logseq.property.history/scalar-value";
    "logseq.property.history/block"; "logseq.property.history/property";
    "logseq.property.history/ref-value"; "logseq.property.class/extends";
    "logseq.property.reaction/emoji-id"; "logseq.property.reaction/target" ]

let mem (xs : string list) (x : string) : bool = List.mem x xs

(* db-schema/schema attribute partitions *)
let ref_type_attributes =
  [ "block/parent"; "block/page"; "block/refs"; "block/tags"; "block/link"
  ; "block/alias"; "block/closed-value-property" ]

let card_many_attributes =
  [ "block/refs"; "block/tags"; "block/alias"; "block/closed-value-property" ]

let card_many_ref_type_attributes =
  List.filter (fun a -> List.mem a ref_type_attributes) card_many_attributes

let card_one_ref_type_attributes =
  List.filter
    (fun a -> not (List.mem a card_many_attributes))
    ref_type_attributes

let db_non_ref_attributes =
  [ "db/ident"; "kv/value"; "block/uuid"; "block/order"; "block/collapsed?"
  ; "block/created-at"; "block/updated-at"; "block/name"; "block/title"
  ; "block/journal-day"; "block/tx-id"; "file/path"; "file/content"
  ; "file/created-at"; "file/last-modified-at"; "file/size" ]

(* db-schema/version *)
type schema_version = { sv_major : int; sv_minor : int option }

let version = { sv_major = 65; sv_minor = Some 33 }

(* db-schema/parse-schema-version — accepts int, "10.1", [10 1],
   {:major 10 :minor 1} *)
let parse_schema_version (v : value) : schema_version =
  match v with
  | Int n -> { sv_major = n; sv_minor = None }
  | Float f -> { sv_major = int_of_float f; sv_minor = None }
  | String s ->
      (match String.split_on_char '.' s with
       | [ maj; min ] ->
           { sv_major = int_of_string maj; sv_minor = Some (int_of_string min) }
       | [ maj ] -> { sv_major = int_of_string maj; sv_minor = None }
       | _ -> invalid_arg ("Not a schema-version: " ^ s))
  | Vector [ Int maj ] | List [ Int maj ] ->
      { sv_major = maj; sv_minor = None }
  | Vector [ Int maj; Int min ] | List [ Int maj; Int min ] ->
      { sv_major = maj; sv_minor = Some min }
  | Map kvs ->
      let get name =
        List.find_map
          (fun (k, v) ->
            match k, v with
            | (Keyword kk | String kk), Int i when kk = name -> Some i
            | _ -> None)
          kvs
      in
      (match get "major" with
       | Some maj -> { sv_major = maj; sv_minor = get "minor" }
       | None -> invalid_arg "Not a schema-version")
  | _ -> invalid_arg "Not a schema-version"

(* db-schema/compare-schema-version — compares [major minor] pairs *)
let compare_schema_version (x : schema_version) (y : schema_version) : int =
  let c = Int.compare x.sv_major y.sv_major in
  if c <> 0 then c
  else
    match x.sv_minor, y.sv_minor with
    | None, None -> 0
    | None, Some _ -> -1
    | Some _, None -> 1
    | Some a, Some b -> Int.compare a b

(* db-schema/major-version *)
let major_version (v : schema_version) : int = v.sv_major

(* db-schema/schema-version->string *)
let schema_version_to_string (v : schema_version) : string =
  match v.sv_minor with
  | Some min -> string_of_int v.sv_major ^ "." ^ string_of_int min
  | None -> string_of_int v.sv_major

(* db-frontend-schema/schema — the fixed db-attribute schema map.
   Value types only matter for :db.type/ref; the rest is metadata. *)
let db_schema_attrs =
  [ "db/ident"; "kv/value"; "block/uuid"; "block/parent"; "block/order";
    "block/collapsed?"; "block/page"; "block/refs"; "block/tags";
    "block/link"; "block/alias"; "block/created-at"; "block/updated-at";
    "block/name"; "block/title"; "block/journal-day"; "block/tx-id";
    "block/closed-value-property"; "file/path"; "file/content";
    "file/created-at"; "file/last-modified-at"; "file/size" ]

let db_schema_attr (a : string) : bool = List.mem a db_schema_attrs

let db_schema_ref_attrs =
  [ "block/parent"; "block/page"; "block/refs"; "block/tags"; "block/link";
    "block/alias"; "block/closed-value-property" ]

(* cljs db-schema/schema — the full fixed schema map as an EDN string for
   (d/create-conn db-schema/schema). *)
let schema_edn =
  "{:db/ident {:db/unique :db.unique/identity}
    :kv/value {}
    :block/uuid {:db/unique :db.unique/identity}
    :block/parent {:db/valueType :db.type/ref :db/index true}
    :block/order {:db/index true}
    :block/collapsed? {}
    :block/page {:db/valueType :db.type/ref :db/index true}
    :block/refs {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
    :block/tags {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
    :block/link {:db/valueType :db.type/ref :db/index true}
    :block/alias {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many :db/index true}
    :block/created-at {:db/index true}
    :block/updated-at {:db/index true}
    :block/name {:db/index true}
    :block/title {:db/index true}
    :block/journal-day {:db/index true}
    :block/tx-id {}
    :block/closed-value-property {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
    :file/path {:db/unique :db.unique/identity}
    :file/content {}
    :file/created-at {}
    :file/last-modified-at {}
    :file/size {}}"

let schema () : schema = Datascript.schema_of_edn_string schema_edn
