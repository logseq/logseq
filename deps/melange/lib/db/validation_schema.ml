type value_kind =
  | String
  | Int
  | Number
  | Bool
  | Keyword
  | Uuid
  | Instant
  | Int_set
  | Sequential
  | Other

type attribute = {
  name : string;
  kind : value_kind;
  text : string option;
  truthy : bool;
  non_nil : bool;
  special_valid : bool;
  special_message : string;
}

type error_category = Missing | Type | Value | Unknown | Dispatch

type error = {
  attribute : string option;
  category : error_category;
  message : string;
}

type error_group = { attribute : string option; messages : string Rrbvec.t }

type validation_result = {
  dispatch_key : string option;
  errors : error_group Rrbvec.t;
  error_details : error Rrbvec.t;
}

type 'value entity_error = { entity : 'value; validation : validation_result }

type ('report, 'database, 'datom, 'value) transaction_capabilities = {
  report_db_after : 'report -> 'database;
  report_datoms : 'report -> 'datom array;
  report_tx_metadata : 'report -> 'value;
  datom_entity : 'datom -> 'value;
  equal : 'value -> 'value -> bool;
  scan_entity_datoms : 'database -> 'value -> 'datom array;
  assemble_entities : 'database -> 'datom array -> 'value array;
  prepare_entities : 'database -> 'value array -> 'value array;
  validate_entities :
    'database -> 'value Rrbvec.t -> 'value entity_error Rrbvec.t;
  log_errors : 'value Rrbvec.t -> 'value -> 'value entity_error Rrbvec.t -> unit;
}

type 'value transaction_result = {
  valid : bool;
  errors : 'value entity_error Rrbvec.t;
}

type ('database, 'datom, 'value) database_capabilities = {
  scan_all_datoms : 'database -> 'datom array;
  assemble_entities : 'datom array -> 'value array;
  remove_field : 'value -> string -> 'value;
  prepare_entities : 'database -> 'value array -> 'value array;
  validate_entities :
    'database -> 'value Rrbvec.t -> 'value entity_error Rrbvec.t;
}

type 'value database_result = {
  datom_count : int;
  entities : 'value Rrbvec.t;
  errors : 'value entity_error Rrbvec.t;
}

type 'value workflow_capabilities = {
  map_entries : 'value -> 'value array array;
  field : 'value -> string -> 'value;
  has_field : 'value -> string -> bool;
  assoc_field : 'value -> string -> 'value -> 'value;
  lookup_entity : 'value -> 'value option;
  empty_map : 'value;
  array_to_vector : 'value array -> 'value;
  dispatch : 'value -> string option;
  is_nil : 'value -> bool;
  value_truthy : 'value -> bool;
  is_string : 'value -> bool;
  is_integer : 'value -> bool;
  is_number : 'value -> bool;
  is_bool : 'value -> bool;
  is_keyword : 'value -> bool;
  is_uuid : 'value -> bool;
  is_instant : 'value -> bool;
  is_set : 'value -> bool;
  is_sequential : 'value -> bool;
  keyword_to_string : 'value -> string;
  string_from_value : 'value -> string;
  value_to_string : 'value -> string;
  collection_to_array : 'value -> 'value array;
  equal : 'value -> 'value -> bool;
  property_tuple_valid : 'value -> bool;
  property_tuple_error_message : 'value -> string;
}

let error_attribute (error : error) = error.attribute
let error_category (error : error) = error.category
let error_message (error : error) = error.message

type predicate =
  | Any
  | Is_string
  | Is_int
  | Is_property_scalar
  | Is_closed_scalar
  | Is_bool
  | Is_keyword
  | Is_uuid
  | Is_instant
  | Is_int_set
  | Is_order
  | Is_true
  | Exact_text of string
  | Enum of string Rrbvec.t
  | Internal_property_ident
  | User_property_ident
  | Plugin_property_ident
  | Class_ident
  | Logseq_ident
  | Logseq_property_ident
  | Special

type field = { name : string; required : bool; predicate : predicate }

