module Domain = Melange_db.Validation_schema

type encoded_attribute = {
  name : string;
  kind : string;
  text : string Js.Nullable.t;
  truthy : bool;
  nonNil : bool;
  specialValid : bool;
  specialMessage : string;
}

type encoded_error = {
  attribute : string Js.Nullable.t;
  category : string;
  message : string;
}

type encoded_error_group = {
  attribute : string Js.Nullable.t;
  messages : string array;
}

type encoded_workflow_options = {
  dispatchKey : string Js.Nullable.t;
  closedSchema : bool;
  newClosedValue : bool;
  closedValuesValidate : bool;
  skipStrictUrlValidate : bool;
}

type encoded_workflow_result = {
  dispatchKey : string Js.Nullable.t;
  errors : encoded_error_group array;
  errorDetails : encoded_error array;
}

type encoded_entity_error = {
  entity : Support.Runtime_codec.cljs_value;
  dispatchKey : string Js.Nullable.t;
  errors : encoded_error_group array;
  errorDetails : encoded_error array;
}

type encoded_transaction_result = {
  valid : bool;
  errors : encoded_entity_error array;
}

type encoded_transaction_value_result = {
  valid : bool;
  errors : Support.Runtime_codec.cljs_value;
}

type encoded_database_result = {
  datomCount : int;
  entities : Support.Runtime_codec.cljs_value array;
  errors : encoded_entity_error array;
}

type encoded_local_counts = {
  entities : int;
  pages : int;
  blocks : int;
  classes : int;
  properties : int;
  objects : int;
  propertyPairs : int;
  datoms : int;
}

type encoded_local_database_result = {
  errors : encoded_entity_error array;
  counts : encoded_local_counts Js.Nullable.t;
}

let decode_value_kind = function
  | "string" -> Domain.String
  | "int" -> Int
  | "number" -> Number
  | "bool" -> Bool
  | "keyword" -> Keyword
  | "uuid" -> Uuid
  | "instant" -> Instant
  | "int-set" -> Int_set
  | "sequential" -> Sequential
  | "other" -> Other
  | value -> invalid_arg ("unknown validation value kind: " ^ value)

let category_name = function
  | Domain.Missing -> "missing"
  | Type -> "type"
  | Value -> "value"
  | Unknown -> "unknown"
  | Dispatch -> "dispatch"

let validateEntity kind attributes closed =
  attributes
  |> Array.map (fun (attribute : encoded_attribute) ->
      ({
         name = attribute.name;
         kind = decode_value_kind attribute.kind;
         text = Js.Nullable.toOption attribute.text;
         truthy = attribute.truthy;
         non_nil = attribute.nonNil;
         special_valid = attribute.specialValid;
         special_message = attribute.specialMessage;
       }
        : Domain.attribute))
  |> Rrbvec.of_array
  |> Domain.validate_entity ~closed (Domain.kind_of_string kind)
  |> Rrbvec.map (fun error ->
      {
        attribute = error |> Domain.error_attribute |> Js.Nullable.fromOption;
        category = error |> Domain.error_category |> category_name;
        message = Domain.error_message error;
      })
  |> Rrbvec.to_array

let tuple_component runtime tuple index =
  let values = Support.Runtime_codec.collection_to_array runtime tuple in
  if index < Array.length values then values.(index)
  else Support.Runtime_codec.nil_value runtime

let property_options (options : encoded_workflow_options) :
    Validation_property.encoded_validation_options =
  {
    newClosedValue = options.newClosedValue;
    closedValuesValidate = options.closedValuesValidate;
    skipStrictUrlValidate = options.skipStrictUrlValidate;
  }

let property_tuple_valid runtime datascript database options tuple =
  Validation_property.valueValidWith runtime datascript database
    (tuple_component runtime tuple 0)
    (tuple_component runtime tuple 1)
    (property_options options)

let property_tuple_error_message runtime datascript tuple =
  let property = tuple_component runtime tuple 0 in
  let property_type =
    Entity_read.field runtime datascript property "logseq.property/type"
  in
  if Support.Runtime_codec.value_is_nil runtime property_type then
    Melange_db.Validation_property.error_message ""
  else
    property_type
    |> Support.Runtime_codec.keyword_to_string runtime
    |> Melange_db.Validation_property.error_message

