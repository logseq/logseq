module Domain = Melange_db.Normalize_plan

type runtime_conflict_group = {
  key : Support.Runtime_codec.cljs_value array;
  indices : int Rrbvec.t ref;
  tx : int option;
}

type runtime_replacement_group = {
  entity : Support.Runtime_codec.cljs_value;
  replacement : Support.Runtime_codec.cljs_value ref;
}

type runtime_resolution_values = {
  before_lookup : Support.Runtime_codec.cljs_value option;
  after_tempid : Support.Runtime_codec.cljs_value option;
}

type encoded_group = { indices : int array; tx : int Js.Nullable.t }
type encoded_reorder_entry = { index : int; kind : string }

type encoded_item_shape = {
  index : int;
  retractBlockUuid : bool;
  hasAttr : bool;
  hasValue : bool;
}

type encoded_item_plan = { index : int; action : string }

type encoded_replacement_entry = {
  index : int;
  replacementGroup : int Js.Nullable.t;
}

type encoded_retraction_action = { action : string; value : int }

type encoded_datom_shape = {
  added : bool;
  entityHasBeforeLookup : bool;
  entityHasAfterTempid : bool;
  resolveValue : bool;
  valueHasBeforeLookup : bool;
  valueHasAfterTempid : bool;
  originalValuePresent : bool;
}

type encoded_datom_plan = {
  operation : string;
  entitySource : string Js.Nullable.t;
  valueSource : string Js.Nullable.t;
}

let collection runtime values =
  Support.Runtime_codec.collection_to_array runtime values
  |> Rrbvec.of_array

let datom runtime value =
  Support.Runtime_codec.collection_to_array runtime value

let equal_prefix runtime left right =
  let rec loop index =
    if index = Array.length left then true
    else if
      Support.Runtime_codec.value_equals runtime left.(index) right.(index)
    then loop (index + 1)
    else false
  in
  Array.length left = Array.length right && loop 0

let removeConflictDatomsWith runtime datoms =
  let values = collection runtime datoms in
  let groups = ref Rrbvec.empty in
  values
  |> Rrbvec.iteri (fun index value ->
      let fields = datom runtime value in
      if Array.length fields < 4 then
        invalid_arg "DB normalization datom requires at least four fields";
      let key = Array.sub fields 0 4 in
      match
        Rrbvec.find_opt
          (fun group -> equal_prefix runtime group.key key)
          !groups
      with
      | Some group -> group.indices := Rrbvec.push_back !(group.indices) index
      | None ->
          groups :=
            Rrbvec.push_back !groups
              {
                key;
                indices = ref (Rrbvec.singleton index);
                tx =
                  (if Support.Runtime_codec.value_is_nil runtime fields.(3)
                   then None
                   else
                     Some
                       (fields.(3)
                       |> Support.Runtime_codec.value_to_string runtime
                       |> int_of_string));
              });
  !groups
  |> Rrbvec.map (fun (group : runtime_conflict_group) ->
      ({ indices = !(group.indices); tx = group.tx } : Domain.conflict_group))
  |> Domain.select_conflict_indices
  |> Rrbvec.map (Rrbvec.nth values)
  |> Rrbvec.to_array
  |> Support.Runtime_codec.array_to_list runtime

let sortDatomsWith runtime datoms =
  let values = collection runtime datoms in
  let priority value =
    let fields = datom runtime value in
    if Array.length fields < 2 then
      invalid_arg "DB normalization datom requires an attribute";
    let attribute = fields.(1) in
    if
      Support.Runtime_codec.value_equals runtime attribute
        (Support.Runtime_codec.keyword_from_string runtime "db/ident")
    then 0
    else if
      Support.Runtime_codec.value_equals runtime attribute
        (Support.Runtime_codec.keyword_from_string runtime "db/valueType")
    then 1
    else if
      Support.Runtime_codec.value_equals runtime attribute
        (Support.Runtime_codec.keyword_from_string runtime "db/cardinality")
    then 2
    else 3
  in
  values |> Rrbvec.map priority |> Domain.sort_priority_indices
  |> Rrbvec.map (Rrbvec.nth values)
  |> Rrbvec.to_array
  |> Support.Runtime_codec.array_to_list runtime