let field ?(required = false) name predicate = { name; required; predicate }
let required name predicate = field ~required:true name predicate
let fields values = Rrbvec.of_array values
let ( ++ ) = Rrbvec.append

let page_or_block_fields =
  fields [|
    required "block/uuid" Is_uuid;
    required "block/created-at" Is_int;
    required "block/updated-at" Is_int;
    field "logseq.property/deleted-at" Is_int;
    field "block/properties" Special;
    field "block/tags" Special;
    field "block/refs" Is_int_set;
    field "block/tx-id" Is_int;
    field "block/collapsed?" Is_bool;
    field "block/warning" Is_keyword;
    field "logseq.property/created-by-ref" Is_int;
  |]

let page_fields =
  fields
    [| required "block/name" Is_string; required "block/title" Is_string |]

let property_fields =
  fields [|
    field "db/index" Is_bool;
    field "db/valueType" (Enum (Rrbvec.singleton "db.type/ref"));
    field "db/cardinality"
      (Enum
         (Rrbvec.of_array
            [| "db.cardinality/many"; "db.cardinality/one" |]));
    field "block/order" Is_order;
    field "logseq.property/classes" Is_int_set;
  |]

let property_common_fields =
  fields [|
    field "logseq.property/hide?" Is_bool;
    field "logseq.property/public?" Is_bool;
    field "logseq.property/ui-position"
      (Enum
         (Rrbvec.of_array
            [| "properties"; "block-left"; "block-right"; "block-below" |]));
  |]

let block_fields =
  fields [|
    required "block/title" Is_string;
    required "block/parent" Is_int;
    required "block/order" Is_order;
    required "block/page" Is_int;
    field "block/link" Is_int;
    field "logseq.property/created-from-property" Is_int;
  |]

let normal_page_fields =
  fields [|
    field "block/journal-day" Is_int;
    field "block/parent" Is_int;
    field "block/order" Is_order;
  |]
  ++ page_fields ++ page_or_block_fields

let class_fields ~root =
  fields [|
    required "db/ident"
      (if root then Exact_text "logseq.class/Root" else Class_ident);
  |]
  ++ (if root then Rrbvec.empty
      else Rrbvec.singleton (required "logseq.property.class/extends" Is_int_set))
  ++ page_fields ++ page_or_block_fields

let hidden_fields =
  fields
    [| field "block/order" Is_order; required "logseq.property/hide?" Is_true |]
  ++ page_fields ++ page_or_block_fields

let normal_block_fields = block_fields ++ page_or_block_fields

let property_value_block_fields =
  fields [|
    required "logseq.property/value" Is_property_scalar;
    required "logseq.property/created-from-property" Is_int;
  |]
  ++ Rrbvec.filter
      (fun spec ->
        not
          (String.equal spec.name "block/title"
          || String.equal spec.name "logseq.property/created-from-property"))
      block_fields
  ++ page_or_block_fields

let reaction_fields =
  fields [|
    required "block/uuid" Is_uuid;
    required "logseq.property.reaction/emoji-id" Is_string;
    required "logseq.property.reaction/target" Is_int;
    required "block/created-at" Is_int;
    field "block/tx-id" Is_int;
    field "block/properties" Special;
    field "block/refs" Is_int_set;
  |]

let property_history_fields =
  fields [|
    required "block/uuid" Is_uuid;
    required "block/created-at" Is_int;
    field "block/updated-at" Is_int;
    required "logseq.property.history/block" Is_int;
    required "logseq.property.history/property" Is_int;
    field "logseq.property.history/ref-value" Is_int;
    field "logseq.property.history/scalar-value" Any;
    field "block/properties" Special;
    field "block/tx-id" Is_int;
  |]

let closed_value_fields =
  fields [|
    field "db/ident" Logseq_property_ident;
    field "block/title" Is_string;
    field "logseq.property/value" Is_closed_scalar;
    required "logseq.property/created-from-property" Is_int;
    field "block/closed-value-property" Is_int_set;
  |]
  ++ Rrbvec.filter
      (fun spec ->
        not
          (String.equal spec.name "block/title"
          || String.equal spec.name "logseq.property/created-from-property"))
      block_fields
  ++ page_or_block_fields

