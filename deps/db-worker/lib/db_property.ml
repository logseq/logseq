(* db-property/built-in-properties — the full ordered spec map from
   deps/db/src/logseq/db/frontend/property.cljs. *)

open Datascript

type built_in_property =
  { bip_ident : attr
  ; bip_title : string option
  ; bip_attribute : attr option
  ; bip_type : string
  ; bip_cardinality_many : bool
  ; bip_schema : (string * value) list (* schema map in cljs written order,
                                        keys unqualified as written *)
  ; bip_queryable : bool
  ; bip_rtc_ignore : bool
  ; bip_closed_values : (attr * value) list list
  ; bip_properties : (attr * value) list
  }

let kw s : value = Keyword s

(* ordered-map semantics: schema key order matters for tx determinism *)
let bip ?title ?attribute ?(queryable = false) ?(rtc_ignore = false)
    ?(closed_values = []) ?(properties = []) ident schema : built_in_property =
  { bip_ident = ident
  ; bip_title = title
  ; bip_attribute = attribute
  ; bip_type =
      (match List.assoc_opt "type" schema with
       | Some (Keyword t) -> t
       | _ -> invalid_arg ("built-in property " ^ ident ^ " missing :schema :type"))
  ; bip_cardinality_many = List.mem ("cardinality", Keyword "many") schema
  ; bip_schema = schema
  ; bip_queryable = queryable
  ; bip_rtc_ignore = rtc_ignore
  ; bip_closed_values = closed_values
  ; bip_properties = properties
  }

(* closed-value spec map — cljs {db-ident value uuid icon properties} *)
let cv ?icon ?(properties = []) (db_ident : string) (v : value)
    : (attr * value) list =
  [ ("db-ident", kw db_ident)
  ; ("value", v)
  ; ("uuid", Uuid (Common_uuid.gen_uuid "db-ident-block-uuid" db_ident)) ]
  @ (match icon with
     | Some id ->
         [ ( "icon",
             Map
               [ (Keyword "type", Keyword "tabler-icon")
               ; (Keyword "id", String id) ] ) ]
     | None -> [])
  @ (match properties with
     | [] -> []
     | ps ->
         [ ("properties", Map (List.map (fun (k, v) -> (Keyword k, v)) ps)) ])

