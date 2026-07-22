module Domain = Melange_db.Property_shape

type encoded_shape = {
  isMap : bool;
  hasCreatedFromProperty : bool;
  hasPage : bool;
  hasContent : bool;
}

let isPropertyCreatedBlock (shape : encoded_shape) =
  Domain.is_property_created_block ~is_map:shape.isMap
    ~has_created_from_property:shape.hasCreatedFromProperty
    ~has_page:shape.hasPage ~has_content:shape.hasContent

let isPropertyCreatedBlockWith runtime block =
  let field name =
    Support.Runtime_codec.map_get runtime block
      (Support.Runtime_codec.keyword_from_string runtime name)
  in
  let title = field "block/title" in
  let content =
    if Support.Runtime_codec.value_truthy runtime title then title
    else field "logseq.property/value"
  in
  Domain.is_property_created_block
    ~is_map:(Support.Runtime_codec.value_is_map runtime block)
    ~has_created_from_property:
      (field "logseq.property/created-from-property"
      |> Support.Runtime_codec.value_truthy runtime)
    ~has_page:
      (field "block/page" |> Support.Runtime_codec.value_truthy runtime)
    ~has_content:(not (Support.Runtime_codec.value_is_nil runtime content))

let isMany cardinality = Domain.is_many cardinality

let selectContentSource title_truthy =
  match Domain.select_content_source ~title_truthy with
  | Domain.Title -> "title"
  | Value -> "value"
