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
    Melange_cljs_runtime_spec.Value_codec.map_get runtime block
      (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime name)
  in
  let title = field "block/title" in
  let content =
    if Melange_cljs_runtime_spec.Value_codec.value_truthy runtime title then
      title
    else field "logseq.property/value"
  in
  Domain.is_property_created_block
    ~is_map:(Melange_cljs_runtime_spec.Value_codec.value_is_map runtime block)
    ~has_created_from_property:
      (field "logseq.property/created-from-property"
      |> Melange_cljs_runtime_spec.Value_codec.value_truthy runtime)
    ~has_page:
      (field "block/page"
      |> Melange_cljs_runtime_spec.Value_codec.value_truthy runtime)
    ~has_content:
      (not (Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime content))

let isMany cardinality = Domain.is_many cardinality

let selectContentSource title_truthy =
  match Domain.select_content_source ~title_truthy with
  | Domain.Title -> "title"
  | Value -> "value"
