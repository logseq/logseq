module Domain = Melange_db.Delete_workflow

let optional_field runtime datascript value name =
  let field = Entity_read.field runtime datascript value name in
  if Support.Runtime_codec.value_is_nil runtime field then None
  else Some field

let field_values runtime datascript value name =
  match optional_field runtime datascript value name with
  | None -> Rrbvec.empty
  | Some values ->
      values
      |> Support.Runtime_codec.collection_to_array runtime
      |> Rrbvec.of_array

let optional_string runtime datascript value name =
  optional_field runtime datascript value name
  |> Option.map (Support.Runtime_codec.string_from_value runtime)

let optional_uuid runtime datascript value name =
  optional_field runtime datascript value name
  |> Option.map (Support.Runtime_codec.uuid_to_string runtime)

let page runtime datascript value =
  match
    Entity_read.pageWith runtime datascript value |> Js.Nullable.toOption
  with
  | Some value -> value
  | None -> false

let snapshot runtime datascript value :
    Support.Runtime_codec.cljs_value Domain.snapshot =
  let histories =
    Rrbvec.empty
    |> Rrbvec.append
         (field_values runtime datascript value "logseq.property.history/_block")
    |> Rrbvec.append
         (field_values runtime datascript value
            "logseq.property.history/_property")
    |> Rrbvec.append
         (field_values runtime datascript value
            "logseq.property.history/_ref-value")
  in
  {
    value;
    id =
      optional_field runtime datascript value "db/id"
      |> Option.map (Support.Runtime_codec.int_from_value runtime);
    uuid = optional_uuid runtime datascript value "block/uuid";
    page_ref =
      Option.is_some (optional_field runtime datascript value "block/page");
    page = page runtime datascript value;
    asset =
      Option.is_some
        (optional_field runtime datascript value "logseq.property.asset/type");
    title = optional_string runtime datascript value "block/title";
    raw_title = optional_string runtime datascript value "block/raw-title";
    children = field_values runtime datascript value "block/_parent";
    referrers = field_values runtime datascript value "block/_refs";
    history_block =
      optional_field runtime datascript value "logseq.property.history/block";
    history_property =
      optional_field runtime datascript value "logseq.property.history/property";
    history_ref_value =
      optional_field runtime datascript value
        "logseq.property.history/ref-value";
    history_scalar =
      Option.is_some
        (optional_field runtime datascript value
           "logseq.property.history/scalar-value");
    reactions =
      field_values runtime datascript value "logseq.property.reaction/_target";
    views = field_values runtime datascript value "logseq.property/_view-for";
    histories;
  }

let keyword_text runtime value =
  if Support.Runtime_codec.value_is_keyword runtime value then
    Some (Support.Runtime_codec.keyword_to_string runtime value)
  else None

let decode_transaction runtime source :
    Support.Runtime_codec.cljs_value Domain.transaction =
  let kind =
    if Support.Runtime_codec.value_is_map runtime source then
      Domain.Map_tx source
    else if not (Support.Runtime_codec.value_is_vector runtime source) then
      Other_tx
    else
      let values = Support.Runtime_codec.vector_to_array runtime source in
      let get index =
        if index < Array.length values then Some values.(index) else None
      in
      match Option.bind (get 0) (keyword_text runtime) with
      | Some ("db.fn/retractEntity" as operation)
      | Some ("db/retractEntity" as operation) -> (
          match get 1 with
          | Some target -> Domain.Retract_entity_tx { operation; target }
          | None -> Other_tx)
      | Some "db/retract" -> (
          match (get 1, Option.bind (get 2) (keyword_text runtime)) with
          | Some entity, Some attribute ->
              Domain.Retract_tx { entity; attribute }
          | Some _, None | None, Some _ | None, None -> Other_tx)
      | Some "db/add" -> (
          match (get 1, Option.bind (get 2) (keyword_text runtime), get 3) with
          | Some entity, Some attribute, Some value ->
              Domain.Add_tx { entity; attribute; value }
          | Some _, Some _, None
          | Some _, None, Some _
          | Some _, None, None
          | None, Some _, Some _
          | None, Some _, None
          | None, None, Some _
          | None, None, None ->
              Other_tx)
      | Some _ | None -> Other_tx
  in
  { source; kind }