let encode_error error =
  {
    attribute = error |> Domain.error_attribute |> Js.Nullable.fromOption;
    category = error |> Domain.error_category |> category_name;
    message = Domain.error_message error;
  }

let workflow_capabilities runtime datascript database
    (options : encoded_workflow_options) =
  let keyword = Support.Runtime_codec.keyword_from_string runtime in
  ({
     map_entries = Support.Runtime_codec.map_to_entries runtime;
     field = Entity_read.field runtime datascript;
     has_field =
       (fun value name ->
         Support.Runtime_codec.map_contains runtime value (keyword name));
     assoc_field =
       (fun value name entry ->
         Support.Runtime_codec.map_assoc runtime value (keyword name) entry);
     lookup_entity =
       (fun value ->
         Support.Datascript.entity datascript database value
         |> Js.Nullable.toOption);
     empty_map = Support.Runtime_codec.entries_to_map runtime [||];
     array_to_vector = Support.Runtime_codec.array_to_vector runtime;
     dispatch =
       (fun entity ->
         Validation_entity.dispatchWith runtime datascript database entity
         |> Js.Nullable.toOption);
     is_nil = Support.Runtime_codec.value_is_nil runtime;
     value_truthy = Support.Runtime_codec.value_truthy runtime;
     is_string = Support.Runtime_codec.value_is_string runtime;
     is_integer = Support.Runtime_codec.value_is_integer runtime;
     is_number = Support.Runtime_codec.value_is_number runtime;
     is_bool = Support.Runtime_codec.value_is_bool runtime;
     is_keyword = Support.Runtime_codec.value_is_keyword runtime;
     is_uuid = Support.Runtime_codec.value_is_uuid runtime;
     is_instant = Support.Runtime_codec.value_is_instant runtime;
     is_set = Support.Runtime_codec.value_is_set runtime;
     is_sequential = Support.Runtime_codec.value_is_sequential runtime;
     keyword_to_string = Support.Runtime_codec.keyword_to_string runtime;
     string_from_value = Support.Runtime_codec.string_from_value runtime;
     value_to_string = Support.Runtime_codec.value_to_string runtime;
     collection_to_array = Support.Runtime_codec.collection_to_array runtime;
     equal = Support.Runtime_codec.value_equals runtime;
     property_tuple_valid =
       property_tuple_valid runtime datascript database options;
     property_tuple_error_message =
       property_tuple_error_message runtime datascript;
   }
    : Support.Runtime_codec.cljs_value Domain.workflow_capabilities)

let encode_result (result : Domain.validation_result) =
  ({
     dispatchKey = Js.Nullable.fromOption result.dispatch_key;
     errors =
       result.errors
       |> Rrbvec.map (fun (group : Domain.error_group) ->
           {
             attribute = Js.Nullable.fromOption group.attribute;
             messages = Rrbvec.to_array group.messages;
           })
       |> Rrbvec.to_array;
     errorDetails =
       result.error_details |> Rrbvec.map encode_error |> Rrbvec.to_array;
   }
    : encoded_workflow_result)

let encode_entity_error
    (error : Support.Runtime_codec.cljs_value Domain.entity_error) =
  let validation = encode_result error.validation in
  ({
     entity = error.entity;
     dispatchKey = validation.dispatchKey;
     errors = validation.errors;
     errorDetails = validation.errorDetails;
   }
    : encoded_entity_error)

let validateEntityWith runtime datascript database entity
    (options : encoded_workflow_options) =
  let capabilities =
    workflow_capabilities runtime datascript database options
  in
  let result =
    Domain.validate_entity_with capabilities
      ~dispatch_key:(Js.Nullable.toOption options.dispatchKey)
      ~closed:options.closedSchema entity
  in
  encode_result result

