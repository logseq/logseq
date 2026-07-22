type property_value =
  | Keyword of string
  | String_literal of string
  | Bool of bool
  | Icon of { icon_type : string; id : string }

type entry = {
  ident : string;
  title : string;
  properties : (string * property_value) Rrbvec.t;
  schema_properties : string Rrbvec.t;
  required_properties : string Rrbvec.t;
}

let ident entry = entry.ident
let title entry = entry.title
let properties entry = entry.properties
let schema_properties entry = entry.schema_properties
let required_properties entry = entry.required_properties
let vector = Rrbvec.of_array

let make_entry ident title properties schema_properties required_properties =
  {
    ident;
    title;
    properties = vector properties;
    schema_properties = vector schema_properties;
    required_properties = vector required_properties;
  }

let entries =
  vector
    [|
      make_entry "logseq.class/Root" "Root Tag" [||] [||] [||];
      make_entry "logseq.class/Tag" "Tag" [||] [||] [||];
      make_entry "logseq.class/Property" "Property" [||] [||] [||];
      make_entry "logseq.class/Page" "Page" [||] [||] [||];
      make_entry "logseq.class/Journal" "Journal"
        [|
          ("logseq.property.class/extends", Keyword "logseq.class/Page");
          ("logseq.property.journal/title-format", String_literal "MMM do, yyyy");
        |]
        [||] [||];
      make_entry "logseq.class/Whiteboard" "Whiteboard"
        [| ("logseq.property.class/extends", Keyword "logseq.class/Page") |]
        [||] [||];
      make_entry "logseq.class/Task" "Task" [||]
        [|
          "logseq.property/status";
          "logseq.property/priority";
          "logseq.property/deadline";
          "logseq.property/scheduled";
        |]
        [||];
      make_entry "logseq.class/Comments" "Comments"
        [|
          ("logseq.property.class/hide-from-node", Bool true);
          ( "logseq.property/icon",
            Icon { icon_type = "tabler-icon"; id = "message-circle" } );
        |]
        [| "logseq.property.comments/blocks" |]
        [||];
      make_entry "logseq.class/Comment" "Comment"
        [| ("logseq.property.class/hide-from-node", Bool true) |]
        [||] [||];
      make_entry "logseq.class/Query" "Query"
        [|
          ( "logseq.property/icon",
            Icon { icon_type = "tabler-icon"; id = "search" } );
        |]
        [| "logseq.property/query" |]
        [||];
      make_entry "logseq.class/Card" "Card" [||]
        [| "logseq.property.fsrs/state"; "logseq.property.fsrs/due" |]
        [||];
      make_entry "logseq.class/Cards" "Cards"
        [|
          ( "logseq.property/icon",
            Icon { icon_type = "tabler-icon"; id = "search" } );
          ("logseq.property.class/extends", Keyword "logseq.class/Query");
        |]
        [||] [||];
      make_entry "logseq.class/Asset" "Asset"
        [|
          ("logseq.property.class/hide-from-node", Bool true);
          ( "logseq.property.view/type",
            Keyword "logseq.property.view/type.gallery" );
        |]
        [|
          "logseq.property.asset/type";
          "logseq.property.asset/size";
          "logseq.property.asset/checksum";
        |]
        [|
          "logseq.property.asset/type";
          "logseq.property.asset/size";
          "logseq.property.asset/checksum";
        |];
      make_entry "logseq.class/Code-block" "Code"
        [| ("logseq.property.class/hide-from-node", Bool true) |]
        [| "logseq.property.node/display-type"; "logseq.property.code/lang" |]
        [||];
      make_entry "logseq.class/Quote-block" "Quote"
        [| ("logseq.property.class/hide-from-node", Bool true) |]
        [| "logseq.property.node/display-type" |]
        [||];
      make_entry "logseq.class/Math-block" "Math"
        [| ("logseq.property.class/hide-from-node", Bool true) |]
        [| "logseq.property.node/display-type" |]
        [||];
      make_entry "logseq.class/Pdf-annotation" "PDF Annotation"
        [| ("logseq.property.class/hide-from-node", Bool true) |]
        [|
          "logseq.property/ls-type";
          "logseq.property.pdf/hl-color";
          "logseq.property/asset";
          "logseq.property.pdf/hl-page";
          "logseq.property.pdf/hl-value";
          "logseq.property.pdf/hl-type";
          "logseq.property.pdf/hl-image";
        |]
        [|
          "logseq.property/ls-type";
          "logseq.property.pdf/hl-color";
          "logseq.property/asset";
          "logseq.property.pdf/hl-page";
          "logseq.property.pdf/hl-value";
        |];
      make_entry "logseq.class/Template" "Template" [||]
        [| "logseq.property/template-applied-to" |]
        [||];
    |]

let page_children_classes =
  vector [| "logseq.class/Journal"; "logseq.class/Whiteboard" |]

let page_classes =
  vector
    [|
      "logseq.class/Page";
      "logseq.class/Tag";
      "logseq.class/Property";
      "logseq.class/Journal";
      "logseq.class/Whiteboard";
    |]

let internal_tags =
  vector
    [|
      "logseq.class/Page";
      "logseq.class/Property";
      "logseq.class/Tag";
      "logseq.class/Root";
      "logseq.class/Asset";
    |]

let private_tags =
  vector
    [|
      "logseq.class/Page";
      "logseq.class/Property";
      "logseq.class/Tag";
      "logseq.class/Asset";
      "logseq.class/Journal";
      "logseq.class/Whiteboard";
      "logseq.class/Pdf-annotation";
    |]

let block_kind_tags =
  vector
    [|
      "logseq.class/Cards";
      "logseq.class/Code-block";
      "logseq.class/Math-block";
      "logseq.class/Quote-block";
      "logseq.class/Query";
      "logseq.class/Pdf-annotation";
      "logseq.class/Template";
    |]

let disallowed_inline_tags =
  vector
    [|
      "logseq.class/Asset";
      "logseq.class/Quote-block";
      "logseq.class/Property";
      "logseq.class/Page";
      "logseq.class/Math-block";
      "logseq.class/Code-block";
      "logseq.class/Cards";
      "logseq.class/Whiteboard";
      "logseq.class/Journal";
      "logseq.class/Query";
      "logseq.class/Pdf-annotation";
      "logseq.class/Tag";
      "logseq.class/Template";
    |]

let extends_hidden_tags = disallowed_inline_tags

let hidden_tags =
  vector [| "logseq.class/Page"; "logseq.class/Root"; "logseq.class/Asset" |]
