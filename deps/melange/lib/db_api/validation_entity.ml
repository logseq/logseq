module Domain = Melange_db.Validation_entity

type encoded_shape = {
  reaction : bool;
  property : bool;
  classValue : bool;
  page : bool;
  hidden : bool;
  whiteboard : bool;
  asset : bool;
  file : bool;
  propertyHistory : bool;
  closedValue : bool;
  createdFromProperty : bool;
  propertyValue : bool;
  emptyPlaceholder : bool;
  uuid : bool;
  ident : bool;
}

let kind_name = function
  | Domain.Reaction_entity -> "reaction-entity"
  | Property -> "property"
  | Class -> "class"
  | Hidden -> "hidden"
  | Normal_page -> "normal-page"
  | Asset_block -> "asset-block"
  | File_block -> "file-block"
  | Property_history_block -> "property-history-block"
  | Closed_value_block -> "closed-value-block"
  | Property_value_block -> "property-value-block"
  | Property_value_placeholder -> "property-value-placeholder"
  | Block -> "block"
  | Db_ident_key_value -> "db-ident-key-value"

let dispatch (shape : encoded_shape) =
  Domain.dispatch
    {
      reaction = shape.reaction;
      property = shape.property;
      class_ = shape.classValue;
      page = shape.page;
      hidden = shape.hidden;
      whiteboard = shape.whiteboard;
      asset = shape.asset;
      file = shape.file;
      property_history = shape.propertyHistory;
      closed_value = shape.closedValue;
      created_from_property = shape.createdFromProperty;
      property_value = shape.propertyValue;
      empty_placeholder = shape.emptyPlaceholder;
      uuid = shape.uuid;
      ident = shape.ident;
    }
  |> Option.map kind_name |> Js.Nullable.fromOption

let dispatchWith runtime datascript database entity =
  let field entity name =
    Entity_read.field runtime datascript entity name
  in
  let truthy entity name =
    field entity name |> Support.Runtime_codec.value_truthy runtime
  in
  let non_nil entity name =
    field entity name |> Support.Runtime_codec.value_is_nil runtime |> not
  in
  let has_tag entity ident =
    Entity_read.has_tag_bool runtime datascript entity ident
  in
  let uuid = field entity "block/uuid" in
  let resolved =
    if Support.Runtime_codec.value_truthy runtime uuid then
      let lookup =
        [|
          Support.Runtime_codec.keyword_from_string runtime "block/uuid";
          uuid;
        |]
        |> Support.Runtime_codec.array_to_vector runtime
      in
      match
        Support.Datascript.entity datascript database lookup
        |> Js.Nullable.toOption
      with
      | Some value -> value
      | None -> Support.Runtime_codec.nil_value runtime
    else entity
  in
  let hidden = field resolved "logseq.property/hide?" in
  let ident = field resolved "db/ident" in
  Domain.dispatch
    {
      reaction = truthy resolved "logseq.property.reaction/target";
      property = has_tag resolved "logseq.class/Property";
      class_ = has_tag resolved "logseq.class/Tag";
      page =
        Rrbvec.exists (has_tag resolved)
          (Rrbvec.of_array
             [|
               "logseq.class/Page";
               "logseq.class/Journal";
               "logseq.class/Tag";
               "logseq.class/Property";
             |]);
      hidden =
        Support.Runtime_codec.value_is_bool runtime hidden
        && Support.Runtime_codec.bool_from_value runtime hidden;
      whiteboard = has_tag resolved "logseq.class/Whiteboard";
      asset = non_nil resolved "logseq.property.asset/type";
      file = truthy resolved "file/path";
      property_history = truthy resolved "logseq.property.history/block";
      closed_value = truthy resolved "block/closed-value-property";
      created_from_property =
        truthy resolved "logseq.property/created-from-property";
      property_value = truthy resolved "logseq.property/value";
      empty_placeholder =
        Support.Runtime_codec.value_equals runtime ident
          (Support.Runtime_codec.keyword_from_string runtime
             "logseq.property/empty-placeholder");
      uuid = truthy resolved "block/uuid";
      ident = Support.Runtime_codec.value_truthy runtime ident;
    }
  |> Option.map kind_name |> Js.Nullable.fromOption
