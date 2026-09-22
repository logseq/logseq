(* db-property/built-in-properties — extracted from
   deps/db/src/logseq/db/frontend/property.cljs (ident, :schema :type,
   :schema :properties keys). *)

let built_in_properties : (string * string * string list) list =
  [ ("logseq.property/type", "keyword", [  ])
  ; ("logseq.property/hide?", "checkbox", [  ])
  ; ("logseq.property/public?", "checkbox", [  ])
  ; ("logseq.property/view-context", "keyword", [  ])
  ; ("logseq.property/ui-position", "keyword", [  ])
  ; ("logseq.property/classes", "entity", [  ])
  ; ("logseq.property/value", "any", [  ])
  ; ("block/alias", "page", [  ])
  ; ("block/tags", "class", [  ])
  ; ("block/parent", "entity", [  ])
  ; ("block/order", "string", [  ])
  ; ("block/collapsed?", "checkbox", [  ])
  ; ("block/page", "entity", [  ])
  ; ("block/refs", "entity", [  ])
  ; ("block/link", "entity", [  ])
  ; ("block/title", "string", [  ])
  ; ("block/closed-value-property", "entity", [  ])
  ; ("block/journal-day", "raw-number", [  ])
  ; ("block/created-at", "datetime", [  ])
  ; ("block/updated-at", "datetime", [  ])
  ; ("logseq.property.node/display-type", "keyword", [  ])
  ; ("logseq.property/description", "default", [  ])
  ; ("logseq.property.code/lang", "string", [  ])
  ; ("logseq.property/default-value", "entity", [  ])
  ; ("logseq.property/scalar-default-value", "any", [  ])
  ; ("logseq.property.class/extends", "class", [ "logseq.property/description" ])
  ; ("logseq.property.class/properties", "property", [  ])
  ; ("logseq.property.class/bidirectional-property-title", "string", [  ])
  ; ("logseq.property.class/enable-bidirectional?", "checkbox", [ "logseq.property/description" ])
  ; ("logseq.property/hide-empty-value", "checkbox", [ "logseq.property/description" ])
  ; ("logseq.property.class/hide-from-node", "checkbox", [  ])
  ; ("logseq.property/query", "default", [  ])
  ; ("logseq.property/page-tags", "page", [ "logseq.property/description" ])
  ; ("logseq.property/background-color", "default", [  ])
  ; ("logseq.property/heading", "any", [  ])
  ; ("logseq.property/created-from-property", "entity", [  ])
  ; ("logseq.property/built-in?", "checkbox", [  ])
  ; ("logseq.property/asset", "entity", [  ])
  ; ("logseq.property/ls-type", "keyword", [  ])
  ; ("logseq.property.pdf/hl-type", "keyword", [  ])
  ; ("logseq.property.pdf/hl-color", "default", [  ])
  ; ("logseq.property.pdf/hl-page", "raw-number", [  ])
  ; ("logseq.property.pdf/hl-image", "entity", [  ])
  ; ("logseq.property.pdf/hl-value", "map", [  ])
  ; ("logseq.property/order-list-type", "default", [  ])
  ; ("logseq.property.linked-references/includes", "node", [  ])
  ; ("logseq.property.linked-references/excludes", "node", [  ])
  ; ("logseq.property.comments/blocks", "node", [  ])
  ; ("logseq.property.journal/title-format", "string", [  ])
  ; ("logseq.property/choice-checkbox-state", "checkbox", [  ])
  ; ("logseq.property/choice-classes", "class", [  ])
  ; ("logseq.property/choice-exclusions", "node", [  ])
  ; ("logseq.property/checkbox-display-properties", "property", [  ])
  ; ("logseq.property/status", "default", [ "logseq.property/hide-empty-value"; "logseq.property/default-value"; "logseq.property/status.todo"; "logseq.property/enable-history?" ])
  ; ("logseq.property/priority", "default", [ "logseq.property/hide-empty-value"; "logseq.property/enable-history?" ])
  ; ("logseq.property/deadline", "datetime", [ "logseq.property/hide-empty-value"; "logseq.property/description" ])
  ; ("logseq.property/scheduled", "datetime", [ "logseq.property/hide-empty-value"; "logseq.property/description" ])
  ; ("logseq.property.repeat/recur-unit", "default", [ "logseq.property/hide-empty-value"; "logseq.property/default-value" ])
  ; ("logseq.property.repeat/repeated?", "checkbox", [  ])
  ; ("logseq.property.repeat/repeat-type", "default", [ "logseq.property/hide-empty-value"; "logseq.property/default-value" ])
  ; ("logseq.property.repeat/temporal-property", "property", [  ])
  ; ("logseq.property.repeat/checked-property", "property", [  ])
  ; ("logseq.property/assignee", "node", [ "logseq.property/hide-empty-value" ])
  ; ("logseq.property/icon", "map}", [  ])
  ; ("logseq.property/publishing-public?", "checkbox", [  ])
  ; ("logseq.property.publish/published-url", "url", [  ])
  ; ("logseq.property/exclude-from-graph-view", "checkbox", [  ])
  ; ("logseq.property.view/type", "default", [ "logseq.property/default-value" ])
  ; ("logseq.property.view/feature-type", "keyword", [  ])
  ; ("logseq.property.view/group-by-property", "property", [  ])
  ; ("logseq.property.view/gallery-asset-property", "property", [  ])
  ; ("logseq.property.view/gallery-display-properties", "property", [  ])
  ; ("logseq.property.view/gallery-card-size", "keyword", [ "logseq.property/scalar-default-value" ])
  ; ("logseq.property.view/gallery-card-width", "raw-number", [  ])
  ; ("logseq.property.view/gallery-card-height", "raw-number", [  ])
  ; ("logseq.property.view/sort-groups-by-property", "property", [  ])
  ; ("logseq.property.view/sort-groups-desc?", "checkbox", [ "logseq.property/scalar-default-value" ])
  ; ("logseq.property.table/sorting", "coll", [  ])
  ; ("logseq.property.table/filters", "map", [  ])
  ; ("logseq.property.table/hidden-columns", "keyword", [  ])
  ; ("logseq.property.table/ordered-columns", "coll", [  ])
  ; ("logseq.property.table/sized-columns", "map", [  ])
  ; ("logseq.property.table/pinned-columns", "property", [  ])
  ; ("logseq.property/view-for", "node", [  ])
  ; ("logseq.property.asset/type", "string", [  ])
  ; ("logseq.property.asset/external-url", "string", [  ])
  ; ("logseq.property.asset/external-file-name", "string", [  ])
  ; ("logseq.property.asset/size", "raw-number", [  ])
  ; ("logseq.property.asset/width", "raw-number", [  ])
  ; ("logseq.property.asset/height", "raw-number", [  ])
  ; ("logseq.property.asset/checksum", "string", [  ])
  ; ("logseq.property.asset/last-visit-page", "raw-number", [  ])
  ; ("logseq.property.asset/remote-metadata", "map", [ "logseq.property/description" ])
  ; ("logseq.property.asset/resize-metadata", "map", [  ])
  ; ("logseq.property.asset/align", "keyword", [  ])
  ; ("logseq.property.fsrs/due", "datetime", [  ])
  ; ("logseq.property.fsrs/state", "map", [  ])
  ; ("logseq.property.user/name", "string", [  ])
  ; ("logseq.property.user/email", "string", [  ])
  ; ("logseq.property.user/avatar", "string", [  ])
  ; ("logseq.property/enable-history?", "checkbox", [ "logseq.property/description" ])
  ; ("logseq.property.history/block", "entity", [  ])
  ; ("logseq.property.history/property", "property", [  ])
  ; ("logseq.property.history/ref-value", "entity", [  ])
  ; ("logseq.property.history/scalar-value", "any", [  ])
  ; ("logseq.property/created-by-ref", "entity", [  ])
  ; ("logseq.property/deleted-at", "datetime", [  ])
  ; ("logseq.property/deleted-by-ref", "entity", [  ])
  ; ("logseq.property.recycle/original-parent", "node", [  ])
  ; ("logseq.property.recycle/original-page", "node", [  ])
  ; ("logseq.property.recycle/original-order", "string", [  ])
  ; ("logseq.property.reaction/emoji-id", "string", [  ])
  ; ("logseq.property.reaction/target", "node", [  ])
  ; ("logseq.property.agent/session-id", "string", [ "logseq.property/description" ])
  ; ("logseq.property/used-template", "node", [  ])
  ; ("logseq.property/template-applied-to", "class", [  ])
  ; ("logseq.property.sync/large-title-object", "map", [  ])
  ]

