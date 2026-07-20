module Domain = Melange_db.Validation_datom

type decoded_datom = {
  entity_id : int;
  attribute : Support.Runtime_codec.cljs_value;
  attribute_text : string;
  value : Support.Runtime_codec.cljs_value;
}

type entity_fields = {
  entity_id : int;
  fields :
    (Support.Runtime_codec.cljs_value * Support.Runtime_codec.cljs_value) Rrbvec.t;
}

type encoded_entry = {
  index : int;
  entityId : int;
  attribute : string;
  schemaMany : bool;
  valueTruthy : bool;
  valueIsSet : bool;
}

type encoded_action = { kind : string; previousIndex : int Js.Nullable.t }

let action_kind = function
  | Domain.Assign -> "assign"
  | Begin_set -> "begin-set"
  | Start_set -> "start-set"
  | Add_set -> "add-set"

let plan entries =
  entries
  |> Array.map (fun (entry : encoded_entry) ->
      ({
         index = entry.index;
         entity_id = entry.entityId;
         attribute = entry.attribute;
         schema_many = entry.schemaMany;
         value_truthy = entry.valueTruthy;
         value_is_set = entry.valueIsSet;
       }
        : Domain.entry))
  |> Rrbvec.of_array |> Domain.plan
  |> Rrbvec.map (fun action ->
      {
        kind = action |> Domain.kind |> action_kind;
        previousIndex =
          action |> Domain.previous_index |> Js.Nullable.fromOption;
      })
  |> Rrbvec.to_array

let namespace_of_ident ident =
  match String.rindex_opt ident '/' with
  | Some index -> Some (String.sub ident 0 index)
  | None -> None

let field_value runtime attribute fields =
  Rrbvec.find_map
    (fun (candidate, value) ->
      if Support.Runtime_codec.value_equals runtime candidate attribute then
        Some value
      else None)
    fields

let assoc_field runtime fields attribute value =
  let found, fields =
    Rrbvec.fold_left
      (fun (found, result) ((candidate, _) as entry) ->
        if
          (not found)
          && Support.Runtime_codec.value_equals runtime candidate attribute
        then (true, Rrbvec.push_back result (attribute, value))
        else (found, Rrbvec.push_back result entry))
      (false, Rrbvec.empty) fields
  in
  if found then fields else Rrbvec.push_back fields (attribute, value)

let update_entity runtime entities entity_id attribute value =
  let found, entities =
    Rrbvec.fold_left
      (fun (found, result) entity ->
        if (not found) && entity.entity_id = entity_id then
          ( true,
            Rrbvec.push_back result
              {
                entity with
                fields = assoc_field runtime entity.fields attribute value;
              } )
        else (found, Rrbvec.push_back result entity))
      (false, Rrbvec.empty) entities
  in
  if found then entities
  else
    Rrbvec.push_back entities
      { entity_id; fields = Rrbvec.singleton (attribute, value) }

let existing_field runtime entities entity_id attribute =
  match
    Rrbvec.find_opt (fun entity -> entity.entity_id = entity_id) entities
  with
  | None -> None
  | Some entity -> field_value runtime attribute entity.fields

let set_of_values runtime values =
  values |> Rrbvec.to_array |> Support.Runtime_codec.array_to_set runtime

let apply_action runtime datoms entities index action =
  let datom = datoms.(index) in
  let value =
    match Domain.kind action with
    | Domain.Assign -> datom.value
    | Begin_set -> set_of_values runtime (Rrbvec.singleton datom.value)
    | Start_set -> (
        match Domain.previous_index action with
        | Some previous_index ->
            set_of_values runtime
              (Rrbvec.of_array [| datoms.(previous_index).value; datom.value |])
        | None -> invalid_arg "start-set action requires a previous datom")
    | Add_set -> (
        match
          existing_field runtime entities datom.entity_id datom.attribute
        with
        | Some current ->
            current
            |> Support.Runtime_codec.set_to_array runtime
            |> Rrbvec.of_array
            |> fun values ->
            set_of_values runtime (Rrbvec.push_back values datom.value)
        | None -> invalid_arg "add-set action requires an existing set")
  in
  update_entity runtime entities datom.entity_id datom.attribute value

