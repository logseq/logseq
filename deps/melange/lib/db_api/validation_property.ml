module Domain = Melange_db.Validation_property

let requiredProperties = Domain.required_properties |> Rrbvec.to_array
let errorMessage = Domain.error_message
let registeredPropertyType = Domain.registered_property_type

let attributeAction attribute is_property property_exists =
  match Domain.attribute_action ~attribute ~is_property ~property_exists with
  | Domain.Keep -> "keep"
  | Move_property -> "move-property"
  | Prepare_tags -> "prepare-tags"

type encoded_plan = {
  many : bool;
  usesDb : bool;
  closedMembershipRequired : bool;
}

type encoded_value_result = { baseValid : bool; closedValueMember : bool }

type encoded_validation_options = {
  newClosedValue : bool;
  closedValuesValidate : bool;
  skipStrictUrlValidate : bool;
}

let encode_plan (plan : Domain.plan) =
  {
    many = Domain.many plan;
    usesDb = Domain.uses_db plan;
    closedMembershipRequired = Domain.closed_membership_required plan;
  }

let decode_plan (plan : encoded_plan) : Domain.plan =
  {
    many = plan.many;
    uses_db = plan.usesDb;
    closed_membership_required = plan.closedMembershipRequired;
  }

let planValueValidation property_type cardinality closed_values_validate
    new_closed_value has_closed_values =
  Domain.plan_value_validation
    ~property_type:(Js.Nullable.toOption property_type)
    ~cardinality:(Js.Nullable.toOption cardinality)
    ~closed_values_validate ~new_closed_value ~has_closed_values
  |> encode_plan

let validateValueResults plan results empty_placeholder =
  results
  |> Array.map (fun (result : encoded_value_result) ->
      ({
         base_valid = result.baseValid;
         closed_value_member = result.closedValueMember;
       }
        : Domain.value_result))
  |> Rrbvec.of_array
  |> Domain.validate_value_results (decode_plan plan) ~empty_placeholder

let field runtime datascript entity name =
  Entity_read.field runtime datascript entity name

let optional_ident_text runtime value =
  if Support.Runtime_codec.value_is_nil runtime value then None
  else if Support.Runtime_codec.value_is_keyword runtime value then
    Some (Support.Runtime_codec.keyword_to_string runtime value)
  else Some (Support.Runtime_codec.value_to_string runtime value)

let property_type_name runtime value =
  optional_ident_text runtime value
  |> Option.map (fun value ->
      match String.rindex_opt value '/' with
      | Some index ->
          String.sub value (index + 1) (String.length value - index - 1)
      | None -> value)

let validatePropertyValueWith runtime datascript database property
    property_value (options : encoded_validation_options)
    (validate_simple : Support.Runtime_codec.callback)
    (validate_with_database : Support.Runtime_codec.callback) =
  let closed_values =
    field runtime datascript property "property/closed-values"
  in
  let closed_values =
    if Support.Runtime_codec.value_is_nil runtime closed_values then [||]
    else Support.Runtime_codec.collection_to_array runtime closed_values
  in
  let closed_value_ids =
    Array.map
      (fun value -> field runtime datascript value "db/id")
      closed_values
  in
  let plan =
    Domain.plan_value_validation
      ~property_type:
        (field runtime datascript property "logseq.property/type"
        |> property_type_name runtime)
      ~cardinality:
        (field runtime datascript property "db/cardinality"
        |> optional_ident_text runtime)
      ~closed_values_validate:options.closedValuesValidate
      ~new_closed_value:options.newClosedValue
      ~has_closed_values:(Array.length closed_values > 0)
  in
  let values =
    if Domain.many plan then
      Support.Runtime_codec.collection_to_array runtime property_value
    else [| property_value |]
  in
  let results =
    values
    |> Array.map (fun value ->
        let callback =
          if Domain.uses_db plan then validate_with_database
          else validate_simple
        in
        let base_valid =
          Support.Runtime_codec.invoke_callback runtime callback value
          |> Support.Runtime_codec.bool_from_value runtime
        in
        let closed_value_member =
          Array.exists
            (Support.Runtime_codec.value_equals runtime value)
            closed_value_ids
        in
        if
          base_valid
          && Domain.closed_membership_required plan
          && not closed_value_member
        then
          Support.Runtime_codec.log_error runtime
            ("Error: not a closed value, id: "
            ^ Support.Runtime_codec.value_to_string runtime value);
        ({ base_valid; closed_value_member } : Domain.value_result))
    |> Rrbvec.of_array
  in
  let placeholder_value =
    if Domain.many plan then
      if Array.length values = 0 then
        Support.Runtime_codec.nil_value runtime
      else values.(0)
    else property_value
  in
  let placeholder_ident =
    Support.Runtime_codec.keyword_from_string runtime
      "logseq.property/empty-placeholder"
  in
  let value_type = field runtime datascript property "db/valueType" in
  let reference_type =
    Support.Runtime_codec.value_equals runtime value_type
      (Support.Runtime_codec.keyword_from_string runtime "db.type/ref")
  in
  let empty_placeholder =
    if reference_type then
      Support.Runtime_codec.value_is_integer runtime placeholder_value
      &&
      match
        Support.Datascript.entity datascript database placeholder_value
        |> Js.Nullable.toOption
      with
      | Some entity ->
          field runtime datascript entity "db/ident"
          |> Support.Runtime_codec.value_equals runtime placeholder_ident
      | None -> false
    else
      Support.Runtime_codec.value_equals runtime placeholder_value
        placeholder_ident
  in
  Domain.validate_value_results plan ~empty_placeholder results