let capabilities runtime datascript :
    ( Support.Datascript.database,
      Support.Runtime_codec.cljs_value )
    Domain.capabilities =
  {
    entity =
      (fun database lookup ->
        Support.Datascript.entity datascript database lookup
        |> Js.Nullable.toOption);
    snapshot = snapshot runtime datascript;
    integer =
      (fun value ->
        if Support.Runtime_codec.value_is_integer runtime value then
          Some (Support.Runtime_codec.int_from_value runtime value)
        else None);
    int_value = Support.Runtime_codec.int_to_value runtime;
    uuid_text =
      (fun value ->
        if Support.Runtime_codec.value_is_uuid runtime value then
          Some (Support.Runtime_codec.uuid_to_string runtime value)
        else if Support.Runtime_codec.value_is_string runtime value then
          Some (Support.Runtime_codec.string_from_value runtime value)
        else None);
    equal = Support.Runtime_codec.value_equals runtime;
  }

let vector runtime values =
  values |> Rrbvec.to_array |> Support.Runtime_codec.array_to_vector runtime

let encode_operation runtime = function
  | Melange_db.Delete_plan.Retract_entity id ->
      vector runtime
        (Rrbvec.of_array
           [|
             Support.Runtime_codec.keyword_from_string runtime
               "db/retractEntity";
             Support.Runtime_codec.int_to_value runtime id;
           |])
  | Retract_ref { entity_id; block_id } ->
      vector runtime
        (Rrbvec.of_array
           [|
             Support.Runtime_codec.keyword_from_string runtime "db/retract";
             Support.Runtime_codec.int_to_value runtime entity_id;
             Support.Runtime_codec.keyword_from_string runtime "block/refs";
             Support.Runtime_codec.int_to_value runtime block_id;
           |])
  | Add_title { entity_id; title } ->
      vector runtime
        (Rrbvec.of_array
           [|
             Support.Runtime_codec.keyword_from_string runtime "db/add";
             Support.Runtime_codec.int_to_value runtime entity_id;
             Support.Runtime_codec.keyword_from_string runtime "block/title";
             Support.Runtime_codec.string_to_value runtime title;
           |])
  | Retract_uuid uuid ->
      let lookup =
        vector runtime
          (Rrbvec.of_array
             [|
               Support.Runtime_codec.keyword_from_string runtime
                 "block/uuid";
               Support.Runtime_codec.uuid_from_string runtime uuid;
             |])
      in
      vector runtime
        (Rrbvec.of_array
           [|
             Support.Runtime_codec.keyword_from_string runtime
               "db/retractEntity";
             lookup;
           |])

let decode_transactions runtime transaction_data =
  transaction_data
  |> Support.Runtime_codec.collection_to_array runtime
  |> Array.map (decode_transaction runtime)
  |> Rrbvec.of_array

let delete_blocks runtime metadata =
  let operation =
    Support.Runtime_codec.map_get runtime metadata
      (Support.Runtime_codec.keyword_from_string runtime "outliner-op")
  in
  keyword_text runtime operation = Some "delete-blocks"

let expandWith runtime datascript database transaction_data metadata =
  decode_transactions runtime transaction_data
  |> Domain.expand
       (capabilities runtime datascript)
       database
       ~delete_blocks:(delete_blocks runtime metadata)
  |> Rrbvec.map (function
    | Domain.Existing value -> value
    | Planned operation -> encode_operation runtime operation)
  |> Rrbvec.to_array
  |> Support.Runtime_codec.array_to_list runtime

let cleanupWith runtime datascript database transaction_data =
  decode_transactions runtime transaction_data
  |> Domain.cleanup (capabilities runtime datascript) database
  |> Rrbvec.map (encode_operation runtime)
  |> Rrbvec.to_array
  |> Support.Runtime_codec.array_to_list runtime