let validateEntitiesWith runtime datascript database entities
    (options : encoded_workflow_options) =
  let capabilities =
    workflow_capabilities runtime datascript database options
  in
  Domain.validate_entities_with capabilities
    ~dispatch_key:(Js.Nullable.toOption options.dispatchKey)
    ~closed:options.closedSchema (Rrbvec.of_array entities)
  |> Rrbvec.map encode_entity_error
  |> Rrbvec.to_array

let validateDatabaseWith runtime datascript database
    (options : encoded_workflow_options) =
  let capabilities =
    ({
       scan_all_datoms =
         (fun database ->
           Support.Datascript.datoms datascript database
             (Support.Runtime_codec.keyword_from_string runtime "eavt")
             [||]);
       assemble_entities =
         (fun datoms ->
           Validation_datom.entitiesWith runtime datascript datoms
             Js.Nullable.undefined);
       remove_field =
         (fun entity field ->
           Support.Runtime_codec.map_dissoc runtime entity
             (Support.Runtime_codec.keyword_from_string runtime field));
       prepare_entities =
         (fun database entities ->
           Validation_property.prepareEntitiesWith runtime datascript
             database entities);
       validate_entities =
         (fun database entities ->
           Domain.validate_entities_with
             (workflow_capabilities runtime datascript database options)
             ~dispatch_key:(Js.Nullable.toOption options.dispatchKey)
             ~closed:options.closedSchema entities);
     }
      : ( Support.Datascript.database,
          Support.Datascript.datom,
          Support.Runtime_codec.cljs_value )
        Domain.database_capabilities)
  in
  let result = Domain.validate_database_with capabilities database in
  ({
     datomCount = result.datom_count;
     entities = Rrbvec.to_array result.entities;
     errors = result.errors |> Rrbvec.map encode_entity_error |> Rrbvec.to_array;
   }
    : encoded_database_result)

let validateLocalDatabaseWith runtime datascript database
    (options : encoded_workflow_options) include_counts =
  let result = validateDatabaseWith runtime datascript database options in
  let counts =
    if include_counts then
      let counts =
        Validation_database.graphCountsWith runtime datascript database
          result.entities
      in
      Js.Nullable.return
        ({
           entities = counts.entities;
           pages = counts.pages;
           blocks = counts.blocks;
           classes = counts.classes;
           properties = counts.properties;
           objects = counts.objects;
           propertyPairs = counts.propertyPairs;
           datoms = result.datomCount;
         }
          : encoded_local_counts)
    else Js.Nullable.undefined
  in
  ({ errors = result.errors; counts } : encoded_local_database_result)

type print_local_counts_callback =
  (string Js.Nullable.t -> encoded_local_counts -> unit[@u])

let validateLocalDatabaseAndLogWith runtime datascript database options verbose
    db_name (print_counts : print_local_counts_callback) =
  let result =
    validateLocalDatabaseWith runtime datascript database options verbose
  in
  (if verbose then
     match Js.Nullable.toOption result.counts with
     | Some counts -> print_counts db_name counts [@u]
     | None -> invalid_arg "Verbose DB validation requires graph counts");
  result

let error_groups_value runtime groups =
  groups
  |> Rrbvec.map (fun (group : Domain.error_group) ->
      let attribute = Option.value ~default:"entity" group.attribute in
      let messages =
        group.messages
        |> Rrbvec.map (Support.Runtime_codec.string_to_value runtime)
        |> Rrbvec.to_array
        |> Support.Runtime_codec.array_to_vector runtime
      in
      [|
        Support.Runtime_codec.keyword_from_string runtime attribute;
        messages;
      |])
  |> Rrbvec.to_array
  |> Support.Runtime_codec.entries_to_map runtime

let log_transaction_errors runtime changed_ids tx_metadata errors =
  Support.Runtime_codec.log_values runtime
    [|
      Support.Runtime_codec.string_to_value runtime
        "Invalid datascript entities detected amongst changed entity ids:";
      changed_ids |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_vector runtime;
      Support.Runtime_codec.keyword_from_string runtime "tx-meta";
      tx_metadata;
    |];
  Rrbvec.iter
    (fun (error : Support.Runtime_codec.cljs_value Domain.entity_error) ->
      let diagnostic =
        Support.Runtime_codec.entries_to_map runtime
          [|
            [|
              Support.Runtime_codec.keyword_from_string runtime "entity-map";
              error.entity;
            |];
            [|
              Support.Runtime_codec.keyword_from_string runtime "errors";
              error_groups_value runtime error.validation.errors;
            |];
          |]
      in
      Support.Runtime_codec.log_values runtime [| diagnostic |])
    errors