let asset_fields =
  fields [|
    required "logseq.property.asset/type" Is_string;
    required "logseq.property.asset/checksum" Is_string;
    required "logseq.property.asset/size" Is_int;
    field "logseq.property.asset/width" Is_int;
    field "logseq.property.asset/height" Is_int;
    field "logseq.property.asset/align" Is_keyword;
  |]
  ++ block_fields ++ page_or_block_fields

let file_fields =
  fields [|
    required "block/uuid" Is_uuid;
    field "block/tx-id" Is_int;
    field "block/created-at" Is_int;
    field "block/updated-at" Is_int;
    required "file/content" Is_string;
    required "file/path" Is_string;
    field "file/size" Is_int;
    required "file/created-at" Is_instant;
    required "file/last-modified-at" Is_instant;
  |]

let db_ident_key_value_fields =
  fields [|
    required "db/ident" Logseq_ident;
    required "kv/value" Any;
    field "block/tx-id" Is_int;
  |]

let property_value_placeholder_fields =
  fields [|
    required "db/ident" (Exact_text "logseq.property/empty-placeholder");
    required "block/uuid" Is_uuid;
    field "block/tx-id" Is_int;
    field "block/created-at" Is_int;
    field "block/updated-at" Is_int;
  |]

let split_ident value =
  match String.index_opt value '/' with
  | None -> (None, value)
  | Some index ->
      ( Some (String.sub value 0 index),
        String.sub value (index + 1) (String.length value - index - 1) )

let text attribute = Option.value ~default:"" attribute.text

let is_db_attribute ident =
  Rrbvec.mem ident Property_catalog.db_attribute_properties

let internal_property_ident attribute =
  let ident = text attribute in
  let namespace_, _ = split_ident ident in
  Property_identity.is_logseq_property_namespace namespace_
  || is_db_attribute ident

let user_property_ident attribute =
  let namespace_, _ = split_ident (text attribute) in
  Validation_identity.is_user_property_ident ~namespace_
    ~qualified:(Option.is_some namespace_)

let plugin_property_ident attribute =
  let namespace_, _ = split_ident (text attribute) in
  Property_identity.is_plugin_property_namespace namespace_

let class_ident attribute =
  let namespace_, _ = split_ident (text attribute) in
  Validation_identity.is_class_ident ~namespace_
    ~qualified:(Option.is_some namespace_)

let logseq_ident attribute =
  let namespace_, _ = split_ident (text attribute) in
  match namespace_ with
  | Some ("logseq.class" | "logseq.kv") -> true
  | Some value -> Rrbvec.mem value Property_catalog.logseq_property_namespaces
  | None -> false

let logseq_property_ident attribute =
  let namespace_, _ = split_ident (text attribute) in
  Property_identity.is_logseq_property_namespace namespace_

let kind_is expected attribute = expected = attribute.kind

let predicate_valid predicate attribute =
  match predicate with
  | Any -> true
  | Is_string -> kind_is String attribute
  | Is_int -> kind_is Int attribute
  | Is_property_scalar ->
      kind_is String attribute || kind_is Int attribute
      || kind_is Number attribute || kind_is Bool attribute
  | Is_closed_scalar ->
      kind_is String attribute || kind_is Int attribute
      || kind_is Number attribute
  | Is_bool -> kind_is Bool attribute
  | Is_keyword -> kind_is Keyword attribute
  | Is_uuid -> kind_is Uuid attribute
  | Is_instant -> kind_is Instant attribute
  | Is_int_set -> kind_is Int_set attribute
  | Is_order ->
      kind_is String attribute
      && Option.fold ~none:false
           ~some:(fun value ->
             try Order.validate_order_key value
             with Invalid_argument _ -> false)
           attribute.text
  | Is_true -> kind_is Bool attribute && attribute.truthy
  | Exact_text expected -> String.equal (text attribute) expected
  | Enum values -> Rrbvec.mem (text attribute) values
  | Internal_property_ident ->
      kind_is Keyword attribute && internal_property_ident attribute
  | User_property_ident ->
      kind_is Keyword attribute && user_property_ident attribute
  | Plugin_property_ident ->
      kind_is Keyword attribute && plugin_property_ident attribute
  | Class_ident -> kind_is Keyword attribute && class_ident attribute
  | Logseq_ident -> kind_is Keyword attribute && logseq_ident attribute
  | Logseq_property_ident ->
      kind_is Keyword attribute && logseq_property_ident attribute
  | Special -> kind_is Sequential attribute && attribute.special_valid