let contains_value runtime values target =
  Rrbvec.exists (Support.Runtime_codec.value_equals runtime target) values

let add_value runtime values value =
  if contains_value runtime values value then values
  else Rrbvec.push_back values value

let retract_entity runtime fields =
  Array.length fields = 2
  && Support.Runtime_codec.value_equals runtime fields.(0)
       (Support.Runtime_codec.keyword_from_string runtime "db/retractEntity")

let retract_target_id runtime fields =
  if not (retract_entity runtime fields) then None
  else
    let target = fields.(1) in
    if not (Support.Runtime_codec.value_is_vector runtime target) then None
    else
      match Support.Runtime_codec.vector_to_array runtime target with
      | [| _attribute; id |] -> Some id
      | _ -> None

let reorderRetractEntityWith runtime tx_data =
  let values = collection runtime tx_data in
  let fields = Rrbvec.map (datom runtime) values in
  let add = Support.Runtime_codec.keyword_from_string runtime "db/add" in
  let uuid_attribute =
    Support.Runtime_codec.keyword_from_string runtime "block/uuid"
  in
  let recreated item_fields =
    match retract_target_id runtime item_fields with
    | None -> false
    | Some id ->
        Rrbvec.exists
          (fun candidate ->
            Array.length candidate >= 4
            && Support.Runtime_codec.value_equals runtime candidate.(0) add
            && Support.Runtime_codec.value_equals runtime candidate.(2)
                 uuid_attribute
            && Support.Runtime_codec.value_equals runtime candidate.(3) id)
          fields
  in
  let retract_keys =
    fields
    |> Rrbvec.fold_left
         (fun result item_fields ->
           if not (retract_entity runtime item_fields) then result
           else
             let entity = item_fields.(1) in
             if not (Support.Runtime_codec.value_is_vector runtime entity)
             then add_value runtime result entity
             else
               match
                 Support.Runtime_codec.vector_to_array runtime entity
               with
               | [| marker; uuid |]
                 when Support.Runtime_codec.value_equals runtime marker
                        uuid_attribute ->
                   let result = add_value runtime result entity in
                   let result = add_value runtime result uuid in
                   add_value runtime result
                     (Support.Runtime_codec.string_to_value runtime
                        (Support.Runtime_codec.value_to_string runtime uuid))
               | _ -> add_value runtime result entity)
         Rrbvec.empty
  in
  fields
  |> Rrbvec.mapi (fun index item_fields ->
      let kind =
        if retract_entity runtime item_fields && recreated item_fields then
          Domain.Recreated_retract
        else if
          Array.length item_fields >= 4
          && contains_value runtime retract_keys item_fields.(1)
        then Domain.Retracted_datom
        else if retract_entity runtime item_fields then Domain.Final_retract
        else Domain.Other
      in
      ({ index; kind } : Domain.reorder_entry))
  |> Domain.reorder_retract_indices
  |> Rrbvec.map (Rrbvec.nth values)
  |> Rrbvec.to_array
  |> Support.Runtime_codec.array_to_list runtime

let removeRetractEntityRefsWith runtime datascript database tx_data =
  let values = collection runtime tx_data in
  let retract =
    Support.Runtime_codec.keyword_from_string runtime "db/retractEntity"
  in
  let retracted =
    values
    |> Rrbvec.filter_map (fun item ->
        let fields = datom runtime item in
        if
          Array.length fields < 2
          || not
               (Support.Runtime_codec.value_equals runtime fields.(0)
                  retract)
        then None
        else
          match
            Support.Datascript.entity datascript database fields.(1)
            |> Js.Nullable.toOption
          with
          | Some _entity -> None
          | None -> Some fields.(1))
  in
  let identifiers =
    retracted
    |> Rrbvec.fold_left
         (fun result target ->
           if not (Support.Runtime_codec.value_is_vector runtime target)
           then result
           else
             match Support.Runtime_codec.vector_to_array runtime target with
             | [| _attribute; uuid |] ->
                 let result = add_value runtime result uuid in
                 add_value runtime result
                   (Support.Runtime_codec.string_to_value runtime
                      (Support.Runtime_codec.value_to_string runtime uuid))
             | _ -> result)
         Rrbvec.empty
  in
  values
  |> Rrbvec.map (fun item ->
      let fields = datom runtime item in
      (not (Rrbvec.is_empty retracted))
      && Array.length fields = 5
      && (contains_value runtime retracted fields.(1)
         || contains_value runtime identifiers fields.(1)
         || contains_value runtime retracted fields.(3)
         || contains_value runtime identifiers fields.(3)))
  |> Domain.retained_indices
  |> Rrbvec.map (Rrbvec.nth values)
  |> Rrbvec.to_array
  |> Support.Runtime_codec.array_to_list runtime

