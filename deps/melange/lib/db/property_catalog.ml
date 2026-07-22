type scalar =
  | Keyword of string
  | String_literal of string
  | Bool of bool
  | Int of int

type icon = { icon_type : string; id : string }
type closed_value_properties = Absent | Nil | Checkbox of bool

type closed_value = {
  closed_value_ident : string;
  closed_value_value : string;
  closed_value_uuid : string;
  closed_value_icon : icon option;
  closed_value_properties : closed_value_properties;
}

type schema = {
  property_type : string;
  cardinality : string option;
  hide : bool option;
  public_ : bool option;
  view_context : string option;
  ui_position : string option;
  classes : string Rrbvec.t;
}

type entry = {
  ident : string;
  title : string option;
  attribute : string option;
  schema : schema;
  queryable : bool option;
  properties : (string * scalar) Rrbvec.t;
  closed_values : closed_value Rrbvec.t;
  rtc_ignore_attr_when_syncing : bool;
}

let ident entry = entry.ident
let title entry = entry.title
let attribute entry = entry.attribute
let schema entry = entry.schema
let queryable entry = entry.queryable
let properties entry = entry.properties
let closed_values entry = entry.closed_values
let rtc_ignore_attr_when_syncing entry = entry.rtc_ignore_attr_when_syncing
let schema_property_type schema = schema.property_type
let schema_cardinality schema = schema.cardinality
let schema_hide schema = schema.hide
let schema_public schema = schema.public_
let schema_view_context schema = schema.view_context
let schema_ui_position schema = schema.ui_position
let schema_classes schema = schema.classes
let closed_value_ident value = value.closed_value_ident
let closed_value_value value = value.closed_value_value
let closed_value_uuid value = value.closed_value_uuid
let closed_value_icon value = value.closed_value_icon
let closed_value_properties value = value.closed_value_properties
let vector = Rrbvec.of_array

let make_schema property_type cardinality hide public_ view_context ui_position
    classes =
  {
    property_type;
    cardinality;
    hide;
    public_;
    view_context;
    ui_position;
    classes;
  }

let make_closed_value closed_value_ident closed_value_value closed_value_uuid
    closed_value_icon closed_value_properties =
  {
    closed_value_ident;
    closed_value_value;
    closed_value_uuid;
    closed_value_icon;
    closed_value_properties;
  }

let make_entry ident title attribute schema queryable properties closed_values
    rtc_ignore_attr_when_syncing =
  {
    ident;
    title;
    attribute;
    schema;
    queryable;
    properties;
    closed_values;
    rtc_ignore_attr_when_syncing;
  }

