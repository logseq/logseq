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