let replaceAttrRetractV2With runtime datascript database tx_data =
  let values = collection runtime tx_data in
  let retract =
    Support.Runtime_codec.keyword_from_string runtime "db/retract"
  in
  let retract_entity =
    Support.Runtime_codec.keyword_from_string runtime "db/retractEntity"
  in
  let block_uuid =
    Support.Runtime_codec.keyword_from_string runtime "block/uuid"
  in
  let value_at fields index =
    if index < Array.length fields then fields.(index)
    else Support.Runtime_codec.nil_value runtime
  in
  let plans =
    values
    |> Rrbvec.mapi (fun index item ->
        let fields = datom runtime item in
        ({
           index;
           retract_block_uuid =
             Array.length fields > 2
             && Support.Runtime_codec.value_equals runtime fields.(0)
                  retract
             && Support.Runtime_codec.value_equals runtime fields.(2)
                  block_uuid;
           has_attr =
             Array.length fields > 2
             && not (Support.Runtime_codec.value_is_nil runtime fields.(2));
           has_value =
             Array.length fields > 3
             && not (Support.Runtime_codec.value_is_nil runtime fields.(3));
         }
          : Domain.item_shape))
    |> Domain.plan_item_actions
  in
  let replaced =
    plans
    |> Rrbvec.map (fun (plan : Domain.item_plan) ->
        let fields = Rrbvec.nth values plan.index |> datom runtime in
        match plan.action with
        | Domain.Retract_entity ->
            Support.Runtime_codec.array_to_vector runtime
              [| retract_entity; value_at fields 1 |]
        | Domain.Keep_item ->
            Support.Runtime_codec.array_to_vector runtime
              [|
                value_at fields 0;
                value_at fields 1;
                value_at fields 2;
                value_at fields 3;
                value_at fields 4;
              |]
        | Domain.Shorten_item ->
            Support.Runtime_codec.array_to_vector runtime
              [| value_at fields 0; value_at fields 1 |])
    |> Rrbvec.to_array
    |> Support.Runtime_codec.array_to_vector runtime
  in
  removeRetractEntityRefsWith runtime datascript database replaced

let replaceAttrRetractWith runtime datascript database tx_data =
  let values = collection runtime tx_data in
  let block_uuid =
    Support.Runtime_codec.keyword_from_string runtime "block/uuid"
  in
  let db_id = Support.Runtime_codec.keyword_from_string runtime "db/id" in
  let retract_entity =
    Support.Runtime_codec.keyword_from_string runtime "db/retractEntity"
  in
  let lookup uuid =
    Support.Runtime_codec.array_to_vector runtime [| block_uuid; uuid |]
  in
  let groups = ref Rrbvec.empty in
  let rec group_index entity index =
    if index >= Rrbvec.length !groups then None
    else
      let group = Rrbvec.nth !groups index in
      if Support.Runtime_codec.value_equals runtime group.entity entity then
        Some index
      else group_index entity (index + 1)
  in
  let add_replacement entity replacement =
    match group_index entity 0 with
    | Some index ->
        let group = Rrbvec.nth !groups index in
        group.replacement := replacement
    | None ->
        groups :=
          Rrbvec.push_back !groups { entity; replacement = ref replacement }
  in
  let as_datom value =
    match
      Support.Datascript.datom_from_value datascript value
      |> Js.Nullable.toOption
    with
    | Some datom -> datom
    | None -> invalid_arg "DB normalization requires a DataScript datom"
  in
  values
  |> Rrbvec.iter (fun value ->
      let datom = as_datom value in
      let attribute = Support.Datascript.datom_attribute datascript datom in
      if
        Support.Runtime_codec.value_equals runtime attribute block_uuid
        && not (Support.Datascript.datom_added datascript datom)
      then
        let entity_id = Support.Datascript.datom_entity datascript datom in
        let uuid = Support.Datascript.datom_value datascript datom in
        let uuid_lookup = lookup uuid in
        let existing =
          Support.Datascript.entity datascript database uuid_lookup
          |> Js.Nullable.toOption
        in
        let existing_id =
          match existing with
          | None -> Support.Runtime_codec.nil_value runtime
          | Some entity ->
              Support.Datascript.entity_get datascript entity db_id
        in
        if
          not
            (Support.Runtime_codec.value_equals runtime existing_id
               entity_id)
        then
          add_replacement entity_id
            (match existing with
            | Some _entity -> entity_id
            | None -> uuid_lookup));
  let entries =
    values
    |> Rrbvec.mapi (fun index value ->
        let datom = as_datom value in
        ({
           index;
           replacement_group =
             group_index
               (Support.Datascript.datom_entity datascript datom)
               0;
         }
          : Domain.replacement_entry))
  in
  entries |> Domain.plan_entity_retractions
  |> Rrbvec.map (function
    | Domain.Emit_retraction group ->
        let replacement_group = Rrbvec.nth !groups group in
        let replacement = !(replacement_group.replacement) in
        Support.Runtime_codec.array_to_vector runtime
          [| retract_entity; replacement |]
    | Domain.Keep_original index -> Rrbvec.nth values index)
  |> Rrbvec.to_array
  |> Support.Runtime_codec.array_to_list runtime