let namespace_of_ident ident =
  match String.rindex_opt ident '/' with
  | Some index -> Some (String.sub ident 0 index)
  | None -> None

let valueValidWith runtime datascript database property property_value
    (options : encoded_validation_options) =
  let capabilities :
      Support.Runtime_codec.cljs_value Domain.validation_capabilities =
    {
      field = field runtime datascript;
      entity =
        (fun value ->
          Support.Datascript.entity datascript database value
          |> Js.Nullable.toOption);
      has_tag = Entity_read.has_tag_bool runtime datascript;
      is_nil = Support.Runtime_codec.value_is_nil runtime;
      is_string = Support.Runtime_codec.value_is_string runtime;
      is_bool = Support.Runtime_codec.value_is_bool runtime;
      is_number = Support.Runtime_codec.value_is_number runtime;
      is_integer = Support.Runtime_codec.value_is_integer runtime;
      is_keyword = Support.Runtime_codec.value_is_keyword runtime;
      is_vector = Support.Runtime_codec.value_is_vector runtime;
      is_set = Support.Runtime_codec.value_is_set runtime;
      is_map = Support.Runtime_codec.value_is_map runtime;
      is_sequential = Support.Runtime_codec.value_is_sequential runtime;
      string_from_value = Support.Runtime_codec.string_from_value runtime;
      string_is_url = Support.Runtime_codec.string_is_url runtime;
      is_macro = Melange_common.Macro.is_macro;
      keyword_to_string = Support.Runtime_codec.keyword_to_string runtime;
      keyword_from_string =
        Support.Runtime_codec.keyword_from_string runtime;
      collection_to_array =
        Support.Runtime_codec.collection_to_array runtime;
      equal = Support.Runtime_codec.value_equals runtime;
      nil_value = Support.Runtime_codec.nil_value runtime;
      value_to_string = Support.Runtime_codec.value_to_string runtime;
      log_error = Support.Runtime_codec.log_error runtime;
    }
  in
  let validation_options : Domain.validation_options =
    {
      new_closed_value = options.newClosedValue;
      closed_values_validate = options.closedValuesValidate;
      skip_strict_url_validate = options.skipStrictUrlValidate;
    }
  in
  Domain.value_valid_with capabilities validation_options ~property
    ~property_value

let rec recycled_parent runtime datascript seen parent =
  let id = field runtime datascript parent "db/id" in
  if Support.Runtime_codec.value_is_nil runtime id then false
  else if Rrbvec.exists (Support.Runtime_codec.value_equals runtime id) seen
  then false
  else
    let deleted =
      field runtime datascript parent "logseq.property/deleted-at"
      |> Support.Runtime_codec.value_truthy runtime
    in
    if deleted then true
    else
      let next = field runtime datascript parent "block/parent" in
      (not (Support.Runtime_codec.value_is_nil runtime next))
      && recycled_parent runtime datascript (Rrbvec.push_front seen id) next

let recycled runtime datascript entity =
  let deleted =
    field runtime datascript entity "logseq.property/deleted-at"
    |> Support.Runtime_codec.value_truthy runtime
  in
  if deleted then true
  else
    let parent = field runtime datascript entity "block/parent" in
    (not (Support.Runtime_codec.value_is_nil runtime parent))
    && recycled_parent runtime datascript Rrbvec.empty parent

let closed_values runtime datascript property =
  let direct = field runtime datascript property "property/closed-values" in
  let values =
    if Support.Runtime_codec.value_truthy runtime direct then direct
    else field runtime datascript property "block/_closed-value-property"
  in
  if Support.Runtime_codec.value_is_nil runtime values then [||]
  else
    let values =
      values
      |> Support.Runtime_codec.collection_to_array runtime
      |> Rrbvec.of_array
      |> Rrbvec.filter (fun value -> not (recycled runtime datascript value))
      |> Rrbvec.to_array
    in
    Array.sort
      (fun left right ->
        String.compare
          (field runtime datascript left "block/order"
          |> Support.Runtime_codec.value_to_string runtime)
          (field runtime datascript right "block/order"
          |> Support.Runtime_codec.value_to_string runtime))
      values;
    values