let built_in_property_specs : built_in_property list =
  [ bip "logseq.property/type" ~title:"Property type"
      [ "type", kw "keyword"; "hide?", Bool true ]
  ; bip "logseq.property/hide?" ~title:"Hide this property or page"
      [ "type", kw "checkbox"; "hide?", Bool true ]
  ; bip "logseq.property/public?" ~title:"Property public?"
      [ "type", kw "checkbox"; "hide?", Bool true ]
  ; bip "logseq.property/view-context" ~title:"Property view context"
      [ "type", kw "keyword"; "hide?", Bool true ]
  ; bip "logseq.property/ui-position" ~title:"Property position"
      [ "type", kw "keyword"; "hide?", Bool true ]
  ; bip "logseq.property/classes" ~title:"Property classes"
      [ "type", kw "entity"; "cardinality", kw "many"; "public?", Bool false
      ; "hide?", Bool true ]
  ; bip "logseq.property/value" ~title:"Property value"
      [ "type", kw "any"; "public?", Bool false; "hide?", Bool true ]
  ; bip "block/alias" ~title:"Alias" ~attribute:"block/alias" ~queryable:true
      [ "type", kw "page"; "cardinality", kw "many"; "view-context", kw "page"
      ; "public?", Bool true ]
  ; bip "block/tags" ~title:"Tags" ~attribute:"block/tags" ~queryable:true
      [ "type", kw "class"; "cardinality", kw "many"; "public?", Bool true ]
  ; bip "block/parent" ~title:"Node parent" ~attribute:"block/parent"
      [ "type", kw "entity"; "public?", Bool false; "hide?", Bool true ]
  ; bip "block/order" ~title:"Node order" ~attribute:"block/order"
      [ "type", kw "string"; "public?", Bool false; "hide?", Bool true ]
  ; bip "block/collapsed?" ~title:"Node collapsed?" ~attribute:"block/collapsed?"
      [ "type", kw "checkbox"; "public?", Bool false; "hide?", Bool true ]
  ; bip "block/page" ~title:"Node page" ~attribute:"block/page"
      [ "type", kw "entity"; "public?", Bool false; "hide?", Bool true ]
  ; bip "block/refs" ~title:"Node references" ~attribute:"block/refs"
      [ "type", kw "entity"; "cardinality", kw "many"; "public?", Bool false
      ; "hide?", Bool true ]
  ; bip "block/link" ~title:"Node links to" ~attribute:"block/link"
      [ "type", kw "entity"; "public?", Bool false; "hide?", Bool true ]
  ; bip "block/title" ~title:"Node title" ~attribute:"block/title"
      [ "type", kw "string"; "public?", Bool false; "hide?", Bool true ]
  ; bip "block/closed-value-property" ~title:"Closed value property"
      ~attribute:"block/closed-value-property"
      [ "type", kw "entity"; "public?", Bool false; "hide?", Bool true ]
  ; bip "block/journal-day" ~title:"Journal date" ~attribute:"block/journal-day"
      ~queryable:true
      [ "type", kw "raw-number"; "public?", Bool false; "hide?", Bool true ]
  ; bip "block/created-at" ~title:"Node created at" ~attribute:"block/created-at"
      [ "type", kw "datetime"; "public?", Bool false; "hide?", Bool true ]
  ; bip "block/updated-at" ~title:"Node updated at" ~attribute:"block/updated-at"
      [ "type", kw "datetime"; "public?", Bool false; "hide?", Bool true ]
  ; bip "logseq.property.node/display-type" ~title:"Node Display Type"
      ~queryable:true
      [ "type", kw "keyword"; "public?", Bool false; "hide?", Bool true
      ; "view-context", kw "block" ]
  ; bip "logseq.property/description" ~title:"Description"
      [ "type", kw "default"; "public?", Bool true ]
  ; bip "logseq.property.code/lang" ~title:"Code Mode" ~queryable:true
      [ "type", kw "string"; "public?", Bool false; "hide?", Bool true
      ; "view-context", kw "block" ]
  ; bip "logseq.property/default-value" ~title:"Default value"
      [ "type", kw "entity"; "public?", Bool false; "hide?", Bool true
      ; "view-context", kw "property" ]
  ; bip "logseq.property/scalar-default-value" ~title:"Non ref type default value"
      [ "type", kw "any"; "public?", Bool false; "hide?", Bool true
      ; "view-context", kw "property" ]
  ; bip "logseq.property.class/extends" ~title:"Extends" ~queryable:true
      ~properties:
        [ "logseq.property/description",
          String "This enables tags to inherit properties from other tags" ]
      [ "type", kw "class"; "cardinality", kw "many"; "public?", Bool true
      ; "view-context", kw "class" ]
  ; bip "logseq.property.class/properties" ~title:"Tag Properties"
      [ "type", kw "property"; "cardinality", kw "many"; "public?", Bool true
      ; "view-context", kw "never" ]
  ; bip "logseq.property.class/bidirectional-property-title"
      ~title:"Bidirectional property title"
      [ "type", kw "string"; "public?", Bool true; "view-context", kw "class" ]
  ; bip "logseq.property.class/enable-bidirectional?"
      ~title:"Enable bidirectional properties"
      ~properties:
        [ "logseq.property/description",
          String
            "When enabled, this tag will show reverse nodes that link to the \
             current node via properties." ]
      [ "type", kw "checkbox"; "public?", Bool true; "view-context", kw "class" ]
  ; bip "logseq.property/hide-empty-value" ~title:"Hide empty value"
      ~properties:
        [ "logseq.property/description",
          String
            "Hides a property's value on any node when empty e.g. when a \
             property appears on a node through a tag." ]
      [ "type", kw "checkbox"; "public?", Bool true
      ; "view-context", kw "property" ]
  ; bip "logseq.property.class/hide-from-node" ~title:"Hide from Node"
      [ "type", kw "checkbox"; "public?", Bool true; "view-context", kw "class" ]
  ; bip "logseq.property/query" ~title:"Query"
      [ "type", kw "default"; "public?", Bool true; "hide?", Bool true
      ; "view-context", kw "block" ]
  ; bip "logseq.property/page-tags" ~title:"Page Tags"
      ~properties:
        [ "logseq.property/description",
          String
            "Provides a way for a page to associate to another page i.e. \
             backward compatible tagging." ]
      [ "type", kw "page"; "public?", Bool true; "view-context", kw "page"
      ; "cardinality", kw "many" ]
  ; bip "logseq.property/background-color" ~title:"Background color"
      [ "type", kw "default"; "hide?", Bool true ]
  ; bip "logseq.property/heading" ~title:"Heading" ~queryable:true
      [ "type", kw "any"; "hide?", Bool true ]
  ; bip "logseq.property/created-from-property" ~title:"Created from property"
      [ "type", kw "entity"; "hide?", Bool true ]
  ; bip "logseq.property/built-in?" ~title:"Built in?"
      [ "type", kw "checkbox"; "hide?", Bool true ]
  ; bip "logseq.property/asset" ~title:"Asset"
      [ "type", kw "entity"; "hide?", Bool true ]
  ; bip "logseq.property/ls-type"
      [ "type", kw "keyword"; "hide?", Bool true ]
  ; bip "logseq.property.pdf/hl-type" ~title:"Annotation type"
      [ "type", kw "keyword"; "hide?", Bool true ]
  ; bip "logseq.property.pdf/hl-color" ~title:"Annotation color"
      ~closed_values:
        [ cv "logseq.property/color.yellow" (String "yellow")
        ; cv "logseq.property/color.red" (String "red")
        ; cv "logseq.property/color.green" (String "green")
        ; cv "logseq.property/color.blue" (String "blue")
        ; cv "logseq.property/color.purple" (String "purple") ]
      [ "type", kw "default"; "hide?", Bool true ]
  ; bip "logseq.property.pdf/hl-page" ~title:"Annotation page"
      [ "type", kw "raw-number"; "hide?", Bool true ]
  ; bip "logseq.property.pdf/hl-image" ~title:"Annotation image"
      [ "type", kw "entity"; "hide?", Bool true ]
  ; bip "logseq.property.pdf/hl-value" ~title:"Annotation data"
      [ "type", kw "map"; "hide?", Bool true ]
  ; bip "logseq.property/order-list-type" ~title:"List type"
      [ "type", kw "default"; "hide?", Bool true ]
  ; bip "logseq.property.linked-references/includes" ~title:"Included references"
      [ "type", kw "node"; "cardinality", kw "many"; "hide?", Bool true ]
  ; bip "logseq.property.linked-references/excludes" ~title:"Excluded references"
      [ "type", kw "node"; "cardinality", kw "many"; "hide?", Bool true ]
  ; bip "logseq.property.comments/blocks" ~title:"Commented blocks"
      [ "type", kw "node"; "cardinality", kw "many"; "public?", Bool false
      ; "hide?", Bool true ]
  ; bip "logseq.property.journal/title-format" ~title:"Title Format"
      [ "type", kw "string"; "public?", Bool false ]
  ; bip "logseq.property/choice-checkbox-state" ~title:"Choice checkbox state"
      [ "type", kw "checkbox"; "hide?", Bool true ]
  ; bip "logseq.property/choice-classes" ~title:"Choice classes"
      [ "type", kw "class"; "cardinality", kw "many"; "public?", Bool false
      ; "hide?", Bool true; "view-context", kw "never" ]
  ; bip "logseq.property/choice-exclusions" ~title:"Choice exclusions"
      [ "type", kw "node"; "cardinality", kw "many"; "public?", Bool false
      ; "hide?", Bool true; "view-context", kw "never" ]
  ; bip "logseq.property/checkbox-display-properties"
      ~title:"Properties displayed as checkbox"
      [ "type", kw "property"; "cardinality", kw "many"; "hide?", Bool true ]
  ; bip "logseq.property/status" ~title:"Status" ~queryable:true
      ~closed_values:
        [ cv "logseq.property/status.backlog" (String "Backlog")
            ~icon:"Backlog"
        ; cv "logseq.property/status.todo" (String "Todo") ~icon:"Todo"
            ~properties:[ "logseq.property/choice-checkbox-state", Bool false ]
        ; cv "logseq.property/status.doing" (String "Doing")
            ~icon:"InProgress50"
        ; cv "logseq.property/status.in-review" (String "In Review")
            ~icon:"InReview"
        ; cv "logseq.property/status.done" (String "Done") ~icon:"Done"
            ~properties:[ "logseq.property/choice-checkbox-state", Bool true ]
        ; cv "logseq.property/status.canceled" (String "Canceled")
            ~icon:"Cancelled" ]
      ~properties:
        [ "logseq.property/hide-empty-value", Bool true
        ; "logseq.property/default-value", kw "logseq.property/status.todo"
        ; "logseq.property/enable-history?", Bool true ]
      [ "type", kw "default"; "public?", Bool true
      ; "ui-position", kw "block-left" ]
  ; bip "logseq.property/priority" ~title:"Priority"
      ~closed_values:
        [ cv "logseq.property/priority.low" (String "Low")
            ~icon:"priorityLvlLow"
        ; cv "logseq.property/priority.medium" (String "Medium")
            ~icon:"priorityLvlMedium"
        ; cv "logseq.property/priority.high" (String "High")
            ~icon:"priorityLvlHigh"
        ; cv "logseq.property/priority.urgent" (String "Urgent")
            ~icon:"priorityLvlUrgent" ]
      ~properties:
        [ "logseq.property/hide-empty-value", Bool true
        ; "logseq.property/enable-history?", Bool true ]
      [ "type", kw "default"; "public?", Bool true
      ; "ui-position", kw "block-left" ]
  ; bip "logseq.property/deadline" ~title:"Deadline" ~queryable:true
      ~properties:
        [ "logseq.property/hide-empty-value", Bool true
        ; "logseq.property/description",
          String "Use it to finish something at a specific date(time)." ]
      [ "type", kw "datetime"; "public?", Bool true
      ; "ui-position", kw "block-below" ]
  ; bip "logseq.property/scheduled" ~title:"Scheduled" ~queryable:true
      ~properties:
        [ "logseq.property/hide-empty-value", Bool true
        ; "logseq.property/description",
          String "Use it to plan something to start at a specific date(time)." ]
      [ "type", kw "datetime"; "public?", Bool true
      ; "ui-position", kw "block-below" ]
  ; bip "logseq.property.repeat/recur-frequency" ~title:"Repeating recur frequency"
      ~queryable:true
      ~properties:
        [ "logseq.property/hide-empty-value", Bool true
        ; "logseq.property/default-value", Int 1 ]
      [ "type", kw "number"; "public?", Bool false ]
  ; bip "logseq.property.repeat/recur-unit" ~title:"Repeating recur unit"
      ~queryable:true
      ~closed_values:
        [ cv "logseq.property.repeat/recur-unit.minute" (String "Minute")
        ; cv "logseq.property.repeat/recur-unit.hour" (String "Hour")
        ; cv "logseq.property.repeat/recur-unit.day" (String "Day")
        ; cv "logseq.property.repeat/recur-unit.week" (String "Week")
        ; cv "logseq.property.repeat/recur-unit.month" (String "Month")
        ; cv "logseq.property.repeat/recur-unit.year" (String "Year") ]
      ~properties:
        [ "logseq.property/hide-empty-value", Bool true
        ; "logseq.property/default-value",
          kw "logseq.property.repeat/recur-unit.day" ]
      [ "type", kw "default"; "public?", Bool false ]
  ; bip "logseq.property.repeat/repeated?" ~title:"Node Repeats?" ~queryable:true
      [ "type", kw "checkbox"; "hide?", Bool true ]
  ; bip "logseq.property.repeat/repeat-type" ~title:"Repeating type"
      ~queryable:true
      ~closed_values:
        [ cv "logseq.property.repeat/repeat-type.dotted-plus"
            (String "Advance from completion")
        ; cv "logseq.property.repeat/repeat-type.plus"
            (String "Advance from scheduled")
        ; cv "logseq.property.repeat/repeat-type.double-plus"
            (String "Advance from scheduled, skip to future") ]
      ~properties:
        [ "logseq.property/hide-empty-value", Bool true
        ; "logseq.property/default-value",
          kw "logseq.property.repeat/repeat-type.double-plus" ]
      [ "type", kw "default"; "public?", Bool false ]
  ; bip "logseq.property.repeat/temporal-property"
      ~title:"Repeating Temporal Property"
      [ "type", kw "property"; "hide?", Bool true ]
  ; bip "logseq.property.repeat/checked-property"
      ~title:"Repeating Checked Property"
      [ "type", kw "property"; "hide?", Bool true ]
  ; bip "logseq.property/assignee" ~title:"Assignee" ~queryable:true
      ~properties:[ "logseq.property/hide-empty-value", Bool true ]
      [ "type", kw "node"; "cardinality", kw "many"; "public?", Bool true
      ; "ui-position", kw "block-below"
      ; "classes", Set [ kw "logseq.class/Page" ] ]
  ; bip "logseq.property/icon" ~title:"Icon" [ "type", kw "map" ]
  ; bip "logseq.property/publishing-public?" ~title:"Publishing Public?"
      [ "type", kw "checkbox"; "hide?", Bool true; "view-context", kw "page"
      ; "public?", Bool true ]
  ; bip "logseq.property.publish/published-url" ~title:"Published URL"
      [ "type", kw "url"; "view-context", kw "page"; "public?", Bool true ]
  ; bip "logseq.property/exclude-from-graph-view"
      ~title:"Excluded from Graph view?"
      [ "type", kw "checkbox"; "hide?", Bool true; "view-context", kw "page"
      ; "public?", Bool true ]
  ; bip "logseq.property.view/type" ~title:"View Type" ~queryable:true
      ~closed_values:
        [ cv "logseq.property.view/type.table" (String "Table View")
            ~icon:"table"
        ; cv "logseq.property.view/type.list" (String "List View") ~icon:"list"
        ; cv "logseq.property.view/type.gallery" (String "Gallery View")
            ~icon:"layout-grid" ]
      ~properties:
        [ "logseq.property/default-value", kw "logseq.property.view/type.table" ]
      [ "type", kw "default"; "public?", Bool false; "hide?", Bool true ]
  ; bip "logseq.property.view/feature-type" ~title:"View Feature Type"
      [ "type", kw "keyword"; "public?", Bool false; "hide?", Bool true ]
  ; bip "logseq.property.view/group-by-property" ~title:"View group by property"
      ~queryable:true
      [ "type", kw "property"; "public?", Bool false; "hide?", Bool true ]
  ; bip "logseq.property.view/gallery-asset-property"
      ~title:"Gallery asset property"
      [ "type", kw "property"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.view/gallery-display-properties"
      ~title:"Gallery display properties"
      [ "type", kw "property"; "cardinality", kw "many"; "hide?", Bool true
      ; "public?", Bool false ]
  ; bip "logseq.property.view/gallery-card-size" ~title:"Gallery card size"
      ~rtc_ignore:true
      ~properties:[ "logseq.property/scalar-default-value", kw "default" ]
      [ "type", kw "keyword"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.view/gallery-card-width" ~title:"Gallery card width"
      ~rtc_ignore:true
      [ "type", kw "raw-number"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.view/gallery-card-height" ~title:"Gallery card height"
      ~rtc_ignore:true
      [ "type", kw "raw-number"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.view/sort-groups-by-property"
      ~title:"View sort groups by" ~rtc_ignore:true
      [ "type", kw "property"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.view/sort-groups-desc?" ~title:"View sort groups DESC"
      ~rtc_ignore:true
      ~properties:[ "logseq.property/scalar-default-value", Bool true ]
      [ "type", kw "checkbox"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.table/sorting" ~title:"View sorting" ~rtc_ignore:true
      [ "type", kw "coll"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.table/filters" ~title:"View filters"
      [ "type", kw "map"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.table/hidden-columns" ~title:"View hidden columns"
      [ "type", kw "keyword"; "cardinality", kw "many"; "hide?", Bool true
      ; "public?", Bool false ]
  ; bip "logseq.property.table/ordered-columns" ~title:"View ordered columns"
      [ "type", kw "coll"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.table/sized-columns" ~title:"View columns settings"
      [ "type", kw "map"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.table/pinned-columns" ~title:"Table view pinned columns"
      [ "type", kw "property"; "cardinality", kw "many"; "hide?", Bool true
      ; "public?", Bool false ]
  ; bip "logseq.property/view-for" ~title:"This view belongs to"
      [ "type", kw "node"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.asset/type" ~title:"File Type" ~queryable:true
      [ "type", kw "string"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.asset/external-url" ~title:"External URL"
      ~queryable:true
      [ "type", kw "string"; "hide?", Bool false; "public?", Bool true ]
  ; bip "logseq.property.asset/external-file-name" ~title:"External file name"
      [ "type", kw "string"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.asset/size" ~title:"File Size" ~queryable:true
      [ "type", kw "raw-number"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.asset/width" ~title:"Image width" ~queryable:true
      [ "type", kw "raw-number"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.asset/height" ~title:"Image height" ~queryable:true
      [ "type", kw "raw-number"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.asset/checksum" ~title:"File checksum"
      [ "type", kw "string"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.asset/last-visit-page" ~title:"Last visit page"
      ~rtc_ignore:true
      [ "type", kw "raw-number"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.asset/remote-metadata" ~title:"File remote metadata"
      ~properties:
        [ "logseq.property/description",
          String "Metadata of asset in remote storage" ]
      [ "type", kw "map"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.asset/resize-metadata" ~title:"Asset resize metadata"
      [ "type", kw "map"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.asset/align" ~title:"Asset alignment"
      [ "type", kw "keyword"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.fsrs/due" ~title:"Due"
      [ "type", kw "datetime"; "hide?", Bool false; "public?", Bool false ]
  ; bip "logseq.property.fsrs/state" ~title:"State"
      [ "type", kw "map"; "hide?", Bool false; "public?", Bool false ]
  ; bip "logseq.property.user/name" ~title:"User Name"
      [ "type", kw "string"; "hide?", Bool false; "public?", Bool true ]
  ; bip "logseq.property.user/email" ~title:"User Email"
      [ "type", kw "string"; "hide?", Bool false; "public?", Bool true ]
  ; bip "logseq.property.user/avatar" ~title:"User Avatar"
      [ "type", kw "string"; "hide?", Bool false; "public?", Bool true ]
  ; bip "logseq.property/enable-history?" ~title:"Enable property history"
      ~properties:
        [ "logseq.property/description",
          String "Records history anytime a property's value changes on a node." ]
      [ "type", kw "checkbox"; "public?", Bool true
      ; "view-context", kw "property" ]
  ; bip "logseq.property.history/block" ~title:"History block"
      [ "type", kw "entity"; "hide?", Bool true ]
  ; bip "logseq.property.history/property" ~title:"History property"
      [ "type", kw "property"; "hide?", Bool true ]
  ; bip "logseq.property.history/ref-value" ~title:"History value"
      [ "type", kw "entity"; "hide?", Bool true ]
  ; bip "logseq.property.history/scalar-value" ~title:"History scalar value"
      [ "type", kw "any"; "hide?", Bool true ]
  ; bip "logseq.property/created-by-ref" ~title:"Node created by" ~queryable:true
      [ "type", kw "entity"; "hide?", Bool true ]
  ; bip "logseq.property/deleted-at" ~title:"Deleted at"
      [ "type", kw "datetime"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property/deleted-by-ref" ~title:"Deleted by"
      [ "type", kw "entity"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.recycle/original-parent" ~title:"Recycle original parent"
      [ "type", kw "node"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.recycle/original-page" ~title:"Recycle original page"
      [ "type", kw "node"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.recycle/original-order" ~title:"Recycle original order"
      [ "type", kw "string"; "hide?", Bool true; "public?", Bool false ]
  ; bip "logseq.property.reaction/emoji-id" ~title:"Reaction emoji"
      [ "type", kw "string"; "public?", Bool false; "hide?", Bool true ]
  ; bip "logseq.property.reaction/target" ~title:"Reaction target"
      [ "type", kw "node"; "public?", Bool false; "hide?", Bool true ]
  ; bip "logseq.property.agent/session-id" ~title:"Agent Session ID"
      ~properties:
        [ "logseq.property/description",
          String "Stores the AgentBridge session ID for a routed task." ]
      [ "type", kw "string"; "public?", Bool true; "hide?", Bool true ]
  ; bip "logseq.property/used-template" ~title:"Used template"
      [ "type", kw "node"; "public?", Bool false; "hide?", Bool true
      ; "classes", Set [ kw "logseq.class/Template" ] ]
  ; bip "logseq.property/template-applied-to" ~title:"Apply template to tags"
      ~queryable:true
      [ "type", kw "class"; "cardinality", kw "many"; "public?", Bool true ]
  ; bip "logseq.property.sync/large-title-object"
      ~title:"Reference to large block title stored in remote object storage"
      [ "type", kw "map"; "public?", Bool false; "hide?", Bool true ] ]

let built_in_property (ident : string) : built_in_property option =
  List.find_opt (fun p -> p.bip_ident = ident) built_in_property_specs

(* (ident, schema-type, :properties keys) view used by callers that only
   need the reduced shape. *)
let built_in_properties : (string * string * string list) list =
  List.map
    (fun p -> (p.bip_ident, p.bip_type, List.map fst p.bip_properties))
    built_in_property_specs

let built_in_property_schema_type (ident : string) : string option =
  match built_in_property ident with
  | Some p -> Some p.bip_type
  | None -> None

(* db-property/built-in-properties :queryable? *)
let built_in_property_queryable (ident : string) : bool =
  match built_in_property ident with
  | Some p -> p.bip_queryable
  | None -> false

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

(* db-property namespace predicates — data lives in Db_schema. *)
let namespace_of (kw : string) : string option =
  match String.index_opt kw '/' with
  | Some i when i > 0 -> Some (String.sub kw 0 i)
  | _ -> None

let logseq_property_namespaces = Db_schema.logseq_property_namespaces
let public_db_attribute_properties = Db_schema.public_db_attribute_properties

(* db-property/logseq-property? *)
let logseq_property (kw : string) : bool =
  match namespace_of kw with
  | Some ns -> List.mem ns logseq_property_namespaces
  | None -> false

(* db-property/user-property-namespace? — takes a namespace string *)
let user_property_namespace (s : string) : bool = Ns_util.str_contains s ".property"

(* db-property/plugin-property? *)
let plugin_property (kw : string) : bool =
  match namespace_of kw with
  | Some ns -> Ns_util.str_starts_with ns "plugin.property."
  | None -> false

(* db-property/internal-property? *)
let internal_property (kw : string) : bool =
  match namespace_of kw with
  | Some ns ->
      List.mem ns logseq_property_namespaces
      || List.mem kw public_db_attribute_properties
  | None -> List.mem kw public_db_attribute_properties

(* db-property/property? — attr keyword is a property *)
let property (kw : string) : bool =
  match namespace_of kw with
  | Some ns ->
      List.mem ns logseq_property_namespaces
      || user_property_namespace ns
      || List.mem kw public_db_attribute_properties
  | None -> List.mem kw public_db_attribute_properties

(* db-property/properties — entity kv pairs whose keys are properties *)
let properties (kvs : (attr * value) list) : (attr * value) list =
  List.filter (fun (k, _) -> property k) kvs

(* db-property/many? on a (attr * value) list or Map value *)
let many_kvs (kvs : (string * value) list) : bool =
  List.exists
    (fun (k, v) -> k = "db/cardinality" && v = Keyword "db.cardinality/many")
    kvs

let many_map (m : value) : bool =
  match m with
  | Map kvs ->
      List.exists
        (fun (k, v) ->
          match k with
          | Keyword "db/cardinality" | String "db/cardinality" ->
              v = Keyword "db.cardinality/many"
          | _ -> false)
        kvs
  | _ -> false

(* db-property/schema-properties-map *)
let schema_properties_map : (string * string) list =
  [ "cardinality", "db/cardinality"; "type", "logseq.property/type"
  ; "hide?", "logseq.property/hide?"; "public?", "logseq.property/public?"
  ; "ui-position", "logseq.property/ui-position"
  ; "view-context", "logseq.property/view-context"
  ; "classes", "logseq.property/classes" ]

(* db-property/internal-property? on a schema (kw list) — cljs
   (db-property/internal-property? (:db/ident m)) used in update-properties *)

(* malli-schema support: closed-value properties of a property entity —
   entity-plus/lookup-kv-then-entity :property/closed-values i.e.
   reverse :block/_closed-value-property minus recycled, in block/order *)
let property_closed_values (property : entity) : entity list =
  let cv_ids =
    List.filter_map
      (fun (d : datom) -> Some d.e)
      (List.of_seq
         (datoms property.db Avet ~a:"block/closed-value-property"
            ~v:(Ref property.id) ()))
  in
  List.filter_map
    (fun id -> Ldb.ent_of_id property.db id)
    cv_ids
  |> List.filter (fun e -> not (Ldb.recycled e))
  |> List.stable_sort
       (fun (a : entity) (b : entity) ->
         match
           ( Ldb.string_value a "block/order"
           , Ldb.string_value b "block/order" )
         with
         | Some x, Some y -> String.compare x y
         | _ -> 0)


(* db-property/built-in-closed-values — (value, db-ident) pairs per
   property ident, used by the file->db translation (e.g. pdf hl-color). *)
let built_in_closed_value_pairs : (string * (string * string) list) list =
  [ ( "logseq.property.pdf/hl-color"
    , [ ("yellow", "logseq.property/color.yellow")
      ; ("red", "logseq.property/color.red")
      ; ("green", "logseq.property/color.green")
      ; ("blue", "logseq.property/color.blue")
      ; ("purple", "logseq.property/color.purple") ] )
  ; ( "logseq.property/status"
    , [ ("Backlog", "logseq.property/status.backlog")
      ; ("Todo", "logseq.property/status.todo")
      ; ("Doing", "logseq.property/status.doing")
      ; ("In Review", "logseq.property/status.in-review")
      ; ("Done", "logseq.property/status.done")
      ; ("Canceled", "logseq.property/status.canceled") ] )
  ; ( "logseq.property/priority"
    , [ ("Low", "logseq.property/priority.low")
      ; ("Medium", "logseq.property/priority.medium")
      ; ("High", "logseq.property/priority.high")
      ; ("Urgent", "logseq.property/priority.urgent") ] )
  ; ( "logseq.property.repeat/recur-unit"
    , [ ("Minute", "logseq.property.repeat/recur-unit.minute")
      ; ("Hour", "logseq.property.repeat/recur-unit.hour")
      ; ("Day", "logseq.property.repeat/recur-unit.day")
      ; ("Week", "logseq.property.repeat/recur-unit.week")
      ; ("Month", "logseq.property.repeat/recur-unit.month")
      ; ("Year", "logseq.property.repeat/recur-unit.year") ] )
  ; ( "logseq.property.repeat/repeat-type"
    , [ ("Advance from completion", "logseq.property.repeat/repeat-type.dotted-plus")
      ; ("Advance from scheduled", "logseq.property.repeat/repeat-type.plus")
      ; ( "Advance from scheduled, skip to future"
        , "logseq.property.repeat/repeat-type.double-plus" ) ] )
  ; ( "logseq.property.view/type"
    , [ ("Table View", "logseq.property.view/type.table")
      ; ("List View", "logseq.property.view/type.list")
      ; ("Gallery View", "logseq.property.view/type.gallery") ] ) ]

let built_in_closed_values (ident : string) : (string * string) list =
  match List.assoc_opt ident built_in_closed_value_pairs with
  | Some pairs -> pairs
  | None -> []

(* db-property/properties over a live entity (entity_attrs gives
   (attr * tx_value) pairs — filter by key only). cljs iterates (into {} e)
   which only surfaces forward attrs, so reverse attrs (:ns/_name) are
   excluded here too. *)
let properties_of_entity (e : Datascript.entity)
    : (Datascript.attr * Datascript.tx_value) list =
  List.filter
    (fun (k, _) ->
      let local =
        match String.rindex_opt k '/' with
        | Some i -> String.sub k (i + 1) (String.length k - i - 1)
        | None -> k
      in
      local <> "" && local.[0] <> '_' && property k)
    (Datascript.entity_attrs e)

(* db-property/get-closed-property-values — same as
   property_closed_values but looked up by property ident. *)
let get_closed_property_values (db : Datascript.db) (property_ident : string)
    : Datascript.entity list =
  match Datascript.entity db (Datascript.Ident property_ident) with
  | None -> []
  | Some property -> property_closed_values property

(* db-property/closed-value-content *)
let closed_value_content (ent : Datascript.entity) : Datascript.value option =
  match Ldb.value ent "block/title" with
  | Some v -> Some v
  | None -> Ldb.value ent "logseq.property/value"

(* db-property/property-value-content — same lookup order as
   closed-value-content. *)
let property_value_content = closed_value_content

(* db-property/get-closed-value-entity-by-name *)
let get_closed_value_entity_by_name (db : Datascript.db) (db_ident : string)
    (value_content : Datascript.value) : Datascript.entity option =
  List.find_opt
    (fun e ->
      match closed_value_content e with
      | Some v -> Datascript.Util.value_equal v value_content
      | None -> false)
    (get_closed_property_values db db_ident)

(* db-property/create-user-property-ident-from-name *)
let default_user_namespace = "user.property"

let create_user_property_ident_from_name ?(user_namespace = default_user_namespace)
    (property_name : string) : string =
  Db_ident.create_db_ident_from_name ~user_namespace ~name_string:property_name

(* db-property/get-property-schema — select-keys over schema-properties *)
let get_property_schema (m : Block_map.t) : Block_map.t =
  List.filter
    (fun (k, _) -> List.mem k Db_schema.schema_properties)
    m

(* property-type/all-ref-property-types *)
let all_ref_property_types = Db_schema.all_ref_property_types

