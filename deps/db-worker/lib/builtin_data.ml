(* logseq.db.frontend.property/built-in-properties and
   logseq.db.frontend.class/built-in-classes — the full static tables that
   seed a brand-new DB graph, extracted 1:1 from the cljs files.

   Representation: one record per entry (see builtin_property / builtin_class).
   - [schema] keeps the cljs :schema map's SIMPLE keyword names
     ("type", "cardinality", "public?", ...) as attr strings;
     sqlite_create_graph requalifies them via schema->qualified-property-keyword.
   - [properties] keeps the cljs :properties map's QUALIFIED attr names.
   - closed_values carry [cv_uuid_seed] (the :db-ident the cljs passes to
     common-uuid/gen-uuid :db-ident-block-uuid) instead of a materialized
     uuid, plus [cv_db_ident]/[cv_icon]/[cv_schema]/[cv_properties] mirroring
     the cljs keys :db-ident/:icon/:schema/:properties.
   - [rtc_ignore] mirrors :rtc {:rtc/ignore-attr-when-syncing true};
     unused by create-graph tx but part of the table contract.
   - Keyword values stay Datascript.Keyword; attrs that hold cljs keyword
     values under ref attrs resolve through datascript's ident resolution at
     transact time, same as the cljs tx. *)

open Datascript

type builtin_closed_value =
  { cv_value : value
  ; cv_db_ident : string option
  ; cv_uuid_seed : string option
  ; cv_icon : (attr * value) list option
  ; cv_schema : (attr * value) list option
  ; cv_properties : (attr * value) list option
  }

type builtin_property =
  { ident : string
  ; title : string option
  ; attribute : string option
  ; schema : (attr * value) list
  ; queryable : bool option
  ; closed_values : builtin_closed_value list
  ; rtc_ignore : bool
  ; properties : (attr * value) list
  }

type builtin_class =
  { c_ident : string
  ; c_title : string option
  ; c_schema_properties : string list
  ; c_schema_required_properties : string list
  ; c_properties : (attr * value) list
  }