let entity_field runtime datascript entity name =
  Support.Datascript.entity_get datascript entity
    (Support.Runtime_codec.keyword_from_string runtime name)

let eid_to_lookup runtime datascript database eid =
  match
    Support.Datascript.entity datascript database eid
    |> Js.Nullable.toOption
  with
  | None -> None
  | Some entity ->
      let uuid = entity_field runtime datascript entity "block/uuid" in
      if not (Support.Runtime_codec.value_is_nil runtime uuid) then
        Some
          (Support.Runtime_codec.array_to_vector runtime
             [|
               Support.Runtime_codec.keyword_from_string runtime
                 "block/uuid";
               uuid;
             |])
      else
        let ident = entity_field runtime datascript entity "db/ident" in
        if Support.Runtime_codec.value_is_nil runtime ident then None
        else Some ident

let eid_to_tempid runtime datascript database eid =
  match
    Support.Datascript.entity datascript database eid
    |> Js.Nullable.toOption
  with
  | None -> None
  | Some entity ->
      let uuid = entity_field runtime datascript entity "block/uuid" in
      let identifier =
        if not (Support.Runtime_codec.value_is_nil runtime uuid) then
          Some uuid
        else
          let ident = entity_field runtime datascript entity "db/ident" in
          if Support.Runtime_codec.value_is_nil runtime ident then None
          else Some ident
      in
      Option.map
        (fun value ->
          value
          |> Support.Runtime_codec.value_to_string runtime
          |> Support.Runtime_codec.string_to_value runtime)
        identifier

let resolution_values runtime datascript database_before database_after eid =
  {
    before_lookup = eid_to_lookup runtime datascript database_before eid;
    after_tempid = eid_to_tempid runtime datascript database_after eid;
  }

let ref_value_type runtime datascript database_after database_before attribute =
  let ref_type =
    Support.Runtime_codec.keyword_from_string runtime "db.type/ref"
  in
  let database_has_ref_type database =
    match
      Support.Datascript.entity datascript database attribute
      |> Js.Nullable.toOption
    with
    | None -> false
    | Some entity ->
        entity_field runtime datascript entity "db/valueType"
        |> Support.Runtime_codec.value_equals runtime ref_type
  in
  database_has_ref_type database_after || database_has_ref_type database_before

let select_resolution_value values original = function
  | Domain.Before_lookup -> values.before_lookup
  | Domain.After_tempid -> values.after_tempid
  | Domain.Original_value -> Some original