let predicate_error predicate attribute =
  match predicate with
  | Is_string -> (Type, "should be a string")
  | Is_int -> (Type, "should be an integer")
  | Is_property_scalar -> (Type, "should be a string, number, or boolean")
  | Is_closed_scalar -> (Type, "should be a string or number")
  | Is_bool -> (Type, "should be a boolean")
  | Is_keyword -> (Type, "should be a keyword")
  | Is_uuid -> (Type, "should be a UUID")
  | Is_instant -> (Type, "should be an instant")
  | Is_int_set -> (Type, "should be a set of integers")
  | Is_order -> (Value, "should be a valid fractional index")
  | Is_true -> (Value, "should be true")
  | Internal_property_ident ->
      (Value, "should be a valid logseq property namespace")
  | User_property_ident -> (Value, "should be a valid user property namespace")
  | Plugin_property_ident ->
      (Value, "should be a valid plugin property namespace")
  | Class_ident -> (Value, "should be a valid class namespace")
  | Logseq_ident -> (Value, "should be a valid :db/ident namespace")
  | Logseq_property_ident ->
      (Value, "should be a valid logseq property namespace")
  | Special ->
      ( Value,
        if String.equal attribute.special_message "" then
          "should be a valid property value"
        else attribute.special_message )
  | Any | Exact_text _ | Enum _ -> (Value, "should be an allowed value")

let find_attribute (attributes : attribute Rrbvec.t) name =
  Rrbvec.find_opt
    (fun (attribute : attribute) -> String.equal attribute.name name)
    attributes

type property_flavor = Internal | User | Plugin

let property_flavor (attributes : attribute Rrbvec.t) =
  match find_attribute attributes "db/ident" with
  | None -> User
  | Some attribute ->
      if internal_property_ident attribute then Internal
      else if plugin_property_ident attribute then Plugin
      else User

let property_type_values flavor =
  match flavor with
  | Internal ->
      Rrbvec.append Property_type.internal_built_in Property_type.user_built_in
      |> Rrbvec.map Property_type.to_string
  | User ->
      Rrbvec.append Property_type.user_allowed_internal
        Property_type.user_built_in
      |> Rrbvec.map Property_type.to_string
  | Plugin ->
      Property_type.user_built_in |> Rrbvec.map Property_type.to_string
      |> fun values ->
      Rrbvec.push_back values "json" |> fun values ->
      Rrbvec.push_back values "string" |> fun values ->
      Rrbvec.push_back values "page"

let property_page_fields attributes =
  let flavor = property_flavor attributes in
  let ident_predicate =
    match flavor with
    | Internal -> Internal_property_ident
    | User -> User_property_ident
    | Plugin -> Plugin_property_ident
  in
  let allowed_types = property_type_values flavor in
  fields [|
    required "db/ident" ident_predicate;
    required "logseq.property/type" (Enum allowed_types);
  |]
  ++ (match flavor with
    | Internal ->
        fields [|
          field "logseq.property/view-context"
            (Enum
               (Rrbvec.of_array
                  [| "page"; "block"; "class"; "property"; "never" |]));
        |]
    | User | Plugin -> Rrbvec.empty)
  ++ property_common_fields ++ property_fields ++ page_fields
  ++ page_or_block_fields