let validateTransactionWith runtime datascript report
    (options : encoded_workflow_options) =
  let entity_callback database =
    Js.Nullable.return (fun[@u] lookup ->
        Support.Datascript.entity datascript database lookup
        |> Js.Nullable.toOption
        |> Option.value ~default:(Support.Runtime_codec.nil_value runtime))
  in
  let capabilities =
    ({
       report_db_after = Support.Datascript.report_db_after datascript;
       report_datoms = Support.Datascript.report_datoms datascript;
       report_tx_metadata = Support.Datascript.report_tx_metadata datascript;
       datom_entity = Support.Datascript.datom_entity datascript;
       equal = Support.Runtime_codec.value_equals runtime;
       scan_entity_datoms =
         (fun database id ->
           Support.Datascript.datoms datascript database
             (Support.Runtime_codec.keyword_from_string runtime "eavt")
             [| id |]);
       assemble_entities =
         (fun database datoms ->
           Validation_datom.entitiesWith runtime datascript datoms
             (entity_callback database));
       prepare_entities =
         (fun database entities ->
           Validation_property.prepareEntitiesWith runtime datascript
             database entities);
       validate_entities =
         (fun database entities ->
           Domain.validate_entities_with
             (workflow_capabilities runtime datascript database options)
             ~dispatch_key:(Js.Nullable.toOption options.dispatchKey)
             ~closed:options.closedSchema entities);
       log_errors = log_transaction_errors runtime;
     }
      : ( Support.Datascript.transaction_report,
          Support.Datascript.database,
          Support.Datascript.datom,
          Support.Runtime_codec.cljs_value )
        Domain.transaction_capabilities)
  in
  let result = Domain.validate_transaction_with capabilities report in
  ({
     valid = result.valid;
     errors = result.errors |> Rrbvec.map encode_entity_error |> Rrbvec.to_array;
   }
    : encoded_transaction_result)

let validateTransactionValueWith runtime datascript report options =
  let result = validateTransactionWith runtime datascript report options in
  let keyword = Support.Runtime_codec.keyword_from_string runtime in
  let map entries =
    entries
    |> Array.map (fun (name, value) -> [| keyword name; value |])
    |> Support.Runtime_codec.entries_to_map runtime
  in
  let optional_keyword = function
    | None -> Support.Runtime_codec.nil_value runtime
    | Some value -> keyword value
  in
  let error_groups groups =
    if Array.length groups = 0 then Support.Runtime_codec.nil_value runtime
    else
      groups
      |> Array.map (fun (group : encoded_error_group) ->
          ( Option.value ~default:"entity" (Js.Nullable.toOption group.attribute),
            group.messages
            |> Array.map (Support.Runtime_codec.string_to_value runtime)
            |> Support.Runtime_codec.array_to_vector runtime ))
      |> map
  in
  let error_detail (detail : encoded_error) =
    map
      [|
        ( "attribute",
          detail.attribute |> Js.Nullable.toOption |> optional_keyword );
        ("category", keyword detail.category);
        ( "message",
          Support.Runtime_codec.string_to_value runtime detail.message );
      |]
  in
  let entity_error (error : encoded_entity_error) =
    map
      [|
        ( "dispatch-key",
          error.dispatchKey |> Js.Nullable.toOption |> optional_keyword );
        ("errors", error_groups error.errors);
        ( "error-details",
          error.errorDetails |> Array.map error_detail
          |> Support.Runtime_codec.array_to_vector runtime );
        ("entity", error.entity);
      |]
  in
  ({
     valid = result.valid;
     errors =
       result.errors |> Array.map entity_error
       |> Support.Runtime_codec.array_to_vector runtime;
   }
    : encoded_transaction_value_result)