let resolve_default_property runtime entities ident =
  let db_ident =
    Support.Runtime_codec.keyword_from_string runtime "db/ident"
  in
  entities
  |> Rrbvec.find_map (fun entity ->
      match field_value runtime db_ident entity.fields with
      | Some candidate
        when Support.Runtime_codec.value_equals runtime candidate ident ->
          Some
            (entity.fields |> Rrbvec.to_array
            |> Array.map (fun (key, value) -> [| key; value |])
            |> Support.Runtime_codec.entries_to_map runtime)
      | _ -> None)

let resolve_property runtime entity_fn entities ident =
  match Js.Nullable.toOption entity_fn with
  | Some callback ->
      let property =
        Support.Runtime_codec.invoke_callback runtime callback ident
      in
      if Support.Runtime_codec.value_is_nil runtime property then None
      else Some property
  | None -> resolve_default_property runtime entities ident

let property_attribute runtime attribute attribute_text =
  Melange_db.Property_identity.is_property
    ~namespace_:(namespace_of_ident attribute_text)
    ~ident:attribute_text
    ~is_keyword:(Support.Runtime_codec.value_is_keyword runtime attribute)

let property_is_many runtime datascript property =
  let cardinality =
    Entity_read.field runtime datascript property "db/cardinality"
  in
  (not (Support.Runtime_codec.value_is_nil runtime cardinality))
  && Melange_db.Property_shape.is_many
       (Support.Runtime_codec.keyword_to_string runtime cardinality)

let normalize_entity runtime datascript entity_fn entities entity =
  let fields =
    entity.fields
    |> Rrbvec.map (fun (attribute, value) ->
        let attribute_text =
          Support.Runtime_codec.keyword_to_string runtime attribute
        in
        let value =
          if
            property_attribute runtime attribute attribute_text
            && not (Support.Runtime_codec.value_is_set runtime value)
          then
            match resolve_property runtime entity_fn entities attribute with
            | Some property when property_is_many runtime datascript property ->
                set_of_values runtime (Rrbvec.singleton value)
            | _ -> value
          else value
        in
        (attribute, value))
  in
  { entity with fields }

let assemble runtime datascript datoms entity_fn =
  let decoded =
    datoms
    |> Array.map (fun datom ->
        let attribute =
          Support.Datascript.datom_attribute datascript datom
        in
        {
          entity_id =
            datom
            |> Support.Datascript.datom_entity datascript
            |> Support.Runtime_codec.int_from_value runtime;
          attribute;
          attribute_text =
            Support.Runtime_codec.keyword_to_string runtime attribute;
          value = Support.Datascript.datom_value datascript datom;
        })
  in
  let actions =
    decoded
    |> Array.mapi (fun index (datom : decoded_datom) ->
        ({
           index;
           entity_id = datom.entity_id;
           attribute = datom.attribute_text;
           schema_many =
             Rrbvec.mem datom.attribute_text
               Melange_db.Schema.card_many_attributes;
           value_truthy =
             Support.Runtime_codec.value_truthy runtime datom.value;
           value_is_set =
             Support.Runtime_codec.value_is_set runtime datom.value;
         }
          : Domain.entry))
    |> Rrbvec.of_array |> Domain.plan |> Rrbvec.to_array
  in
  actions
  |> Array.mapi (fun index action -> (index, action))
  |> Array.fold_left
       (fun entities (index, action) ->
         apply_action runtime decoded entities index action)
       Rrbvec.empty
  |> fun entities ->
  Rrbvec.map (normalize_entity runtime datascript entity_fn entities) entities

let encode_entity runtime entity =
  entity.fields |> Rrbvec.to_array
  |> Array.map (fun (key, value) -> [| key; value |])
  |> Support.Runtime_codec.entries_to_map runtime

let entityMapsWith runtime datascript datoms entity_fn =
  assemble runtime datascript datoms entity_fn
  |> Rrbvec.map (fun entity ->
      [|
        Support.Runtime_codec.int_to_value runtime entity.entity_id;
        encode_entity runtime entity;
      |])
  |> Rrbvec.to_array
  |> Support.Runtime_codec.entries_to_map runtime

let entitiesWith runtime datascript datoms entity_fn =
  let db_id = Support.Runtime_codec.keyword_from_string runtime "db/id" in
  assemble runtime datascript datoms entity_fn
  |> Rrbvec.map (fun entity ->
      Support.Runtime_codec.map_assoc runtime
        (encode_entity runtime entity)
        db_id
        (Support.Runtime_codec.int_to_value runtime entity.entity_id))
  |> Rrbvec.to_array