let fields_for kind attributes =
  match kind with
  | Validation_entity.Reaction_entity -> reaction_fields
  | Property -> property_page_fields attributes
  | Class ->
      let root =
        find_attribute attributes "db/ident"
        |> Option.exists (fun attribute ->
            Option.equal String.equal attribute.text (Some "logseq.class/Root"))
      in
      class_fields ~root
  | Hidden -> hidden_fields
  | Normal_page -> normal_page_fields
  | Asset_block -> asset_fields
  | File_block -> file_fields
  | Property_history_block -> property_history_fields
  | Closed_value_block -> closed_value_fields
  | Property_value_block -> property_value_block_fields
  | Property_value_placeholder -> property_value_placeholder_fields
  | Block -> normal_block_fields
  | Db_ident_key_value -> db_ident_key_value_fields

let add_error errors ?attribute category message =
  Rrbvec.push_back errors { attribute; category; message }

let validate_alternatives kind attributes errors =
  match kind with
  | Validation_entity.Property_history_block ->
      let ref_value =
        find_attribute attributes "logseq.property.history/ref-value"
      in
      let scalar_value =
        find_attribute attributes "logseq.property.history/scalar-value"
      in
      if
        Option.exists (fun attribute -> attribute.truthy) ref_value
        || Option.exists (fun attribute -> attribute.non_nil) scalar_value
      then errors
      else
        add_error errors ~attribute:"logseq.property.history/ref-value" Value
          ":logseq.property.history/ref-value or \
           :logseq.property.history/scalar-value required"
  | Validation_entity.Closed_value_block ->
      let title = find_attribute attributes "block/title" in
      let value = find_attribute attributes "logseq.property/value" in
      if
        Option.exists (fun attribute -> attribute.truthy) title
        || Option.exists (fun attribute -> attribute.truthy) value
      then errors
      else
        add_error errors ~attribute:"logseq.property/value" Value
          ":block/title or :logseq.property/value required"
  | _ -> errors

let validate_entity ~closed kind attributes =
  let fields = fields_for kind attributes in
  let errors =
    Rrbvec.fold_left
      (fun errors spec ->
        if spec.required && Option.is_none (find_attribute attributes spec.name)
        then
          add_error errors ~attribute:spec.name Missing "missing required key"
        else errors)
      Rrbvec.empty fields
  in
  let errors =
    Rrbvec.fold_left
      (fun errors (attribute : attribute) ->
        match
          Rrbvec.find_opt
            (fun spec -> String.equal spec.name attribute.name)
            fields
        with
        | None ->
            if closed then
              add_error errors ~attribute:attribute.name Unknown
                "disallowed key"
            else errors
        | Some spec ->
            if predicate_valid spec.predicate attribute then errors
            else
              let category, message =
                predicate_error spec.predicate attribute
              in
              add_error errors ~attribute:attribute.name category message)
      errors attributes
  in
  validate_alternatives kind attributes errors

let kind_of_string = function
  | "reaction-entity" -> Validation_entity.Reaction_entity
  | "property" -> Property
  | "class" -> Class
  | "hidden" -> Hidden
  | "normal-page" -> Normal_page
  | "asset-block" -> Asset_block
  | "file-block" -> File_block
  | "property-history-block" -> Property_history_block
  | "closed-value-block" -> Closed_value_block
  | "property-value-block" -> Property_value_block
  | "property-value-placeholder" -> Property_value_placeholder
  | "block" -> Block
  | "db-ident-key-value" -> Db_ident_key_value
  | value -> invalid_arg ("unknown validation entity kind: " ^ value)

let first_invalid_property capabilities tuples =
  let tuples = capabilities.collection_to_array tuples in
  let rec loop index =
    if index = Array.length tuples then None
    else
      let tuple = tuples.(index) in
      if capabilities.property_tuple_valid tuple then loop (index + 1)
      else Some (capabilities.property_tuple_error_message tuple)
  in
  loop 0

let contains capabilities values target =
  values |> capabilities.collection_to_array
  |> Array.exists (capabilities.equal target)