let entries =
  vector
    [|
      make_entry "logseq.property/type" (Some "Property type") None
        (make_schema "keyword" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/hide?" (Some "Hide this property or page")
        None
        (make_schema "checkbox" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/public?" (Some "Property public?") None
        (make_schema "checkbox" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/view-context" (Some "Property view context")
        None
        (make_schema "keyword" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/ui-position" (Some "Property position") None
        (make_schema "keyword" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/classes" (Some "Property classes") None
        (make_schema "entity" (Some "many") (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/value" (Some "Property value") None
        (make_schema "any" None (Some true) (Some false) None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "block/alias" (Some "Alias") (Some "block/alias")
        (make_schema "page" (Some "many") None (Some true) (Some "page") None
           (vector [||]))
        (Some true) (vector [||]) (vector [||]) false;
      make_entry "block/tags" (Some "Tags") (Some "block/tags")
        (make_schema "class" (Some "many") None (Some true) None None
           (vector [||]))
        (Some true) (vector [||]) (vector [||]) false;
      make_entry "block/parent" (Some "Node parent") (Some "block/parent")
        (make_schema "entity" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "block/order" (Some "Node order") (Some "block/order")
        (make_schema "string" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "block/collapsed?" (Some "Node collapsed?")
        (Some "block/collapsed?")
        (make_schema "checkbox" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "block/page" (Some "Node page") (Some "block/page")
        (make_schema "entity" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "block/refs" (Some "Node references") (Some "block/refs")
        (make_schema "entity" (Some "many") (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "block/link" (Some "Node links to") (Some "block/link")
        (make_schema "entity" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "block/title" (Some "Node title") (Some "block/title")
        (make_schema "string" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "block/closed-value-property" (Some "Closed value property")
        (Some "block/closed-value-property")
        (make_schema "entity" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "block/journal-day" (Some "Journal date")
        (Some "block/journal-day")
        (make_schema "raw-number" None (Some true) (Some false) None None
           (vector [||]))
        (Some true) (vector [||]) (vector [||]) false;
      make_entry "block/created-at" (Some "Node created at")
        (Some "block/created-at")
        (make_schema "datetime" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "block/updated-at" (Some "Node updated at")
        (Some "block/updated-at")
        (make_schema "datetime" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.node/display-type" (Some "Node Display Type")
        None
        (make_schema "keyword" None (Some true) (Some false) (Some "block") None
           (vector [||]))
        (Some true) (vector [||]) (vector [||]) false;
      make_entry "logseq.property/description" (Some "Description") None
        (make_schema "default" None None (Some true) None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.code/lang" (Some "Code Mode") None
        (make_schema "string" None (Some true) (Some false) (Some "block") None
           (vector [||]))
        (Some true) (vector [||]) (vector [||]) false;
      make_entry "logseq.property/default-value" (Some "Default value") None
        (make_schema "entity" None (Some true) (Some false) (Some "property")
           None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/scalar-default-value"
        (Some "Non ref type default value") None
        (make_schema "any" None (Some true) (Some false) (Some "property") None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.class/extends" (Some "Extends") None
        (make_schema "class" (Some "many") None (Some true) (Some "class") None
           (vector [||]))
        (Some true)
        (vector
           [|
             ( "logseq.property/description",
               String_literal
                 "This enables tags to inherit properties from other tags" );
           |])
        (vector [||]) false;
      make_entry "logseq.property.class/properties" (Some "Tag Properties") None
        (make_schema "property" (Some "many") None (Some true) (Some "never")
           None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.class/bidirectional-property-title"
        (Some "Bidirectional property title") None
        (make_schema "string" None None (Some true) (Some "class") None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.class/enable-bidirectional?"
        (Some "Enable bidirectional properties") None
        (make_schema "checkbox" None None (Some true) (Some "class") None
           (vector [||]))
        None
        (vector
           [|
             ( "logseq.property/description",
               String_literal
                 "When enabled, this tag will show reverse nodes that link to \
                  the current node via properties." );
           |])
        (vector [||]) false;
      make_entry "logseq.property/hide-empty-value" (Some "Hide empty value")
        None
        (make_schema "checkbox" None None (Some true) (Some "property") None
           (vector [||]))
        None
        (vector
           [|
             ( "logseq.property/description",
               String_literal
                 "Hides a property's value on any node when empty e.g. when a \
                  property appears on a node through a tag." );
           |])
        (vector [||]) false;
      make_entry "logseq.property.class/hide-from-node" (Some "Hide from Node")
        None
        (make_schema "checkbox" None None (Some true) (Some "class") None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/query" (Some "Query") None
        (make_schema "default" None (Some true) (Some true) (Some "block") None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/page-tags" (Some "Page Tags") None
        (make_schema "page" (Some "many") None (Some true) (Some "page") None
           (vector [||]))
        None
        (vector
           [|
             ( "logseq.property/description",
               String_literal
                 "Provides a way for a page to associate to another page i.e. \
                  backward compatible tagging." );
           |])
        (vector [||]) false;
      make_entry "logseq.property/background-color" (Some "Background color")
        None
        (make_schema "default" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/heading" (Some "Heading") None
        (make_schema "any" None (Some true) None None None (vector [||]))
        (Some true) (vector [||]) (vector [||]) false;
      make_entry "logseq.property/created-from-property"
        (Some "Created from property") None
        (make_schema "entity" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/built-in?" (Some "Built in?") None
        (make_schema "checkbox" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/asset" (Some "Asset") None
        (make_schema "entity" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/ls-type" None None
        (make_schema "keyword" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.pdf/hl-type" (Some "Annotation type") None
        (make_schema "keyword" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.pdf/hl-color" (Some "Annotation color") None
        (make_schema "default" None (Some true) None None None (vector [||]))
        None (vector [||])
        (vector
           [|
             make_closed_value "logseq.property/color.yellow" "yellow"
               "00000002-1752-1030-0200-000000000000" None Absent;
             make_closed_value "logseq.property/color.red" "red"
               "00000002-4136-2216-2000-000000000000" None Absent;
             make_closed_value "logseq.property/color.green" "green"
               "00000002-1992-2016-2600-000000000000" None Absent;
             make_closed_value "logseq.property/color.blue" "blue"
               "00000002-1836-0512-4100-000000000000" None Absent;
             make_closed_value "logseq.property/color.purple" "purple"
               "00000002-1104-3848-5600-000000000000" None Absent;
           |])
        false;
      make_entry "logseq.property.pdf/hl-page" (Some "Annotation page") None
        (make_schema "raw-number" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.pdf/hl-image" (Some "Annotation image") None
        (make_schema "entity" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.pdf/hl-value" (Some "Annotation data") None
        (make_schema "map" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/order-list-type" (Some "List type") None
        (make_schema "default" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.linked-references/includes"
        (Some "Included references") None
        (make_schema "node" (Some "many") (Some true) None None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.linked-references/excludes"
        (Some "Excluded references") None
        (make_schema "node" (Some "many") (Some true) None None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.comments/blocks" (Some "Commented blocks")
        None
        (make_schema "node" (Some "many") (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.journal/title-format" (Some "Title Format")
        None
        (make_schema "string" None None (Some false) None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/choice-checkbox-state"
        (Some "Choice checkbox state") None
        (make_schema "checkbox" None (Some true) None None None (vector [||]))
        (Some false) (vector [||]) (vector [||]) false;
      make_entry "logseq.property/choice-classes" (Some "Choice classes") None
        (make_schema "class" (Some "many") (Some true) (Some false)
           (Some "never") None (vector [||]))
        (Some false) (vector [||]) (vector [||]) false;
      make_entry "logseq.property/choice-exclusions" (Some "Choice exclusions")
        None
        (make_schema "node" (Some "many") (Some true) (Some false)
           (Some "never") None (vector [||]))
        (Some false) (vector [||]) (vector [||]) false;
      make_entry "logseq.property/checkbox-display-properties"
        (Some "Properties displayed as checkbox") None
        (make_schema "property" (Some "many") (Some true) None None None
           (vector [||]))
        (Some false) (vector [||]) (vector [||]) false;
      make_entry "logseq.property/status" (Some "Status") None
        (make_schema "default" None None (Some true) None (Some "block-left")
           (vector [||]))
        (Some true)
        (vector
           [|
             ("logseq.property/hide-empty-value", Bool true);
             ( "logseq.property/default-value",
               Keyword "logseq.property/status.todo" );
             ("logseq.property/enable-history?", Bool true);
           |])
        (vector
           [|
             make_closed_value "logseq.property/status.backlog" "Backlog"
               "00000002-7233-3491-0000-000000000000"
               (Some { icon_type = "tabler-icon"; id = "Backlog" })
               Nil;
             make_closed_value "logseq.property/status.todo" "Todo"
               "00000002-1615-5853-7700-000000000000"
               (Some { icon_type = "tabler-icon"; id = "Todo" })
               (Checkbox false);
             make_closed_value "logseq.property/status.doing" "Doing"
               "00000002-1840-1229-0800-000000000000"
               (Some { icon_type = "tabler-icon"; id = "InProgress50" })
               Nil;
             make_closed_value "logseq.property/status.in-review" "In Review"
               "00000002-1870-0014-4300-000000000000"
               (Some { icon_type = "tabler-icon"; id = "InReview" })
               Nil;
             make_closed_value "logseq.property/status.done" "Done"
               "00000002-1827-5820-8200-000000000000"
               (Some { icon_type = "tabler-icon"; id = "Done" })
               (Checkbox true);
             make_closed_value "logseq.property/status.canceled" "Canceled"
               "00000002-7526-4326-2000-000000000000"
               (Some { icon_type = "tabler-icon"; id = "Cancelled" })
               Nil;
           |])
        false;
      make_entry "logseq.property/priority" (Some "Priority") None
        (make_schema "default" None None (Some true) None (Some "block-left")
           (vector [||]))
        None
        (vector
           [|
             ("logseq.property/hide-empty-value", Bool true);
             ("logseq.property/enable-history?", Bool true);
           |])
        (vector
           [|
             make_closed_value "logseq.property/priority.low" "Low"
               "00000002-2107-4537-4800-000000000000"
               (Some { icon_type = "tabler-icon"; id = "priorityLvlLow" })
               Absent;
             make_closed_value "logseq.property/priority.medium" "Medium"
               "00000002-1829-3222-7800-000000000000"
               (Some { icon_type = "tabler-icon"; id = "priorityLvlMedium" })
               Absent;
             make_closed_value "logseq.property/priority.high" "High"
               "00000002-5672-2766-8000-000000000000"
               (Some { icon_type = "tabler-icon"; id = "priorityLvlHigh" })
               Absent;
             make_closed_value "logseq.property/priority.urgent" "Urgent"
               "00000002-1996-4346-6700-000000000000"
               (Some { icon_type = "tabler-icon"; id = "priorityLvlUrgent" })
               Absent;
           |])
        false;
      make_entry "logseq.property/deadline" (Some "Deadline") None
        (make_schema "datetime" None None (Some true) None (Some "block-below")
           (vector [||]))
        (Some true)
        (vector
           [|
             ("logseq.property/hide-empty-value", Bool true);
             ( "logseq.property/description",
               String_literal
                 "Use it to finish something at a specific date(time)." );
           |])
        (vector [||]) false;
      make_entry "logseq.property/scheduled" (Some "Scheduled") None
        (make_schema "datetime" None None (Some true) None (Some "block-below")
           (vector [||]))
        (Some true)
        (vector
           [|
             ("logseq.property/hide-empty-value", Bool true);
             ( "logseq.property/description",
               String_literal
                 "Use it to plan something to start at a specific date(time)."
             );
           |])
        (vector [||]) false;
      make_entry "logseq.property.repeat/recur-frequency"
        (Some "Repeating recur frequency") None
        (make_schema "number" None None (Some false) None None (vector [||]))
        (Some true)
        (vector
           [|
             ("logseq.property/hide-empty-value", Bool true);
             ("logseq.property/default-value", Int 1);
           |])
        (vector [||]) false;
      make_entry "logseq.property.repeat/recur-unit"
        (Some "Repeating recur unit") None
        (make_schema "default" None None (Some false) None None (vector [||]))
        (Some true)
        (vector
           [|
             ("logseq.property/hide-empty-value", Bool true);
             ( "logseq.property/default-value",
               Keyword "logseq.property.repeat/recur-unit.day" );
           |])
        (vector
           [|
             make_closed_value "logseq.property.repeat/recur-unit.minute"
               "Minute" "00000002-1513-6550-8500-000000000000" None Absent;
             make_closed_value "logseq.property.repeat/recur-unit.hour" "Hour"
               "00000002-1438-8849-5400-000000000000" None Absent;
             make_closed_value "logseq.property.repeat/recur-unit.day" "Day"
               "00000002-3924-1785-8000-000000000000" None Absent;
             make_closed_value "logseq.property.repeat/recur-unit.week" "Week"
               "00000002-2130-9244-4900-000000000000" None Absent;
             make_closed_value "logseq.property.repeat/recur-unit.month" "Month"
               "00000002-2073-3937-9700-000000000000" None Absent;
             make_closed_value "logseq.property.repeat/recur-unit.year" "Year"
               "00000002-1520-4385-2400-000000000000" None Absent;
           |])
        false;
      make_entry "logseq.property.repeat/repeated?" (Some "Node Repeats?") None
        (make_schema "checkbox" None (Some true) None None None (vector [||]))
        (Some true) (vector [||]) (vector [||]) false;
      make_entry "logseq.property.repeat/repeat-type" (Some "Repeating type")
        None
        (make_schema "default" None None (Some false) None None (vector [||]))
        (Some true)
        (vector
           [|
             ("logseq.property/hide-empty-value", Bool true);
             ( "logseq.property/default-value",
               Keyword "logseq.property.repeat/repeat-type.double-plus" );
           |])
        (vector
           [|
             make_closed_value "logseq.property.repeat/repeat-type.dotted-plus"
               "Advance from completion" "00000002-1406-5331-0600-000000000000"
               None Absent;
             make_closed_value "logseq.property.repeat/repeat-type.plus"
               "Advance from scheduled" "00000002-1646-4063-5900-000000000000"
               None Absent;
             make_closed_value "logseq.property.repeat/repeat-type.double-plus"
               "Advance from scheduled, skip to future"
               "00000002-7441-9615-3000-000000000000" None Absent;
           |])
        false;
      make_entry "logseq.property.repeat/temporal-property"
        (Some "Repeating Temporal Property") None
        (make_schema "property" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.repeat/checked-property"
        (Some "Repeating Checked Property") None
        (make_schema "property" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/assignee" (Some "Assignee") None
        (make_schema "node" (Some "many") None (Some true) None
           (Some "block-below")
           (vector [| "logseq.class/Page" |]))
        (Some true)
        (vector [| ("logseq.property/hide-empty-value", Bool true) |])
        (vector [||]) false;
      make_entry "logseq.property/icon" (Some "Icon") None
        (make_schema "map" None None None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/publishing-public?"
        (Some "Publishing Public?") None
        (make_schema "checkbox" None (Some true) (Some true) (Some "page") None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.publish/published-url" (Some "Published URL")
        None
        (make_schema "url" None None (Some true) (Some "page") None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/exclude-from-graph-view"
        (Some "Excluded from Graph view?") None
        (make_schema "checkbox" None (Some true) (Some true) (Some "page") None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.view/type" (Some "View Type") None
        (make_schema "default" None (Some true) (Some false) None None
           (vector [||]))
        (Some true)
        (vector
           [|
             ( "logseq.property/default-value",
               Keyword "logseq.property.view/type.table" );
           |])
        (vector
           [|
             make_closed_value "logseq.property.view/type.table" "Table View"
               "00000002-1942-5424-0000-000000000000"
               (Some { icon_type = "tabler-icon"; id = "table" })
               Absent;
             make_closed_value "logseq.property.view/type.list" "List View"
               "00000002-1164-8285-0200-000000000000"
               (Some { icon_type = "tabler-icon"; id = "list" })
               Absent;
             make_closed_value "logseq.property.view/type.gallery"
               "Gallery View" "00000002-1506-0511-2000-000000000000"
               (Some { icon_type = "tabler-icon"; id = "layout-grid" })
               Absent;
           |])
        false;
      make_entry "logseq.property.view/feature-type" (Some "View Feature Type")
        None
        (make_schema "keyword" None (Some true) (Some false) None None
           (vector [||]))
        (Some false) (vector [||]) (vector [||]) false;
      make_entry "logseq.property.view/group-by-property"
        (Some "View group by property") None
        (make_schema "property" None (Some true) (Some false) None None
           (vector [||]))
        (Some true) (vector [||]) (vector [||]) false;
      make_entry "logseq.property.view/gallery-asset-property"
        (Some "Gallery asset property") None
        (make_schema "property" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.view/gallery-display-properties"
        (Some "Gallery display properties") None
        (make_schema "property" (Some "many") (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.view/gallery-card-size"
        (Some "Gallery card size") None
        (make_schema "keyword" None (Some true) (Some false) None None
           (vector [||]))
        None
        (vector
           [| ("logseq.property/scalar-default-value", Keyword "default") |])
        (vector [||]) true;
      make_entry "logseq.property.view/gallery-card-width"
        (Some "Gallery card width") None
        (make_schema "raw-number" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) true;
      make_entry "logseq.property.view/gallery-card-height"
        (Some "Gallery card height") None
        (make_schema "raw-number" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) true;
      make_entry "logseq.property.view/sort-groups-by-property"
        (Some "View sort groups by") None
        (make_schema "property" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) true;
      make_entry "logseq.property.view/sort-groups-desc?"
        (Some "View sort groups DESC") None
        (make_schema "checkbox" None (Some true) (Some false) None None
           (vector [||]))
        None
        (vector [| ("logseq.property/scalar-default-value", Bool true) |])
        (vector [||]) true;
      make_entry "logseq.property.table/sorting" (Some "View sorting") None
        (make_schema "coll" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) true;
      make_entry "logseq.property.table/filters" (Some "View filters") None
        (make_schema "map" None (Some true) (Some false) None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.table/hidden-columns"
        (Some "View hidden columns") None
        (make_schema "keyword" (Some "many") (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.table/ordered-columns"
        (Some "View ordered columns") None
        (make_schema "coll" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.table/sized-columns"
        (Some "View columns settings") None
        (make_schema "map" None (Some true) (Some false) None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.table/pinned-columns"
        (Some "Table view pinned columns") None
        (make_schema "property" (Some "many") (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/view-for" (Some "This view belongs to") None
        (make_schema "node" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.asset/type" (Some "File Type") None
        (make_schema "string" None (Some true) (Some false) None None
           (vector [||]))
        (Some true) (vector [||]) (vector [||]) false;
      make_entry "logseq.property.asset/external-url" (Some "External URL") None
        (make_schema "string" None (Some false) (Some true) None None
           (vector [||]))
        (Some true) (vector [||]) (vector [||]) false;
      make_entry "logseq.property.asset/external-file-name"
        (Some "External file name") None
        (make_schema "string" None (Some true) (Some false) None None
           (vector [||]))
        (Some false) (vector [||]) (vector [||]) false;
      make_entry "logseq.property.asset/size" (Some "File Size") None
        (make_schema "raw-number" None (Some true) (Some false) None None
           (vector [||]))
        (Some true) (vector [||]) (vector [||]) false;
      make_entry "logseq.property.asset/width" (Some "Image width") None
        (make_schema "raw-number" None (Some true) (Some false) None None
           (vector [||]))
        (Some true) (vector [||]) (vector [||]) false;
      make_entry "logseq.property.asset/height" (Some "Image height") None
        (make_schema "raw-number" None (Some true) (Some false) None None
           (vector [||]))
        (Some true) (vector [||]) (vector [||]) false;
      make_entry "logseq.property.asset/checksum" (Some "File checksum") None
        (make_schema "string" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.asset/last-visit-page"
        (Some "Last visit page") None
        (make_schema "raw-number" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) true;
      make_entry "logseq.property.asset/remote-metadata"
        (Some "File remote metadata") None
        (make_schema "map" None (Some true) (Some false) None None (vector [||]))
        None
        (vector
           [|
             ( "logseq.property/description",
               String_literal "Metadata of asset in remote storage" );
           |])
        (vector [||]) false;
      make_entry "logseq.property.asset/resize-metadata"
        (Some "Asset resize metadata") None
        (make_schema "map" None (Some true) (Some false) None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.asset/align" (Some "Asset alignment") None
        (make_schema "keyword" None (Some true) (Some false) None None
           (vector [||]))
        (Some false) (vector [||]) (vector [||]) false;
      make_entry "logseq.property.fsrs/due" (Some "Due") None
        (make_schema "datetime" None (Some false) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.fsrs/state" (Some "State") None
        (make_schema "map" None (Some false) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.user/name" (Some "User Name") None
        (make_schema "string" None (Some false) (Some true) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.user/email" (Some "User Email") None
        (make_schema "string" None (Some false) (Some true) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.user/avatar" (Some "User Avatar") None
        (make_schema "string" None (Some false) (Some true) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/enable-history?"
        (Some "Enable property history") None
        (make_schema "checkbox" None None (Some true) (Some "property") None
           (vector [||]))
        None
        (vector
           [|
             ( "logseq.property/description",
               String_literal
                 "Records history anytime a property's value changes on a node."
             );
           |])
        (vector [||]) false;
      make_entry "logseq.property.history/block" (Some "History block") None
        (make_schema "entity" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.history/property" (Some "History property")
        None
        (make_schema "property" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.history/ref-value" (Some "History value") None
        (make_schema "entity" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.history/scalar-value"
        (Some "History scalar value") None
        (make_schema "any" None (Some true) None None None (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/created-by-ref" (Some "Node created by") None
        (make_schema "entity" None (Some true) None None None (vector [||]))
        (Some true) (vector [||]) (vector [||]) false;
      make_entry "logseq.property/deleted-at" (Some "Deleted at") None
        (make_schema "datetime" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/deleted-by-ref" (Some "Deleted by") None
        (make_schema "entity" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.recycle/original-parent"
        (Some "Recycle original parent") None
        (make_schema "node" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.recycle/original-page"
        (Some "Recycle original page") None
        (make_schema "node" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.recycle/original-order"
        (Some "Recycle original order") None
        (make_schema "string" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.reaction/emoji-id" (Some "Reaction emoji")
        None
        (make_schema "string" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.reaction/target" (Some "Reaction target") None
        (make_schema "node" None (Some true) (Some false) None None
           (vector [||]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property.agent/session-id" (Some "Agent Session ID")
        None
        (make_schema "string" None (Some true) (Some true) None None
           (vector [||]))
        None
        (vector
           [|
             ( "logseq.property/description",
               String_literal
                 "Stores the AgentBridge session ID for a routed task." );
           |])
        (vector [||]) false;
      make_entry "logseq.property/used-template" (Some "Used template") None
        (make_schema "node" None (Some true) (Some false) None None
           (vector [| "logseq.class/Template" |]))
        None (vector [||]) (vector [||]) false;
      make_entry "logseq.property/template-applied-to"
        (Some "Apply template to tags") None
        (make_schema "class" (Some "many") None (Some true) None None
           (vector [||]))
        (Some true) (vector [||]) (vector [||]) false;
      make_entry "logseq.property.sync/large-title-object"
        (Some "Reference to large block title stored in remote object storage")
        None
        (make_schema "map" None (Some true) (Some false) None None (vector [||]))
        None (vector [||]) (vector [||]) false;
    |]

let public_built_in_properties =
  vector
    [|
      "logseq.property.user/name";
      "logseq.property.agent/session-id";
      "logseq.property/deadline";
      "block/alias";
      "logseq.property.publish/published-url";
      "logseq.property.asset/external-url";
      "logseq.property.user/avatar";
      "logseq.property/assignee";
      "logseq.property.class/enable-bidirectional?";
      "logseq.property/status";
      "logseq.property.class/extends";
      "logseq.property/hide-empty-value";
      "logseq.property/publishing-public?";
      "logseq.property.class/properties";
      "logseq.property/enable-history?";
      "logseq.property/page-tags";
      "logseq.property/scheduled";
      "logseq.property.class/hide-from-node";
      "logseq.property.user/email";
      "logseq.property/query";
      "block/tags";
      "logseq.property.class/bidirectional-property-title";
      "logseq.property/exclude-from-graph-view";
      "logseq.property/description";
      "logseq.property/priority";
      "logseq.property/template-applied-to";
    |]

let db_attribute_properties =
  vector
    [|
      "block/alias";
      "block/link";
      "block/updated-at";
      "block/refs";
      "block/closed-value-property";
      "block/created-at";
      "block/collapsed?";
      "block/journal-day";
      "block/tags";
      "block/title";
      "block/parent";
      "block/order";
      "block/page";
    |]

let private_db_attribute_properties =
  vector
    [|
      "block/link";
      "block/updated-at";
      "block/refs";
      "block/closed-value-property";
      "block/created-at";
      "block/collapsed?";
      "block/journal-day";
      "block/title";
      "block/parent";
      "block/order";
      "block/page";
    |]

let public_db_attribute_properties = vector [| "block/alias"; "block/tags" |]
let read_only_properties = vector [| "logseq.property/built-in?" |]

let schema_properties =
  vector
    [|
      "db/cardinality";
      "logseq.property/type";
      "logseq.property/hide?";
      "logseq.property/public?";
      "logseq.property/ui-position";
      "logseq.property/view-context";
      "logseq.property/classes";
    |]

let schema_entries ~ident_of entries =
  Rrbvec.filter
    (fun (key, _value) -> Rrbvec.mem (ident_of key) schema_properties)
    entries

let logseq_property_namespaces =
  vector
    [|
      "logseq.property.table";
      "logseq.property.code";
      "logseq.property.history";
      "logseq.property.recycle";
      "logseq.property.repeat";
      "logseq.property.view";
      "logseq.property.comments";
      "logseq.property.class";
      "logseq.property.asset";
      "logseq.property.journal";
      "logseq.property.linked-references";
      "logseq.property";
      "logseq.property.agent";
      "logseq.property.pdf";
      "logseq.property.user";
      "logseq.property.publish";
      "logseq.property.tldraw";
      "logseq.property.fsrs";
      "logseq.property.reaction";
      "logseq.property.sync";
      "logseq.property.node";
    |]

let schema_properties_map =
  vector
    [|
      ("cardinality", "db/cardinality");
      ("type", "logseq.property/type");
      ("hide?", "logseq.property/hide?");
      ("public?", "logseq.property/public?");
      ("ui-position", "logseq.property/ui-position");
      ("view-context", "logseq.property/view-context");
      ("classes", "logseq.property/classes");
    |]
