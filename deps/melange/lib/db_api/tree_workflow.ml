module Domain = Melange_db.Tree_workflow

let field runtime datascript entity name =
  Support.Datascript.entity_get datascript entity
    (Support.Runtime_codec.keyword_from_string runtime name)

let order runtime datascript entity =
  let value = field runtime datascript entity "block/order" in
  if Support.Runtime_codec.value_is_nil runtime value then ""
  else Support.Runtime_codec.string_from_value runtime value

let sortWith runtime datascript entities =
  entities |> Rrbvec.of_array
  |> Domain.sort_with ~order:(order runtime datascript)
  |> Rrbvec.to_array

let blockAndChildrenWith runtime datascript database block_uuid
    include_property_blocks =
  let collection entity name =
    field runtime datascript entity name
    |> Support.Runtime_codec.collection_to_array runtime
    |> Rrbvec.of_array
  in
  let capabilities :
      ( Support.Datascript.entity,
        Support.Runtime_codec.cljs_value )
      Domain.capabilities =
    {
      id = (fun entity -> field runtime datascript entity "db/id");
      equal_id = Support.Runtime_codec.value_equals runtime;
      order = order runtime datascript;
      children = (fun entity -> collection entity "block/_parent");
      raw_children = (fun entity -> collection entity "block/_raw-parent");
      query_child =
        (fun entity ->
          let value = field runtime datascript entity "logseq.property/query" in
          if Support.Runtime_codec.value_is_nil runtime value then None
          else Some value);
    }
  in
  let lookup =
    [|
      Support.Runtime_codec.keyword_from_string runtime "block/uuid";
      block_uuid;
    |]
    |> Support.Runtime_codec.array_to_vector runtime
  in
  Support.Datascript.entity datascript database lookup
  |> Js.Nullable.toOption
  |> Option.map (fun root ->
      Domain.block_and_children_with capabilities ~include_property_blocks root
      |> Rrbvec.to_array)
  |> Js.Nullable.fromOption

let siblingWith runtime datascript block direction =
  let optional_field entity name =
    let value = field runtime datascript entity name in
    if Support.Runtime_codec.value_is_nil runtime value then None
    else Some value
  in
  let collection entity name =
    field runtime datascript entity name
    |> Support.Runtime_codec.collection_to_array runtime
    |> Rrbvec.of_array
  in
  let capabilities :
      ( Support.Datascript.entity,
        Support.Runtime_codec.cljs_value )
      Domain.sibling_capabilities =
    {
      sibling_id = (fun entity -> field runtime datascript entity "db/id");
      sibling_equal_id = Support.Runtime_codec.value_equals runtime;
      sibling_order = order runtime datascript;
      parent = (fun entity -> optional_field entity "block/parent");
      closed_property =
        (fun entity -> optional_field entity "block/closed-value-property");
      created_from =
        (fun entity ->
          optional_field entity "logseq.property/created-from-property");
      closed_children =
        (fun entity -> collection entity "block/_closed-value-property");
      raw_children = (fun entity -> collection entity "block/_raw-parent");
      normal_children = (fun entity -> collection entity "block/_parent");
    }
  in
  let direction =
    match direction with
    | "left" -> Domain.Left
    | "right" -> Domain.Right
    | direction ->
        invalid_arg ("DB tree workflow: unknown direction " ^ direction)
  in
  Domain.sibling_with capabilities ~direction block |> Js.Nullable.fromOption

let child_entities runtime datascript entity =
  field runtime datascript entity "block/_parent"
  |> Support.Runtime_codec.collection_to_array runtime
  |> Rrbvec.of_array

let child_capabilities runtime datascript database :
    ( Support.Datascript.entity,
      Support.Runtime_codec.cljs_value )
    Domain.child_capabilities =
  let lookup value =
    Support.Datascript.entity datascript database value
    |> Js.Nullable.toOption
  in
  {
    child_order = order runtime datascript;
    child_entities = child_entities runtime datascript;
    child_by_id = lookup;
    child_by_uuid =
      (fun uuid ->
        [|
          Support.Runtime_codec.keyword_from_string runtime "block/uuid";
          uuid;
        |]
        |> Support.Runtime_codec.array_to_vector runtime
        |> lookup);
  }

let child_reference kind value =
  match kind with
  | "entity" -> Domain.Entity value
  | "id" -> Domain.Id value
  | "uuid" -> Domain.Uuid value
  | kind -> invalid_arg ("DB tree workflow: unknown child lookup " ^ kind)

let firstChildOfWith runtime datascript entity =
  Domain.first_child_of_with ~order:(order runtime datascript)
    ~children:(child_entities runtime datascript)
    entity
  |> Js.Nullable.fromOption

let childrenWith runtime datascript database kind value =
  Domain.children_with
    (child_capabilities runtime datascript database)
    (child_reference kind value)
  |> Option.map Rrbvec.to_array |> Js.Nullable.fromOption

let childrenByReferenceWith runtime datascript database value =
  let reference =
    if Support.Runtime_codec.value_is_integer runtime value then
      Domain.Id value
    else if Support.Runtime_codec.value_is_uuid runtime value then
      Domain.Uuid value
    else Domain.Entity value
  in
  Domain.children_with
    (child_capabilities runtime datascript database)
    reference
  |> Option.map Rrbvec.to_array |> Js.Nullable.fromOption

let firstChildWith runtime datascript database kind value =
  Domain.first_child_with
    (child_capabilities runtime datascript database)
    (child_reference kind value)
  |> Js.Nullable.fromOption