let special_validation capabilities attribute value =
  match attribute with
  | "block/properties" -> (
      if not (capabilities.is_sequential value) then
        (false, "should be sequential")
      else
        match first_invalid_property capabilities value with
        | Some message -> (false, message)
        | None -> (true, ""))
  | "block/tags" ->
      if not (capabilities.is_sequential value) then
        (false, "should be a property tuple")
      else if not (capabilities.property_tuple_valid value) then
        (false, capabilities.property_tuple_error_message value)
      else
        let tuple = capabilities.collection_to_array value in
        let tags = tuple.(1) in
        let options = tuple.(2) in
        let built_in =
          capabilities.field options "logseq.property/built-in?"
          |> capabilities.value_truthy
        in
        let tag_values = capabilities.collection_to_array tags in
        if built_in && Array.length tag_values <> 1 then
          (false, "should only have one tag for a built-in entity")
        else
          let page_class_id = capabilities.field options "page-class-id" in
          let all_page_class_ids =
            capabilities.field options "all-page-class-ids"
          in
          let page_tagged = contains capabilities tags page_class_id in
          let conflicting_page_tag =
            tag_values
            |> Array.exists (fun tag ->
                (not (capabilities.equal tag page_class_id))
                && contains capabilities all_page_class_ids tag)
          in
          if page_tagged && conflicting_page_tag then
            ( false,
              "should not have other built-in page tags when tagged with #Page"
            )
          else (true, "")
  | _ -> (true, "")

let value_kind capabilities value =
  if capabilities.is_string value then String
  else if capabilities.is_integer value then Int
  else if capabilities.is_number value then Number
  else if capabilities.is_bool value then Bool
  else if capabilities.is_keyword value then Keyword
  else if capabilities.is_uuid value then Uuid
  else if capabilities.is_instant value then Instant
  else if
    capabilities.is_set value
    && value |> capabilities.collection_to_array
       |> Array.for_all capabilities.is_integer
  then Int_set
  else if capabilities.is_sequential value then Sequential
  else Other

let value_text capabilities value =
  if capabilities.is_keyword value then
    Some (capabilities.keyword_to_string value)
  else if capabilities.is_string value then
    Some (capabilities.string_from_value value)
  else None

let attributes_with capabilities entity =
  entity |> capabilities.map_entries
  |> Array.fold_left
       (fun attributes entry ->
         let key = entry.(0) in
         let value = entry.(1) in
         let name =
           if capabilities.is_keyword key then
             capabilities.keyword_to_string key
           else capabilities.value_to_string key
         in
         if String.equal name "db/id" then attributes
         else
           let special_valid, special_message =
             special_validation capabilities name value
           in
           Rrbvec.push_back attributes
             {
               name;
               kind = value_kind capabilities value;
               text = value_text capabilities value;
               truthy = capabilities.value_truthy value;
               non_nil = not (capabilities.is_nil value);
               special_valid;
               special_message;
             })
       Rrbvec.empty

let group_errors errors =
  let groups = ref Rrbvec.empty in
  let find_group attribute =
    let found = ref None in
    let index = ref 0 in
    while Option.is_none !found && !index < Rrbvec.length !groups do
      let group : error_group = Rrbvec.nth !groups !index in
      if Option.equal String.equal group.attribute attribute then
        found := Some !index;
      index := !index + 1
    done;
    !found
  in
  Rrbvec.iter
    (fun (error : error) ->
      match find_group error.attribute with
      | None ->
          groups :=
            Rrbvec.push_back !groups
              {
                attribute = error.attribute;
                messages = Rrbvec.singleton error.message;
              }
      | Some index ->
          let group : error_group = Rrbvec.nth !groups index in
          groups :=
            Rrbvec.set !groups index
              {
                group with
                messages = Rrbvec.push_back group.messages error.message;
              })
    errors;
  !groups