let normalize_datom_value runtime datascript database_after database_before
    value =
  let fields = datom runtime value in
  if Array.length fields <> 5 then
    invalid_arg "DB normalization datom requires five fields";
  let eid = fields.(0) in
  let attribute = fields.(1) in
  let original_value = fields.(2) in
  let tx = fields.(3) in
  let added_value = fields.(4) in
  if not (Support.Runtime_codec.value_is_bool runtime added_value) then
    invalid_arg "DB normalization datom added flag must be boolean";
  let added = Support.Runtime_codec.bool_from_value runtime added_value in
  let resolve_value =
    Support.Runtime_codec.value_is_integer runtime original_value
    && Support.Runtime_codec.int_from_value runtime original_value > 0
    && ref_value_type runtime datascript database_after database_before
         attribute
  in
  let entity_values =
    resolution_values runtime datascript database_before database_after eid
  in
  let value_values =
    if resolve_value then
      resolution_values runtime datascript database_before database_after
        original_value
    else { before_lookup = None; after_tempid = None }
  in
  let plan =
    Domain.plan_datom
      {
        added;
        entity =
          {
            has_before_lookup = Option.is_some entity_values.before_lookup;
            has_after_tempid = Option.is_some entity_values.after_tempid;
          };
        resolve_value;
        value =
          {
            has_before_lookup = Option.is_some value_values.before_lookup;
            has_after_tempid = Option.is_some value_values.after_tempid;
          };
        original_value_present =
          not (Support.Runtime_codec.value_is_nil runtime original_value);
      }
  in
  match plan.operation with
  | Domain.Drop_datom -> None
  | Domain.Add_datom | Domain.Retract_datom ->
      let required label = function
        | Some value -> value
        | None ->
            invalid_arg
              ("DB normalization plan omitted required " ^ label ^ " source")
      in
      let entity_source = required "entity" plan.entity_source in
      let value_source = required "value" plan.value_source in
      let entity =
        select_resolution_value entity_values eid entity_source
        |> required "entity value"
      in
      let normalized_value =
        select_resolution_value value_values original_value value_source
        |> required "datom value"
      in
      let operation =
        match plan.operation with
        | Domain.Add_datom -> "db/add"
        | Domain.Retract_datom -> "db/retract"
        | Domain.Drop_datom -> assert false
      in
      Some
        (Support.Runtime_codec.array_to_vector runtime
           [|
             Support.Runtime_codec.keyword_from_string runtime operation;
             entity;
             attribute;
             normalized_value;
             tx;
           |])

let normalizeDatomWith runtime datascript database_after database_before datom =
  normalize_datom_value runtime datascript database_after database_before datom
  |> Js.Nullable.fromOption

let normalize_retract_entity_item runtime datascript database_before fields =
  if
    Array.length fields <> 2
    || not
         (Support.Runtime_codec.value_equals runtime fields.(0)
            (Support.Runtime_codec.keyword_from_string runtime
               "db/retractEntity"))
  then None
  else
    eid_to_lookup runtime datascript database_before fields.(1)
    |> Option.map (fun lookup ->
        Support.Runtime_codec.array_to_vector runtime
          [| fields.(0); lookup |])

let normalize_tx_item runtime datascript database_after database_before item =
  let fields = datom runtime item in
  match Array.length fields with
  | 5 ->
      normalize_datom_value runtime datascript database_after database_before
        item
  | 2 -> normalize_retract_entity_item runtime datascript database_before fields
  | _ -> None

let stable_distinct runtime values =
  Rrbvec.fold_left
    (fun result value ->
      if
        Rrbvec.exists
          (Support.Runtime_codec.value_equals runtime value)
          result
      then result
      else Rrbvec.push_back result value)
    Rrbvec.empty values

let normalizeTxDataWith runtime datascript database_after database_before
    tx_data =
  let without_conflicts = removeConflictDatomsWith runtime tx_data in
  let replaced =
    replaceAttrRetractWith runtime datascript database_after without_conflicts
  in
  let sorted = sortDatomsWith runtime replaced in
  let normalized =
    collection runtime sorted
    |> Rrbvec.filter_map
         (normalize_tx_item runtime datascript database_after database_before)
    |> Rrbvec.to_array
    |> Support.Runtime_codec.array_to_vector runtime
  in
  removeRetractEntityRefsWith runtime datascript database_after normalized
  |> reorderRetractEntityWith runtime
  |> collection runtime |> stable_distinct runtime |> Rrbvec.to_array
  |> Support.Runtime_codec.array_to_list runtime