let property_entity_to_map runtime datascript property =
  let map = Support.Runtime_codec.entries_to_map runtime [||] in
  match property with
  | None -> map
  | Some property ->
      let map =
        Rrbvec.of_array
          [|
            "db/ident"; "db/valueType"; "db/cardinality"; "logseq.property/type";
          |]
        |> Rrbvec.fold_left
             (fun map name ->
               let value = field runtime datascript property name in
               if Support.Runtime_codec.value_is_nil runtime value then map
               else
                 Support.Runtime_codec.map_assoc runtime map
                   (Support.Runtime_codec.keyword_from_string runtime name)
                   value)
             map
      in
      let values = closed_values runtime datascript property in
      if Array.length values = 0 then map
      else
        Support.Runtime_codec.map_assoc runtime map
          (Support.Runtime_codec.keyword_from_string runtime
             "property/closed-values")
          (Support.Runtime_codec.array_to_vector runtime values)

let entity_lookup runtime datascript database ident =
  Support.Datascript.entity datascript database
    (Support.Runtime_codec.keyword_from_string runtime ident)
  |> Js.Nullable.toOption

let entity_id runtime datascript database ident =
  match entity_lookup runtime datascript database ident with
  | Some entity -> field runtime datascript entity "db/id"
  | None -> Support.Runtime_codec.nil_value runtime

let property_attribute runtime attribute =
  let is_keyword =
    Support.Runtime_codec.value_is_keyword runtime attribute
  in
  let ident =
    if is_keyword then
      Support.Runtime_codec.keyword_to_string runtime attribute
    else Support.Runtime_codec.value_to_string runtime attribute
  in
  ( ident,
    Melange_db.Property_identity.is_property
      ~namespace_:(if is_keyword then namespace_of_ident ident else None)
      ~ident ~is_keyword )

let append_property runtime result property value =
  let key =
    Support.Runtime_codec.keyword_from_string runtime "block/properties"
  in
  let current = Support.Runtime_codec.map_get runtime result key in
  let values =
    if Support.Runtime_codec.value_is_nil runtime current then [||]
    else Support.Runtime_codec.collection_to_array runtime current
  in
  let pair =
    Support.Runtime_codec.array_to_vector runtime [| property; value |]
  in
  Support.Runtime_codec.map_assoc runtime result key
    (Support.Runtime_codec.array_to_vector runtime
       (Array.append values [| pair |]))

let tags_options runtime entity page_class_id all_page_class_ids =
  let built_in =
    Support.Runtime_codec.keyword_from_string runtime
      "logseq.property/built-in?"
  in
  let entries =
    if Support.Runtime_codec.map_contains runtime entity built_in then
      [|
        [|
          built_in; Support.Runtime_codec.map_get runtime entity built_in;
        |];
      |]
    else [||]
  in
  Array.append entries
    [|
      [|
        Support.Runtime_codec.keyword_from_string runtime "page-class-id";
        page_class_id;
      |];
      [|
        Support.Runtime_codec.keyword_from_string runtime
          "all-page-class-ids";
        all_page_class_ids;
      |];
    |]
  |> Support.Runtime_codec.entries_to_map runtime

let prepare_entity runtime datascript database page_class_id all_page_class_ids
    entity =
  entity
  |> Support.Runtime_codec.map_to_entries runtime
  |> Array.fold_left
       (fun result entry ->
         let attribute = entry.(0) in
         let value = entry.(1) in
         let attribute_text, is_property =
           property_attribute runtime attribute
         in
         let property =
           if is_property then
             Support.Datascript.entity datascript database attribute
             |> Js.Nullable.toOption
           else None
         in
         match
           Domain.attribute_action ~attribute:attribute_text ~is_property
             ~property_exists:(Option.is_some property)
         with
         | Domain.Keep ->
             Support.Runtime_codec.map_assoc runtime result attribute value
         | Move_property ->
             append_property runtime result
               (property_entity_to_map runtime datascript property)
               value
         | Prepare_tags ->
             let tags_property =
               entity_lookup runtime datascript database "block/tags"
               |> property_entity_to_map runtime datascript
             in
             let options =
               tags_options runtime entity page_class_id all_page_class_ids
             in
             Support.Runtime_codec.map_assoc runtime result attribute
               (Support.Runtime_codec.array_to_vector runtime
                  [| tags_property; value; options |]))
       (Support.Runtime_codec.entries_to_map runtime [||])

let prepareEntitiesWith runtime datascript database entities =
  let page_class_id =
    entity_id runtime datascript database "logseq.class/Page"
  in
  let all_page_class_ids =
    Melange_db.Class_catalog.page_classes
    |> Rrbvec.map (entity_id runtime datascript database)
    |> Rrbvec.to_array
    |> Support.Runtime_codec.array_to_set runtime
  in
  entities
  |> Array.map
       (prepare_entity runtime datascript database page_class_id
          all_page_class_ids)
