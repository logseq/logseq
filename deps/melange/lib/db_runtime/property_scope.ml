module Domain = Melange_db.Property_scope

type encoded_entry = {
  index : int;
  id : string Js.Nullable.t;
  scopeIds : string array;
  recycled : bool;
}

let filterIndices entries class_ids excluded_ids =
  entries
  |> Array.map (fun (entry : encoded_entry) ->
      ({
         index = entry.index;
         id = Js.Nullable.toOption entry.id;
         scope_ids = Rrbvec.of_array entry.scopeIds;
         recycled = entry.recycled;
       }
        : Domain.entry))
  |> Rrbvec.of_array
  |> Domain.filter_indices
       ~class_ids:(Rrbvec.of_array class_ids)
       ~excluded_ids:(Rrbvec.of_array excluded_ids)
  |> Rrbvec.to_array

let scopedValuesWith runtime datascript property block values =
  let field entity name = Entity_read.field runtime datascript entity name in
  let collection entity name =
    field entity name
    |> Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime
  in
  let id_text entity =
    let value = field entity "db/id" in
    if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime value then
      None
    else
      Some (Melange_cljs_runtime_spec.Value_codec.value_to_string runtime value)
  in
  let values =
    match Js.Nullable.toOption values with
    | Some values ->
        Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime values
    | None -> collection property "property/closed-values"
  in
  let classes = collection block "block/tags" in
  Domain.filter_values_with ~id_text
    ~scope_ids:(fun value ->
      collection value "logseq.property/choice-classes"
      |> Array.fold_left
           (fun result value ->
             match id_text value with
             | None -> result
             | Some id -> Array.append result [| id |])
           [||])
    ~recycled:(Entity_read.recycledWith runtime datascript)
    ~class_id:id_text
    ~class_entity:(Entity_read.classWith runtime datascript block)
    ~block_id:(id_text block)
    ~exclusions:(fun class_value ->
      collection class_value "logseq.property/choice-exclusions")
    ~values ~classes

let closedValuesWith runtime datascript database property_id =
  let field entity name = Entity_read.field runtime datascript entity name in
  Domain.closed_values_with
    ~lookup:(fun id ->
      Melange_datascript_spec.Api.entity datascript database id
      |> Js.Nullable.toOption)
    ~values:(fun property ->
      field property "block/_closed-value-property"
      |> Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime)
    ~recycled:(Entity_read.recycledWith runtime datascript)
    ~order:(fun value ->
      let order = field value "block/order" in
      if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime order then
        None
      else
        Some
          (Melange_cljs_runtime_spec.Value_codec.string_from_value runtime order))
    property_id
  |> Js.Nullable.fromOption

let closedValuesNullableWith runtime datascript database property_id =
  match Js.Nullable.toOption database with
  | None -> Js.Nullable.undefined
  | Some database -> closedValuesWith runtime datascript database property_id

let closedValueByNameWith runtime datascript database property_id target =
  let field entity name = Entity_read.field runtime datascript entity name in
  Domain.find_closed_value_with
    ~lookup:(fun id ->
      Melange_datascript_spec.Api.entity datascript database id
      |> Js.Nullable.toOption)
    ~values:(fun property ->
      field property "block/_closed-value-property"
      |> Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime)
    ~recycled:(Entity_read.recycledWith runtime datascript)
    ~order:(fun value ->
      let order = field value "block/order" in
      if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime order then
        None
      else
        Some
          (Melange_cljs_runtime_spec.Value_codec.string_from_value runtime order))
    ~content:(fun value ->
      let title = field value "block/title" in
      if Melange_cljs_runtime_spec.Value_codec.value_truthy runtime title then
        title
      else field value "logseq.property/value")
    ~equals:(Melange_cljs_runtime_spec.Value_codec.value_equals runtime)
    property_id target
  |> Js.Nullable.fromOption

let closedValueByNameNullableWith runtime datascript database property_id target
    =
  match Js.Nullable.toOption database with
  | None -> Js.Nullable.undefined
  | Some database ->
      closedValueByNameWith runtime datascript database property_id target
