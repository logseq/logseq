type attribute_action = Keep | Move_property | Prepare_tags
type plan = { many : bool; uses_db : bool; closed_membership_required : bool }
type value_result = { base_valid : bool; closed_value_member : bool }

type validation_options = {
  new_closed_value : bool;
  closed_values_validate : bool;
  skip_strict_url_validate : bool;
}

type 'value validation_capabilities = {
  field : 'value -> string -> 'value;
  entity : 'value -> 'value option;
  has_tag : 'value -> string -> bool;
  is_nil : 'value -> bool;
  is_string : 'value -> bool;
  is_bool : 'value -> bool;
  is_number : 'value -> bool;
  is_integer : 'value -> bool;
  is_keyword : 'value -> bool;
  is_vector : 'value -> bool;
  is_set : 'value -> bool;
  is_map : 'value -> bool;
  is_sequential : 'value -> bool;
  string_from_value : 'value -> string;
  string_is_url : string -> bool;
  is_macro : string -> bool;
  keyword_to_string : 'value -> string;
  keyword_from_string : string -> 'value;
  collection_to_array : 'value -> 'value array;
  equal : 'value -> 'value -> bool;
  nil_value : 'value;
  value_to_string : 'value -> string;
  log_error : string -> unit;
}

let push_unique values value =
  if Rrbvec.mem value values then values else Rrbvec.push_back values value

let asset_required_properties =
  Class_catalog.entries
  |> Rrbvec.find_opt (fun entry ->
      String.equal (Class_catalog.ident entry) "logseq.class/Asset")
  |> Option.map Class_catalog.required_properties
  |> Option.value ~default:Rrbvec.empty

let required_properties =
  Rrbvec.of_array
    [|
      "logseq.property/created-from-property";
      "logseq.property/value";
      "logseq.property.history/scalar-value";
      "logseq.property.history/block";
      "logseq.property.history/property";
      "logseq.property.history/ref-value";
      "logseq.property.class/extends";
      "logseq.property.reaction/emoji-id";
      "logseq.property.reaction/target";
    |]
  |> Rrbvec.fold_left push_unique asset_required_properties

let exception_properties =
  Rrbvec.fold_left push_unique required_properties
    Property_catalog.schema_properties
  |> fun values -> push_unique values "block/tags"

let attribute_action ~attribute ~is_property ~property_exists =
  if String.equal attribute "block/tags" then Prepare_tags
  else if
    is_property && property_exists
    && not (Rrbvec.mem attribute exception_properties)
  then Move_property
  else Keep

let property_type_member property_type values =
  Option.bind property_type Property_type.of_string
  |> Option.fold ~none:false ~some:(fun value -> Rrbvec.mem value values)

let plan_value_validation ~property_type ~cardinality ~closed_values_validate
    ~new_closed_value ~has_closed_values =
  {
    many = Option.equal String.equal cardinality (Some "db.cardinality/many");
    uses_db = property_type_member property_type Property_type.with_db;
    closed_membership_required =
      closed_values_validate
      && property_type_member property_type Property_type.closed_value
      && (not new_closed_value) && has_closed_values;
  }

let many plan = plan.many
let uses_db plan = plan.uses_db
let closed_membership_required plan = plan.closed_membership_required

let validate_value_results plan results ~empty_placeholder =
  if (not plan.many) && Rrbvec.length results <> 1 then
    invalid_arg "scalar property validation requires exactly one value result";
  let values_valid =
    Rrbvec.fold_left
      (fun valid result ->
        valid && result.base_valid
        && ((not plan.closed_membership_required) || result.closed_value_member))
      true results
  in
  values_valid || empty_placeholder

let scalar_value_valid_with capabilities options property_type value =
  let entity () = capabilities.entity value in
  let entity_has_tag ident =
    entity ()
    |> Option.fold ~none:false ~some:(fun entity ->
        capabilities.has_tag entity ident)
  in
  let entity_field name predicate =
    entity ()
    |> Option.fold ~none:false ~some:(fun entity ->
        capabilities.field entity name |> predicate)
  in
  let string_is_url value =
    if not (capabilities.is_string value) then false
    else
      let text = capabilities.string_from_value value in
      capabilities.string_is_url text || capabilities.is_macro text
  in
  match property_type with
  | "string" | "json" -> capabilities.is_string value
  | "raw-number" | "datetime" -> capabilities.is_number value
  | "entity" -> Option.is_some (entity ())
  | "class" -> entity_has_tag "logseq.class/Tag"
  | "property" -> entity_has_tag "logseq.class/Property"
  | "page" ->
      [|
        "logseq.class/Page";
        "logseq.class/Journal";
        "logseq.class/Tag";
        "logseq.class/Property";
      |]
      |> Array.exists entity_has_tag
  | "keyword" -> capabilities.is_keyword value
  | "map" -> capabilities.is_map value
  | "coll" ->
      capabilities.is_sequential value
      || capabilities.is_vector value
      || capabilities.is_set value || capabilities.is_map value
  | "any" -> not (capabilities.is_nil value)
  | "default" ->
      if options.new_closed_value then capabilities.is_string value
      else
        entity ()
        |> Option.fold ~none:false ~some:(fun entity ->
            let title = capabilities.field entity "block/title" in
            let page = capabilities.field entity "block/page" in
            capabilities.is_string title && not (capabilities.is_nil page))
  | "number" ->
      if options.new_closed_value then capabilities.is_number value
      else entity_field "logseq.property/value" capabilities.is_number
  | "date" ->
      entity ()
      |> Option.fold ~none:false ~some:(fun entity ->
          let title = capabilities.field entity "block/title" in
          (not (capabilities.is_nil title))
          && capabilities.has_tag entity "logseq.class/Journal")
  | "checkbox" -> capabilities.is_bool value
  | "url" ->
      if options.new_closed_value then string_is_url value
      else
        entity ()
        |> Option.fold ~none:false ~some:(fun entity ->
            let title = capabilities.field entity "block/title" in
            if options.skip_strict_url_validate then
              capabilities.is_string title
            else if not (capabilities.is_string title) then false
            else
              let text = capabilities.string_from_value title in
              String.equal (String.trim text) ""
              || capabilities.string_is_url text
              || capabilities.is_macro text)
  | "node" ->
      entity_field "block/title" (fun title -> not (capabilities.is_nil title))
  | "asset" ->
      entity ()
      |> Option.fold ~none:false ~some:(fun entity ->
          let title = capabilities.field entity "block/title" in
          (not (capabilities.is_nil title))
          && capabilities.has_tag entity "logseq.class/Asset")
  | _ -> false