(* frontend.property/built-in-properties — all 118 entries, table order. *)
let built_in_properties : builtin_property list =
  [
    { ident = "logseq.property/type"
    ; title = Some "Property type"
    ; attribute = None
    ; schema = [ "type", Keyword "keyword"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/hide?"
    ; title = Some "Hide this property or page"
    ; attribute = None
    ; schema = [ "type", Keyword "checkbox"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/public?"
    ; title = Some "Property public?"
    ; attribute = None
    ; schema = [ "type", Keyword "checkbox"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/view-context"
    ; title = Some "Property view context"
    ; attribute = None
    ; schema = [ "type", Keyword "keyword"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/ui-position"
    ; title = Some "Property position"
    ; attribute = None
    ; schema = [ "type", Keyword "keyword"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/classes"
    ; title = Some "Property classes"
    ; attribute = None
    ; schema = [ "type", Keyword "entity"
      ; "cardinality", Keyword "many"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/value"
    ; title = Some "Property value"
    ; attribute = None
    ; schema = [ "type", Keyword "any"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "block/alias"
    ; title = Some "Alias"
    ; attribute = Some "block/alias"
    ; schema = [ "type", Keyword "page"
      ; "cardinality", Keyword "many"
      ; "view-context", Keyword "page"
      ; "public?", Bool true ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "block/tags"
    ; title = Some "Tags"
    ; attribute = Some "block/tags"
    ; schema = [ "type", Keyword "class"
      ; "cardinality", Keyword "many"
      ; "public?", Bool true ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "block/parent"
    ; title = Some "Node parent"
    ; attribute = Some "block/parent"
    ; schema = [ "type", Keyword "entity"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "block/order"
    ; title = Some "Node order"
    ; attribute = Some "block/order"
    ; schema = [ "type", Keyword "string"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "block/collapsed?"
    ; title = Some "Node collapsed?"
    ; attribute = Some "block/collapsed?"
    ; schema = [ "type", Keyword "checkbox"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "block/page"
    ; title = Some "Node page"
    ; attribute = Some "block/page"
    ; schema = [ "type", Keyword "entity"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "block/refs"
    ; title = Some "Node references"
    ; attribute = Some "block/refs"
    ; schema = [ "type", Keyword "entity"
      ; "cardinality", Keyword "many"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "block/link"
    ; title = Some "Node links to"
    ; attribute = Some "block/link"
    ; schema = [ "type", Keyword "entity"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "block/title"
    ; title = Some "Node title"
    ; attribute = Some "block/title"
    ; schema = [ "type", Keyword "string"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "block/closed-value-property"
    ; title = Some "Closed value property"
    ; attribute = Some "block/closed-value-property"
    ; schema = [ "type", Keyword "entity"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "block/journal-day"
    ; title = Some "Journal date"
    ; attribute = Some "block/journal-day"
    ; schema = [ "type", Keyword "raw-number"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "block/created-at"
    ; title = Some "Node created at"
    ; attribute = Some "block/created-at"
    ; schema = [ "type", Keyword "datetime"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "block/updated-at"
    ; title = Some "Node updated at"
    ; attribute = Some "block/updated-at"
    ; schema = [ "type", Keyword "datetime"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.node/display-type"
    ; title = Some "Node Display Type"
    ; attribute = None
    ; schema = [ "type", Keyword "keyword"
      ; "public?", Bool false
      ; "hide?", Bool true
      ; "view-context", Keyword "block" ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/description"
    ; title = Some "Description"
    ; attribute = None
    ; schema = [ "type", Keyword "default"
      ; "public?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.code/lang"
    ; title = Some "Code Mode"
    ; attribute = None
    ; schema = [ "type", Keyword "string"
      ; "public?", Bool false
      ; "hide?", Bool true
      ; "view-context", Keyword "block" ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/default-value"
    ; title = Some "Default value"
    ; attribute = None
    ; schema = [ "type", Keyword "entity"
      ; "public?", Bool false
      ; "hide?", Bool true
      ; "view-context", Keyword "property" ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/scalar-default-value"
    ; title = Some "Non ref type default value"
    ; attribute = None
    ; schema = [ "type", Keyword "any"
      ; "public?", Bool false
      ; "hide?", Bool true
      ; "view-context", Keyword "property" ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.class/extends"
    ; title = Some "Extends"
    ; attribute = None
    ; schema = [ "type", Keyword "class"
      ; "cardinality", Keyword "many"
      ; "public?", Bool true
      ; "view-context", Keyword "class" ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = [ "logseq.property/description", String "This enables tags to inherit properties from other tags" ]
    }
  ;
    { ident = "logseq.property.class/properties"
    ; title = Some "Tag Properties"
    ; attribute = None
    ; schema = [ "type", Keyword "property"
      ; "cardinality", Keyword "many"
      ; "public?", Bool true
      ; "view-context", Keyword "never" ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.class/bidirectional-property-title"
    ; title = Some "Bidirectional property title"
    ; attribute = None
    ; schema = [ "type", Keyword "string"
      ; "public?", Bool true
      ; "view-context", Keyword "class" ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.class/enable-bidirectional?"
    ; title = Some "Enable bidirectional properties"
    ; attribute = None
    ; schema = [ "type", Keyword "checkbox"
      ; "public?", Bool true
      ; "view-context", Keyword "class" ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = [ "logseq.property/description", String "When enabled, this tag will show reverse nodes that link to the current node via properties." ]
    }
  ;
    { ident = "logseq.property/hide-empty-value"
    ; title = Some "Hide empty value"
    ; attribute = None
    ; schema = [ "type", Keyword "checkbox"
      ; "public?", Bool true
      ; "view-context", Keyword "property" ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = [ "logseq.property/description", String "Hides a property's value on any node when empty e.g. when a property appears on a node through a tag." ]
    }
  ;
    { ident = "logseq.property.class/hide-from-node"
    ; title = Some "Hide from Node"
    ; attribute = None
    ; schema = [ "type", Keyword "checkbox"
      ; "public?", Bool true
      ; "view-context", Keyword "class" ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/query"
    ; title = Some "Query"
    ; attribute = None
    ; schema = [ "type", Keyword "default"
      ; "public?", Bool true
      ; "hide?", Bool true
      ; "view-context", Keyword "block" ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/page-tags"
    ; title = Some "Page Tags"
    ; attribute = None
    ; schema = [ "type", Keyword "page"
      ; "public?", Bool true
      ; "view-context", Keyword "page"
      ; "cardinality", Keyword "many" ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = [ "logseq.property/description", String "Provides a way for a page to associate to another page i.e. backward compatible tagging." ]
    }
  ;
    { ident = "logseq.property/background-color"
    ; title = Some "Background color"
    ; attribute = None
    ; schema = [ "type", Keyword "default"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/heading"
    ; title = Some "Heading"
    ; attribute = None
    ; schema = [ "type", Keyword "any"
      ; "hide?", Bool true ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/created-from-property"
    ; title = Some "Created from property"
    ; attribute = None
    ; schema = [ "type", Keyword "entity"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/built-in?"
    ; title = Some "Built in?"
    ; attribute = None
    ; schema = [ "type", Keyword "checkbox"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/asset"
    ; title = Some "Asset"
    ; attribute = None
    ; schema = [ "type", Keyword "entity"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/ls-type"
    ; title = None
    ; attribute = None
    ; schema = [ "type", Keyword "keyword"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.pdf/hl-type"
    ; title = Some "Annotation type"
    ; attribute = None
    ; schema = [ "type", Keyword "keyword"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.pdf/hl-color"
    ; title = Some "Annotation color"
    ; attribute = None
    ; schema = [ "type", Keyword "default"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values =
        [
          { cv_value = String "yellow"
          ; cv_db_ident = Some "logseq.property/color.yellow"
          ; cv_uuid_seed = Some "logseq.property/color.yellow"
          ; cv_icon = None
          ; cv_schema = None
          ; cv_properties = None
          }
        ;
          { cv_value = String "red"
          ; cv_db_ident = Some "logseq.property/color.red"
          ; cv_uuid_seed = Some "logseq.property/color.red"
          ; cv_icon = None
          ; cv_schema = None
          ; cv_properties = None
          }
        ;
          { cv_value = String "green"
          ; cv_db_ident = Some "logseq.property/color.green"
          ; cv_uuid_seed = Some "logseq.property/color.green"
          ; cv_icon = None
          ; cv_schema = None
          ; cv_properties = None
          }
        ;
          { cv_value = String "blue"
          ; cv_db_ident = Some "logseq.property/color.blue"
          ; cv_uuid_seed = Some "logseq.property/color.blue"
          ; cv_icon = None
          ; cv_schema = None
          ; cv_properties = None
          }
        ;
          { cv_value = String "purple"
          ; cv_db_ident = Some "logseq.property/color.purple"
          ; cv_uuid_seed = Some "logseq.property/color.purple"
          ; cv_icon = None
          ; cv_schema = None
          ; cv_properties = None
          }

        ]
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.pdf/hl-page"
    ; title = Some "Annotation page"
    ; attribute = None
    ; schema = [ "type", Keyword "raw-number"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.pdf/hl-image"
    ; title = Some "Annotation image"
    ; attribute = None
    ; schema = [ "type", Keyword "entity"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.pdf/hl-value"
    ; title = Some "Annotation data"
    ; attribute = None
    ; schema = [ "type", Keyword "map"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/order-list-type"
    ; title = Some "List type"
    ; attribute = None
    ; schema = [ "type", Keyword "default"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.linked-references/includes"
    ; title = Some "Included references"
    ; attribute = None
    ; schema = [ "type", Keyword "node"
      ; "cardinality", Keyword "many"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.linked-references/excludes"
    ; title = Some "Excluded references"
    ; attribute = None
    ; schema = [ "type", Keyword "node"
      ; "cardinality", Keyword "many"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.comments/blocks"
    ; title = Some "Commented blocks"
    ; attribute = None
    ; schema = [ "type", Keyword "node"
      ; "cardinality", Keyword "many"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.journal/title-format"
    ; title = Some "Title Format"
    ; attribute = None
    ; schema = [ "type", Keyword "string"
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/choice-checkbox-state"
    ; title = Some "Choice checkbox state"
    ; attribute = None
    ; schema = [ "type", Keyword "checkbox"
      ; "hide?", Bool true ]
    ; queryable = Some false
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/choice-classes"
    ; title = Some "Choice classes"
    ; attribute = None
    ; schema = [ "type", Keyword "class"
      ; "cardinality", Keyword "many"
      ; "public?", Bool false
      ; "hide?", Bool true
      ; "view-context", Keyword "never" ]
    ; queryable = Some false
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/choice-exclusions"
    ; title = Some "Choice exclusions"
    ; attribute = None
    ; schema = [ "type", Keyword "node"
      ; "cardinality", Keyword "many"
      ; "public?", Bool false
      ; "hide?", Bool true
      ; "view-context", Keyword "never" ]
    ; queryable = Some false
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/checkbox-display-properties"
    ; title = Some "Properties displayed as checkbox"
    ; attribute = None
    ; schema = [ "type", Keyword "property"
      ; "cardinality", Keyword "many"
      ; "hide?", Bool true ]
    ; queryable = Some false
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/status"
    ; title = Some "Status"
    ; attribute = None
    ; schema = [ "type", Keyword "default"
      ; "public?", Bool true
      ; "ui-position", Keyword "block-left" ]
    ; queryable = Some true
    ; closed_values =
        [
          { cv_value = String "Backlog"
          ; cv_db_ident = Some "logseq.property/status.backlog"
          ; cv_uuid_seed = Some "logseq.property/status.backlog"
          ; cv_icon = Some [ "type", Keyword "tabler-icon"
            ; "id", String "Backlog" ]
          ; cv_schema = None
          ; cv_properties = None
          }
        ;
          { cv_value = String "Todo"
          ; cv_db_ident = Some "logseq.property/status.todo"
          ; cv_uuid_seed = Some "logseq.property/status.todo"
          ; cv_icon = Some [ "type", Keyword "tabler-icon"
            ; "id", String "Todo" ]
          ; cv_schema = None
          ; cv_properties = Some [ "logseq.property/choice-checkbox-state", Bool false ]
          }
        ;
          { cv_value = String "Doing"
          ; cv_db_ident = Some "logseq.property/status.doing"
          ; cv_uuid_seed = Some "logseq.property/status.doing"
          ; cv_icon = Some [ "type", Keyword "tabler-icon"
            ; "id", String "InProgress50" ]
          ; cv_schema = None
          ; cv_properties = None
          }
        ;
          { cv_value = String "In Review"
          ; cv_db_ident = Some "logseq.property/status.in-review"
          ; cv_uuid_seed = Some "logseq.property/status.in-review"
          ; cv_icon = Some [ "type", Keyword "tabler-icon"
            ; "id", String "InReview" ]
          ; cv_schema = None
          ; cv_properties = None
          }
        ;
          { cv_value = String "Done"
          ; cv_db_ident = Some "logseq.property/status.done"
          ; cv_uuid_seed = Some "logseq.property/status.done"
          ; cv_icon = Some [ "type", Keyword "tabler-icon"
            ; "id", String "Done" ]
          ; cv_schema = None
          ; cv_properties = Some [ "logseq.property/choice-checkbox-state", Bool true ]
          }
        ;
          { cv_value = String "Canceled"
          ; cv_db_ident = Some "logseq.property/status.canceled"
          ; cv_uuid_seed = Some "logseq.property/status.canceled"
          ; cv_icon = Some [ "type", Keyword "tabler-icon"
            ; "id", String "Cancelled" ]
          ; cv_schema = None
          ; cv_properties = None
          }

        ]
    ; rtc_ignore = false
    ; properties = [ "logseq.property/hide-empty-value", Bool true
      ; "logseq.property/default-value", Keyword "logseq.property/status.todo"
      ; "logseq.property/enable-history?", Bool true ]
    }
  ;
    { ident = "logseq.property/priority"
    ; title = Some "Priority"
    ; attribute = None
    ; schema = [ "type", Keyword "default"
      ; "public?", Bool true
      ; "ui-position", Keyword "block-left" ]
    ; queryable = None
    ; closed_values =
        [
          { cv_value = String "Low"
          ; cv_db_ident = Some "logseq.property/priority.low"
          ; cv_uuid_seed = Some "logseq.property/priority.low"
          ; cv_icon = Some [ "type", Keyword "tabler-icon"
            ; "id", String "priorityLvlLow" ]
          ; cv_schema = None
          ; cv_properties = None
          }
        ;
          { cv_value = String "Medium"
          ; cv_db_ident = Some "logseq.property/priority.medium"
          ; cv_uuid_seed = Some "logseq.property/priority.medium"
          ; cv_icon = Some [ "type", Keyword "tabler-icon"
            ; "id", String "priorityLvlMedium" ]
          ; cv_schema = None
          ; cv_properties = None
          }
        ;
          { cv_value = String "High"
          ; cv_db_ident = Some "logseq.property/priority.high"
          ; cv_uuid_seed = Some "logseq.property/priority.high"
          ; cv_icon = Some [ "type", Keyword "tabler-icon"
            ; "id", String "priorityLvlHigh" ]
          ; cv_schema = None
          ; cv_properties = None
          }
        ;
          { cv_value = String "Urgent"
          ; cv_db_ident = Some "logseq.property/priority.urgent"
          ; cv_uuid_seed = Some "logseq.property/priority.urgent"
          ; cv_icon = Some [ "type", Keyword "tabler-icon"
            ; "id", String "priorityLvlUrgent" ]
          ; cv_schema = None
          ; cv_properties = None
          }

        ]
    ; rtc_ignore = false
    ; properties = [ "logseq.property/hide-empty-value", Bool true
      ; "logseq.property/enable-history?", Bool true ]
    }
  ;
    { ident = "logseq.property/deadline"
    ; title = Some "Deadline"
    ; attribute = None
    ; schema = [ "type", Keyword "datetime"
      ; "public?", Bool true
      ; "ui-position", Keyword "block-below" ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = [ "logseq.property/hide-empty-value", Bool true
      ; "logseq.property/description", String "Use it to finish something at a specific date(time)." ]
    }
  ;
    { ident = "logseq.property/scheduled"
    ; title = Some "Scheduled"
    ; attribute = None
    ; schema = [ "type", Keyword "datetime"
      ; "public?", Bool true
      ; "ui-position", Keyword "block-below" ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = [ "logseq.property/hide-empty-value", Bool true
      ; "logseq.property/description", String "Use it to plan something to start at a specific date(time)." ]
    }
  ;
    { ident = "logseq.property.repeat/recur-frequency"
    ; title = Some "Repeating recur frequency"
    ; attribute = None
    ; schema = [ "type", Keyword "number"
      ; "public?", Bool false ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = [ "logseq.property/hide-empty-value", Bool true
      ; "logseq.property/default-value", Int 1 ]
    }
  ;
    { ident = "logseq.property.repeat/recur-unit"
    ; title = Some "Repeating recur unit"
    ; attribute = None
    ; schema = [ "type", Keyword "default"
      ; "public?", Bool false ]
    ; queryable = Some true
    ; closed_values =
        [
          { cv_value = String "Minute"
          ; cv_db_ident = Some "logseq.property.repeat/recur-unit.minute"
          ; cv_uuid_seed = Some "logseq.property.repeat/recur-unit.minute"
          ; cv_icon = None
          ; cv_schema = None
          ; cv_properties = None
          }
        ;
          { cv_value = String "Hour"
          ; cv_db_ident = Some "logseq.property.repeat/recur-unit.hour"
          ; cv_uuid_seed = Some "logseq.property.repeat/recur-unit.hour"
          ; cv_icon = None
          ; cv_schema = None
          ; cv_properties = None
          }
        ;
          { cv_value = String "Day"
          ; cv_db_ident = Some "logseq.property.repeat/recur-unit.day"
          ; cv_uuid_seed = Some "logseq.property.repeat/recur-unit.day"
          ; cv_icon = None
          ; cv_schema = None
          ; cv_properties = None
          }
        ;
          { cv_value = String "Week"
          ; cv_db_ident = Some "logseq.property.repeat/recur-unit.week"
          ; cv_uuid_seed = Some "logseq.property.repeat/recur-unit.week"
          ; cv_icon = None
          ; cv_schema = None
          ; cv_properties = None
          }
        ;
          { cv_value = String "Month"
          ; cv_db_ident = Some "logseq.property.repeat/recur-unit.month"
          ; cv_uuid_seed = Some "logseq.property.repeat/recur-unit.month"
          ; cv_icon = None
          ; cv_schema = None
          ; cv_properties = None
          }
        ;
          { cv_value = String "Year"
          ; cv_db_ident = Some "logseq.property.repeat/recur-unit.year"
          ; cv_uuid_seed = Some "logseq.property.repeat/recur-unit.year"
          ; cv_icon = None
          ; cv_schema = None
          ; cv_properties = None
          }

        ]
    ; rtc_ignore = false
    ; properties = [ "logseq.property/hide-empty-value", Bool true
      ; "logseq.property/default-value", Keyword "logseq.property.repeat/recur-unit.day" ]
    }
  ;
    { ident = "logseq.property.repeat/repeated?"
    ; title = Some "Node Repeats?"
    ; attribute = None
    ; schema = [ "type", Keyword "checkbox"
      ; "hide?", Bool true ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.repeat/repeat-type"
    ; title = Some "Repeating type"
    ; attribute = None
    ; schema = [ "type", Keyword "default"
      ; "public?", Bool false ]
    ; queryable = Some true
    ; closed_values =
        [
          { cv_value = String "Advance from completion"
          ; cv_db_ident = Some "logseq.property.repeat/repeat-type.dotted-plus"
          ; cv_uuid_seed = Some "logseq.property.repeat/repeat-type.dotted-plus"
          ; cv_icon = None
          ; cv_schema = None
          ; cv_properties = None
          }
        ;
          { cv_value = String "Advance from scheduled"
          ; cv_db_ident = Some "logseq.property.repeat/repeat-type.plus"
          ; cv_uuid_seed = Some "logseq.property.repeat/repeat-type.plus"
          ; cv_icon = None
          ; cv_schema = None
          ; cv_properties = None
          }
        ;
          { cv_value = String "Advance from scheduled, skip to future"
          ; cv_db_ident = Some "logseq.property.repeat/repeat-type.double-plus"
          ; cv_uuid_seed = Some "logseq.property.repeat/repeat-type.double-plus"
          ; cv_icon = None
          ; cv_schema = None
          ; cv_properties = None
          }

        ]
    ; rtc_ignore = false
    ; properties = [ "logseq.property/hide-empty-value", Bool true
      ; "logseq.property/default-value", Keyword "logseq.property.repeat/repeat-type.double-plus" ]
    }
  ;
    { ident = "logseq.property.repeat/temporal-property"
    ; title = Some "Repeating Temporal Property"
    ; attribute = None
    ; schema = [ "type", Keyword "property"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.repeat/checked-property"
    ; title = Some "Repeating Checked Property"
    ; attribute = None
    ; schema = [ "type", Keyword "property"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/assignee"
    ; title = Some "Assignee"
    ; attribute = None
    ; schema = [ "type", Keyword "node"
      ; "cardinality", Keyword "many"
      ; "public?", Bool true
      ; "ui-position", Keyword "block-below"
      ; "classes", Set [Keyword "logseq.class/Page"] ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = [ "logseq.property/hide-empty-value", Bool true ]
    }
  ;
    { ident = "logseq.property/icon"
    ; title = Some "Icon"
    ; attribute = None
    ; schema = [ "type", Keyword "map" ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/publishing-public?"
    ; title = Some "Publishing Public?"
    ; attribute = None
    ; schema = [ "type", Keyword "checkbox"
      ; "hide?", Bool true
      ; "view-context", Keyword "page"
      ; "public?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.publish/published-url"
    ; title = Some "Published URL"
    ; attribute = None
    ; schema = [ "type", Keyword "url"
      ; "view-context", Keyword "page"
      ; "public?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/exclude-from-graph-view"
    ; title = Some "Excluded from Graph view?"
    ; attribute = None
    ; schema = [ "type", Keyword "checkbox"
      ; "hide?", Bool true
      ; "view-context", Keyword "page"
      ; "public?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.view/type"
    ; title = Some "View Type"
    ; attribute = None
    ; schema = [ "type", Keyword "default"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = Some true
    ; closed_values =
        [
          { cv_value = String "Table View"
          ; cv_db_ident = Some "logseq.property.view/type.table"
          ; cv_uuid_seed = Some "logseq.property.view/type.table"
          ; cv_icon = Some [ "type", Keyword "tabler-icon"
            ; "id", String "table" ]
          ; cv_schema = None
          ; cv_properties = None
          }
        ;
          { cv_value = String "List View"
          ; cv_db_ident = Some "logseq.property.view/type.list"
          ; cv_uuid_seed = Some "logseq.property.view/type.list"
          ; cv_icon = Some [ "type", Keyword "tabler-icon"
            ; "id", String "list" ]
          ; cv_schema = None
          ; cv_properties = None
          }
        ;
          { cv_value = String "Gallery View"
          ; cv_db_ident = Some "logseq.property.view/type.gallery"
          ; cv_uuid_seed = Some "logseq.property.view/type.gallery"
          ; cv_icon = Some [ "type", Keyword "tabler-icon"
            ; "id", String "layout-grid" ]
          ; cv_schema = None
          ; cv_properties = None
          }

        ]
    ; rtc_ignore = false
    ; properties = [ "logseq.property/default-value", Keyword "logseq.property.view/type.table" ]
    }
  ;
    { ident = "logseq.property.view/feature-type"
    ; title = Some "View Feature Type"
    ; attribute = None
    ; schema = [ "type", Keyword "keyword"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = Some false
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.view/group-by-property"
    ; title = Some "View group by property"
    ; attribute = None
    ; schema = [ "type", Keyword "property"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.view/gallery-asset-property"
    ; title = Some "Gallery asset property"
    ; attribute = None
    ; schema = [ "type", Keyword "property"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.view/gallery-display-properties"
    ; title = Some "Gallery display properties"
    ; attribute = None
    ; schema = [ "type", Keyword "property"
      ; "cardinality", Keyword "many"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.view/gallery-card-size"
    ; title = Some "Gallery card size"
    ; attribute = None
    ; schema = [ "type", Keyword "keyword"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = true
    ; properties = [ "logseq.property/scalar-default-value", Keyword "default" ]
    }
  ;
    { ident = "logseq.property.view/gallery-card-width"
    ; title = Some "Gallery card width"
    ; attribute = None
    ; schema = [ "type", Keyword "raw-number"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = true
    ; properties = []
    }
  ;
    { ident = "logseq.property.view/gallery-card-height"
    ; title = Some "Gallery card height"
    ; attribute = None
    ; schema = [ "type", Keyword "raw-number"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = true
    ; properties = []
    }
  ;
    { ident = "logseq.property.view/sort-groups-by-property"
    ; title = Some "View sort groups by"
    ; attribute = None
    ; schema = [ "type", Keyword "property"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = true
    ; properties = []
    }
  ;
    { ident = "logseq.property.view/sort-groups-desc?"
    ; title = Some "View sort groups DESC"
    ; attribute = None
    ; schema = [ "type", Keyword "checkbox"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = true
    ; properties = [ "logseq.property/scalar-default-value", Bool true ]
    }
  ;
    { ident = "logseq.property.table/sorting"
    ; title = Some "View sorting"
    ; attribute = None
    ; schema = [ "type", Keyword "coll"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = true
    ; properties = []
    }
  ;
    { ident = "logseq.property.table/filters"
    ; title = Some "View filters"
    ; attribute = None
    ; schema = [ "type", Keyword "map"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.table/hidden-columns"
    ; title = Some "View hidden columns"
    ; attribute = None
    ; schema = [ "type", Keyword "keyword"
      ; "cardinality", Keyword "many"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.table/ordered-columns"
    ; title = Some "View ordered columns"
    ; attribute = None
    ; schema = [ "type", Keyword "coll"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.table/sized-columns"
    ; title = Some "View columns settings"
    ; attribute = None
    ; schema = [ "type", Keyword "map"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.table/pinned-columns"
    ; title = Some "Table view pinned columns"
    ; attribute = None
    ; schema = [ "type", Keyword "property"
      ; "cardinality", Keyword "many"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/view-for"
    ; title = Some "This view belongs to"
    ; attribute = None
    ; schema = [ "type", Keyword "node"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.asset/type"
    ; title = Some "File Type"
    ; attribute = None
    ; schema = [ "type", Keyword "string"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.asset/external-url"
    ; title = Some "External URL"
    ; attribute = None
    ; schema = [ "type", Keyword "string"
      ; "hide?", Bool false
      ; "public?", Bool true ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.asset/external-file-name"
    ; title = Some "External file name"
    ; attribute = None
    ; schema = [ "type", Keyword "string"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = Some false
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.asset/size"
    ; title = Some "File Size"
    ; attribute = None
    ; schema = [ "type", Keyword "raw-number"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.asset/width"
    ; title = Some "Image width"
    ; attribute = None
    ; schema = [ "type", Keyword "raw-number"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.asset/height"
    ; title = Some "Image height"
    ; attribute = None
    ; schema = [ "type", Keyword "raw-number"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.asset/checksum"
    ; title = Some "File checksum"
    ; attribute = None
    ; schema = [ "type", Keyword "string"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.asset/last-visit-page"
    ; title = Some "Last visit page"
    ; attribute = None
    ; schema = [ "type", Keyword "raw-number"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = true
    ; properties = []
    }
  ;
    { ident = "logseq.property.asset/remote-metadata"
    ; title = Some "File remote metadata"
    ; attribute = None
    ; schema = [ "type", Keyword "map"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = [ "logseq.property/description", String "Metadata of asset in remote storage" ]
    }
  ;
    { ident = "logseq.property.asset/resize-metadata"
    ; title = Some "Asset resize metadata"
    ; attribute = None
    ; schema = [ "type", Keyword "map"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.asset/align"
    ; title = Some "Asset alignment"
    ; attribute = None
    ; schema = [ "type", Keyword "keyword"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = Some false
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.fsrs/due"
    ; title = Some "Due"
    ; attribute = None
    ; schema = [ "type", Keyword "datetime"
      ; "hide?", Bool false
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.fsrs/state"
    ; title = Some "State"
    ; attribute = None
    ; schema = [ "type", Keyword "map"
      ; "hide?", Bool false
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.user/name"
    ; title = Some "User Name"
    ; attribute = None
    ; schema = [ "type", Keyword "string"
      ; "hide?", Bool false
      ; "public?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.user/email"
    ; title = Some "User Email"
    ; attribute = None
    ; schema = [ "type", Keyword "string"
      ; "hide?", Bool false
      ; "public?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.user/avatar"
    ; title = Some "User Avatar"
    ; attribute = None
    ; schema = [ "type", Keyword "string"
      ; "hide?", Bool false
      ; "public?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/enable-history?"
    ; title = Some "Enable property history"
    ; attribute = None
    ; schema = [ "type", Keyword "checkbox"
      ; "public?", Bool true
      ; "view-context", Keyword "property" ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = [ "logseq.property/description", String "Records history anytime a property's value changes on a node." ]
    }
  ;
    { ident = "logseq.property.history/block"
    ; title = Some "History block"
    ; attribute = None
    ; schema = [ "type", Keyword "entity"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.history/property"
    ; title = Some "History property"
    ; attribute = None
    ; schema = [ "type", Keyword "property"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.history/ref-value"
    ; title = Some "History value"
    ; attribute = None
    ; schema = [ "type", Keyword "entity"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.history/scalar-value"
    ; title = Some "History scalar value"
    ; attribute = None
    ; schema = [ "type", Keyword "any"
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/created-by-ref"
    ; title = Some "Node created by"
    ; attribute = None
    ; schema = [ "type", Keyword "entity"
      ; "hide?", Bool true ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/deleted-at"
    ; title = Some "Deleted at"
    ; attribute = None
    ; schema = [ "type", Keyword "datetime"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/deleted-by-ref"
    ; title = Some "Deleted by"
    ; attribute = None
    ; schema = [ "type", Keyword "entity"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.recycle/original-parent"
    ; title = Some "Recycle original parent"
    ; attribute = None
    ; schema = [ "type", Keyword "node"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.recycle/original-page"
    ; title = Some "Recycle original page"
    ; attribute = None
    ; schema = [ "type", Keyword "node"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.recycle/original-order"
    ; title = Some "Recycle original order"
    ; attribute = None
    ; schema = [ "type", Keyword "string"
      ; "hide?", Bool true
      ; "public?", Bool false ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.reaction/emoji-id"
    ; title = Some "Reaction emoji"
    ; attribute = None
    ; schema = [ "type", Keyword "string"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.reaction/target"
    ; title = Some "Reaction target"
    ; attribute = None
    ; schema = [ "type", Keyword "node"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.agent/session-id"
    ; title = Some "Agent Session ID"
    ; attribute = None
    ; schema = [ "type", Keyword "string"
      ; "public?", Bool true
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = [ "logseq.property/description", String "Stores the AgentBridge session ID for a routed task." ]
    }
  ;
    { ident = "logseq.property/used-template"
    ; title = Some "Used template"
    ; attribute = None
    ; schema = [ "type", Keyword "node"
      ; "public?", Bool false
      ; "hide?", Bool true
      ; "classes", Set [Keyword "logseq.class/Template"] ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property/template-applied-to"
    ; title = Some "Apply template to tags"
    ; attribute = None
    ; schema = [ "type", Keyword "class"
      ; "cardinality", Keyword "many"
      ; "public?", Bool true ]
    ; queryable = Some true
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }
  ;
    { ident = "logseq.property.sync/large-title-object"
    ; title = Some "Reference to large block title stored in remote object storage"
    ; attribute = None
    ; schema = [ "type", Keyword "map"
      ; "public?", Bool false
      ; "hide?", Bool true ]
    ; queryable = None
    ; closed_values = []
    ; rtc_ignore = false
    ; properties = []
    }

  ]

(* frontend.class/built-in-classes — all 18 entries, table order. *)
let built_in_classes : builtin_class list =
  [
    { c_ident = "logseq.class/Root"
    ; c_title = Some "Root Tag"
    ; c_schema_properties = []
    ; c_schema_required_properties = []
    ; c_properties = []
    }
  ;
    { c_ident = "logseq.class/Tag"
    ; c_title = Some "Tag"
    ; c_schema_properties = []
    ; c_schema_required_properties = []
    ; c_properties = []
    }
  ;
    { c_ident = "logseq.class/Property"
    ; c_title = Some "Property"
    ; c_schema_properties = []
    ; c_schema_required_properties = []
    ; c_properties = []
    }
  ;
    { c_ident = "logseq.class/Page"
    ; c_title = Some "Page"
    ; c_schema_properties = []
    ; c_schema_required_properties = []
    ; c_properties = []
    }
  ;
    { c_ident = "logseq.class/Journal"
    ; c_title = Some "Journal"
    ; c_schema_properties = []
    ; c_schema_required_properties = []
    ; c_properties = [ "logseq.property.class/extends", Keyword "logseq.class/Page"
      ; "logseq.property.journal/title-format", String "MMM do, yyyy" ]
    }
  ;
    { c_ident = "logseq.class/Whiteboard"
    ; c_title = Some "Whiteboard"
    ; c_schema_properties = []
    ; c_schema_required_properties = []
    ; c_properties = [ "logseq.property.class/extends", Keyword "logseq.class/Page" ]
    }
  ;
    { c_ident = "logseq.class/Task"
    ; c_title = Some "Task"
    ; c_schema_properties = ["logseq.property/status"; "logseq.property/priority"; "logseq.property/deadline"; "logseq.property/scheduled"]
    ; c_schema_required_properties = []
    ; c_properties = []
    }
  ;
    { c_ident = "logseq.class/Comments"
    ; c_title = Some "Comments"
    ; c_schema_properties = ["logseq.property.comments/blocks"]
    ; c_schema_required_properties = []
    ; c_properties = [ "logseq.property.class/hide-from-node", Bool true
      ; "logseq.property/icon", Map [(Keyword "type", Keyword "tabler-icon"); (Keyword "id", String "message-circle")] ]
    }
  ;
    { c_ident = "logseq.class/Comment"
    ; c_title = Some "Comment"
    ; c_schema_properties = []
    ; c_schema_required_properties = []
    ; c_properties = [ "logseq.property.class/hide-from-node", Bool true ]
    }
  ;
    { c_ident = "logseq.class/Query"
    ; c_title = Some "Query"
    ; c_schema_properties = ["logseq.property/query"]
    ; c_schema_required_properties = []
    ; c_properties = [ "logseq.property/icon", Map [(Keyword "type", Keyword "tabler-icon"); (Keyword "id", String "search")] ]
    }
  ;
    { c_ident = "logseq.class/Card"
    ; c_title = Some "Card"
    ; c_schema_properties = ["logseq.property.fsrs/state"; "logseq.property.fsrs/due"]
    ; c_schema_required_properties = []
    ; c_properties = []
    }
  ;
    { c_ident = "logseq.class/Cards"
    ; c_title = Some "Cards"
    ; c_schema_properties = []
    ; c_schema_required_properties = []
    ; c_properties = [ "logseq.property/icon", Map [(Keyword "type", Keyword "tabler-icon"); (Keyword "id", String "search")]
      ; "logseq.property.class/extends", Keyword "logseq.class/Query" ]
    }
  ;
    { c_ident = "logseq.class/Asset"
    ; c_title = Some "Asset"
    ; c_schema_properties = ["logseq.property.asset/type"; "logseq.property.asset/size"; "logseq.property.asset/checksum"]
    ; c_schema_required_properties = ["logseq.property.asset/type"; "logseq.property.asset/size"; "logseq.property.asset/checksum"]
    ; c_properties = [ "logseq.property.class/hide-from-node", Bool true
      ; "logseq.property.view/type", Keyword "logseq.property.view/type.gallery" ]
    }
  ;
    { c_ident = "logseq.class/Code-block"
    ; c_title = Some "Code"
    ; c_schema_properties = ["logseq.property.node/display-type"; "logseq.property.code/lang"]
    ; c_schema_required_properties = []
    ; c_properties = [ "logseq.property.class/hide-from-node", Bool true ]
    }
  ;
    { c_ident = "logseq.class/Quote-block"
    ; c_title = Some "Quote"
    ; c_schema_properties = ["logseq.property.node/display-type"]
    ; c_schema_required_properties = []
    ; c_properties = [ "logseq.property.class/hide-from-node", Bool true ]
    }
  ;
    { c_ident = "logseq.class/Math-block"
    ; c_title = Some "Math"
    ; c_schema_properties = ["logseq.property.node/display-type"]
    ; c_schema_required_properties = []
    ; c_properties = [ "logseq.property.class/hide-from-node", Bool true ]
    }
  ;
    { c_ident = "logseq.class/Pdf-annotation"
    ; c_title = Some "PDF Annotation"
    ; c_schema_properties = ["logseq.property/ls-type"; "logseq.property.pdf/hl-color"; "logseq.property/asset"; "logseq.property.pdf/hl-page"; "logseq.property.pdf/hl-value"; "logseq.property.pdf/hl-type"; "logseq.property.pdf/hl-image"]
    ; c_schema_required_properties = ["logseq.property/ls-type"; "logseq.property.pdf/hl-color"; "logseq.property/asset"; "logseq.property.pdf/hl-page"; "logseq.property.pdf/hl-value"]
    ; c_properties = [ "logseq.property.class/hide-from-node", Bool true ]
    }
  ;
    { c_ident = "logseq.class/Template"
    ; c_title = Some "Template"
    ; c_schema_properties = ["logseq.property/template-applied-to"]
    ; c_schema_required_properties = []
    ; c_properties = []
    }

  ]