let validate_entity_with capabilities ~dispatch_key ~closed entity =
  let dispatch_key =
    match dispatch_key with
    | Some _ as dispatch_key -> dispatch_key
    | None -> capabilities.dispatch entity
  in
  match dispatch_key with
  | None ->
      let error : error =
        {
          attribute = None;
          category = Dispatch;
          message = "should match a known entity schema";
        }
      in
      {
        dispatch_key = None;
        errors =
          Rrbvec.singleton
            { attribute = None; messages = Rrbvec.singleton error.message };
        error_details = Rrbvec.singleton error;
      }
  | Some dispatch_key ->
      let error_details =
        entity
        |> attributes_with capabilities
        |> validate_entity ~closed (kind_of_string dispatch_key)
      in
      {
        dispatch_key = Some dispatch_key;
        errors = group_errors error_details;
        error_details;
      }

let select_fields capabilities source names =
  names
  |> Rrbvec.fold_left
       (fun result name ->
         if capabilities.has_field source name then
           capabilities.assoc_field result name (capabilities.field source name)
         else result)
       capabilities.empty_map

let project_page capabilities page_id =
  let page =
    capabilities.lookup_entity page_id
    |> Option.value ~default:capabilities.empty_map
  in
  let result =
    select_fields capabilities page
      (Rrbvec.of_array [| "block/name"; "db/id"; "block/created-at" |])
  in
  let tags = capabilities.field page "block/tags" in
  if capabilities.is_nil tags then result
  else
    let tag_idents =
      tags |> capabilities.collection_to_array
      |> Array.map (fun tag -> capabilities.field tag "db/ident")
      |> capabilities.array_to_vector
    in
    capabilities.assoc_field result "block/tags" tag_idents

let project_error_entity capabilities entity =
  let page = capabilities.field entity "block/page" in
  if capabilities.value_truthy page then
    capabilities.assoc_field entity "block/page"
      (project_page capabilities page)
  else entity

let validate_entities_with capabilities ~dispatch_key ~closed entities =
  entities
  |> Rrbvec.fold_left
       (fun errors entity ->
         let validation =
           validate_entity_with capabilities ~dispatch_key ~closed entity
         in
         if Rrbvec.is_empty validation.errors then errors
         else
           Rrbvec.push_back errors
             { entity = project_error_entity capabilities entity; validation })
       Rrbvec.empty

let distinct_changed_ids capabilities report =
  report |> capabilities.report_datoms |> Rrbvec.of_array
  |> Rrbvec.fold_left
       (fun ids datom ->
         let id = capabilities.datom_entity datom in
         if Rrbvec.exists (capabilities.equal id) ids then ids
         else Rrbvec.push_back ids id)
       Rrbvec.empty

let validate_transaction_with capabilities report =
  let database = capabilities.report_db_after report in
  let changed_ids = distinct_changed_ids capabilities report in
  let entities =
    changed_ids
    |> Rrbvec.concat_map (fun id ->
        capabilities.scan_entity_datoms database id |> Rrbvec.of_array)
    |> Rrbvec.to_array
    |> capabilities.assemble_entities database
    |> capabilities.prepare_entities database
    |> Rrbvec.of_array
  in
  let errors = capabilities.validate_entities database entities in
  if not (Rrbvec.is_empty errors) then
    capabilities.log_errors changed_ids
      (capabilities.report_tx_metadata report)
      errors;
  { valid = Rrbvec.is_empty errors; errors }

let transient_fields =
  Rrbvec.of_array [| "block.temp/load-status"; "block.temp/has-children?" |]

let remove_transient_fields capabilities entity =
  Rrbvec.fold_left capabilities.remove_field entity transient_fields

let validate_database_with capabilities database =
  let datoms = capabilities.scan_all_datoms database in
  let entities = datoms |> capabilities.assemble_entities |> Rrbvec.of_array in
  let prepared =
    entities
    |> Rrbvec.map (remove_transient_fields capabilities)
    |> Rrbvec.to_array
    |> capabilities.prepare_entities database
    |> Rrbvec.of_array
  in
  let errors = capabilities.validate_entities database prepared in
  { datom_count = Array.length datoms; entities; errors }