let built_in_property_schema_type (ident : string) : string option =
  match
    List.find_opt (fun (i, _, _) -> i = ident) built_in_properties
  with
  | Some (_, t, _) -> Some t
  | None -> None

(* db-property/built-in-properties :queryable? — only these 20 idents
   carry :queryable? true in the cljs spec map; all others are absent or
   false (both falsy). *)
let built_in_property_queryable (ident : string) : bool =
  List.mem ident
    [ "logseq.property/value"; "logseq.property.node/display-type"
    ; "logseq.property.code/lang"; "logseq.property.class/extends"
    ; "logseq.property/heading"; "logseq.property/status"
    ; "logseq.property/deadline"; "logseq.property/scheduled"
    ; "logseq.property.repeat/recur-unit"
    ; "logseq.property.repeat/repeat-type"; "logseq.property/assignee"
    ; "logseq.property.view/type"
    ; "logseq.property.view/group-by-property"; "logseq.property.asset/type"
    ; "logseq.property.asset/external-url"; "logseq.property.asset/size"
    ; "logseq.property.asset/width"; "logseq.property.asset/height"
    ; "logseq.property/created-by-ref"
    ; "logseq.property/template-applied-to" ]

(* db-property/built-in-has-ref-value? *)
let built_in_has_ref_value (db_ident : string) : bool =
  match built_in_property_schema_type db_ident with
  | Some t -> List.mem t Db_schema.value_ref_property_types
  | None -> false

(* outliner-property/built-in-class-property->properties — each built-in
   class's :properties keys + :block/tags, plus the same for each
   built-in property. *)
let built_in_class_property_to_properties : (string * string) list =
  let class_side = Db_class.built_in_class_property_pairs in
  let property_side =
    List.concat_map
      (fun (ident, _typ, props) ->
         List.map (fun p -> (ident, p)) ("block/tags" :: props))
      built_in_properties
  in
  class_side @ property_side

let is_protected_property_pair (entity_ident : string) (property_ident : string)
    : bool =
  List.mem (entity_ident, property_ident) built_in_class_property_to_properties