let closed_value_ids capabilities property =
  let values = capabilities.field property "property/closed-values" in
  if capabilities.is_nil values then [||]
  else
    values |> capabilities.collection_to_array
    |> Array.map (fun value -> capabilities.field value "db/id")

let closed_value_member capabilities closed_ids value =
  Array.exists (capabilities.equal value) closed_ids

let empty_placeholder capabilities property value =
  let placeholder =
    capabilities.keyword_from_string "logseq.property/empty-placeholder"
  in
  let value_type = capabilities.field property "db/valueType" in
  let ref_type = capabilities.keyword_from_string "db.type/ref" in
  if capabilities.equal value_type ref_type then
    capabilities.is_integer value
    && capabilities.entity value
       |> Option.fold ~none:false ~some:(fun entity ->
           capabilities.field entity "db/ident"
           |> capabilities.equal placeholder)
  else capabilities.equal value placeholder

let value_valid_with capabilities options ~property ~property_value =
  let property_type_value =
    capabilities.field property "logseq.property/type"
  in
  let property_type =
    if capabilities.is_nil property_type_value then None
    else Some (capabilities.keyword_to_string property_type_value)
  in
  let cardinality_value = capabilities.field property "db/cardinality" in
  let cardinality =
    if capabilities.is_nil cardinality_value then None
    else Some (capabilities.keyword_to_string cardinality_value)
  in
  let closed_ids = closed_value_ids capabilities property in
  let plan =
    plan_value_validation ~property_type ~cardinality
      ~closed_values_validate:options.closed_values_validate
      ~new_closed_value:options.new_closed_value
      ~has_closed_values:(Array.length closed_ids > 0)
  in
  let values =
    if many plan then capabilities.collection_to_array property_value
    else [| property_value |]
  in
  let results =
    values
    |> Array.map (fun value ->
        let base_valid =
          property_type
          |> Option.fold ~none:false ~some:(fun property_type ->
              scalar_value_valid_with capabilities options property_type value)
        in
        let closed_value_member =
          closed_value_member capabilities closed_ids value
        in
        (if
           base_valid
           && closed_membership_required plan
           && not closed_value_member
         then
           let choices =
             closed_ids
             |> Array.map capabilities.value_to_string
             |> Js.Array.join ~sep:", "
           in
           let property_ident =
             capabilities.field property "db/ident"
             |> capabilities.value_to_string
           in
           capabilities.log_error
             (Printf.sprintf
                "Error: not a closed value, id: %s, existing choices: {%s}, \
                 property: %s"
                (capabilities.value_to_string value)
                choices property_ident));
        { base_valid; closed_value_member })
    |> Rrbvec.of_array
  in
  let placeholder_value =
    if many plan then
      if Array.length values = 0 then capabilities.nil_value else values.(0)
    else property_value
  in
  validate_value_results plan results
    ~empty_placeholder:
      (empty_placeholder capabilities property placeholder_value)

let error_messages =
  Rrbvec.of_array
  [|
    ("string", "should be a string");
    ("json", "should be JSON string");
    ("raw-number", "should be a raw number");
    ("entity", "should be an Entity");
    ("class", "should be a Class");
    ("property", "should be a Property");
    ("page", "should be a Page");
    ("keyword", "should be a Clojure keyword");
    ("map", "should be a Clojure map");
    ("coll", "should be a collection");
    ("any", "should be non-nil");
    ("default", "should be a text block");
    ("number", "should be a number");
    ("date", "should be a journal date");
    ("datetime", "should be a datetime");
    ("checkbox", "should be a boolean");
    ("url", "should be a URL");
    ("node", "should be a node with a title");
    ("asset", "should be an asset node");
  |]

let find_error_message property_type =
  Rrbvec.find_map
    (fun (candidate, message) ->
      if String.equal candidate property_type then Some message else None)
    error_messages

let error_message property_type =
  find_error_message property_type
  |> Option.value ~default:"should have a registered property type"

let registered_property_type property_type =
  Option.is_some (find_error_message property_type)