let selectConflictIndices groups =
  groups
  |> Array.map (fun group ->
      ({
         indices = Rrbvec.of_array group.indices;
         tx = Js.Nullable.toOption group.tx;
       }
        : Domain.conflict_group))
  |> Rrbvec.of_array |> Domain.select_conflict_indices |> Rrbvec.to_array

let sortPriorityIndices priorities =
  priorities |> Rrbvec.of_array |> Domain.sort_priority_indices
  |> Rrbvec.to_array

let decode_reorder_kind = function
  | "recreated-retract" -> Domain.Recreated_retract
  | "retracted-datom" -> Domain.Retracted_datom
  | "other" -> Domain.Other
  | "final-retract" -> Domain.Final_retract
  | kind -> invalid_arg ("DB normalization: invalid reorder kind " ^ kind)

let reorderRetractIndices entries =
  entries
  |> Array.map (fun (entry : encoded_reorder_entry) ->
      ({ index = entry.index; kind = decode_reorder_kind entry.kind }
        : Domain.reorder_entry))
  |> Rrbvec.of_array |> Domain.reorder_retract_indices |> Rrbvec.to_array

let encode_item_action = function
  | Domain.Retract_entity -> "retract-entity"
  | Domain.Keep_item -> "keep-item"
  | Domain.Shorten_item -> "shorten-item"

let planItemActions items =
  items
  |> Array.map (fun (item : encoded_item_shape) ->
      ({
         index = item.index;
         retract_block_uuid = item.retractBlockUuid;
         has_attr = item.hasAttr;
         has_value = item.hasValue;
       }
        : Domain.item_shape))
  |> Rrbvec.of_array |> Domain.plan_item_actions
  |> Rrbvec.map (fun (plan : Domain.item_plan) ->
      ({ index = plan.index; action = encode_item_action plan.action }
        : encoded_item_plan))
  |> Rrbvec.to_array

let retainedIndices removals =
  removals |> Rrbvec.of_array |> Domain.retained_indices |> Rrbvec.to_array

let planEntityRetractions entries =
  Array.iter
    (fun (entry : encoded_replacement_entry) ->
      match Js.Nullable.toOption entry.replacementGroup with
      | Some group when group < 0 ->
          Js.Exn.raiseError "DB normalization: negative replacement group"
      | Some group when group >= Array.length entries ->
          Js.Exn.raiseError "DB normalization: replacement group out of range"
      | Some _ | None -> ())
    entries;
  entries
  |> Array.map (fun (entry : encoded_replacement_entry) ->
      ({
         index = entry.index;
         replacement_group = Js.Nullable.toOption entry.replacementGroup;
       }
        : Domain.replacement_entry))
  |> Rrbvec.of_array |> Domain.plan_entity_retractions
  |> Rrbvec.map (function
    | Domain.Emit_retraction value ->
        ({ action = "emit-retraction"; value } : encoded_retraction_action)
    | Domain.Keep_original value ->
        ({ action = "keep-original"; value } : encoded_retraction_action))
  |> Rrbvec.to_array

let encode_resolution_source = function
  | Domain.Before_lookup -> "before-lookup"
  | Domain.After_tempid -> "after-tempid"
  | Domain.Original_value -> "original-value"

let encode_datom_operation = function
  | Domain.Drop_datom -> "drop"
  | Domain.Add_datom -> "add"
  | Domain.Retract_datom -> "retract"

let planDatom (shape : encoded_datom_shape) =
  let plan =
    Domain.plan_datom
      {
        added = shape.added;
        entity =
          {
            has_before_lookup = shape.entityHasBeforeLookup;
            has_after_tempid = shape.entityHasAfterTempid;
          };
        resolve_value = shape.resolveValue;
        value =
          {
            has_before_lookup = shape.valueHasBeforeLookup;
            has_after_tempid = shape.valueHasAfterTempid;
          };
        original_value_present = shape.originalValuePresent;
      }
  in
  ({
     operation = encode_datom_operation plan.operation;
     entitySource =
       Js.Nullable.fromOption
         (Option.map encode_resolution_source plan.entity_source);
     valueSource =
       Js.Nullable.fromOption
         (Option.map encode_resolution_source plan.value_source);
   }
    : encoded_datom_plan)
