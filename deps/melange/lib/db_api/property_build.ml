module Domain = Melange_db.Property_build
module Property_type = Melange_db.Property_type

type value_callback = (unit -> Support.Runtime_codec.cljs_value[@u])
type float_callback = (unit -> float[@u])

type encoded_value_block_options = {
  blockUuid : Support.Runtime_codec.cljs_value Js.Nullable.t;
  properties : Support.Runtime_codec.cljs_value Js.Nullable.t;
}

type encoded_closed_value_options = {
  dbIdent : Support.Runtime_codec.cljs_value Js.Nullable.t;
  icon : Support.Runtime_codec.cljs_value Js.Nullable.t;
}

type encoded_property_values_options = { pure : bool; pvalueMap : bool }

type encoded_reference_shape = {
  collection : bool;
  allLookupRefs : bool;
  singleLookupRef : bool;
  allBlocksWithUuid : bool;
  singleBlockWithUuid : bool;
}

let planReferenceValue (shape : encoded_reference_shape) =
  match
    Domain.plan_reference_value
      {
        collection = shape.collection;
        all_lookup_refs = shape.allLookupRefs;
        single_lookup_ref = shape.singleLookupRef;
        all_blocks_with_uuid = shape.allBlocksWithUuid;
        single_block_with_uuid = shape.singleBlockWithUuid;
      }
  with
  | Domain.Keep_reference -> "keep-reference"
  | Domain.Extract_block_uuid -> "extract-block-uuid"
  | Domain.Extract_block_uuid_set -> "extract-block-uuid-set"
  | Domain.Reject_reference -> "reject-reference"

let buildPropertiesWithRefValuesWith runtime property_values =
  let block_uuid =
    Support.Runtime_codec.keyword_from_string runtime "block/uuid"
  in
  let lookup_id value =
    if not (Support.Runtime_codec.value_is_vector runtime value) then false
    else
      match Support.Runtime_codec.vector_to_array runtime value with
      | [| attribute; uuid |] ->
          Support.Runtime_codec.value_equals runtime attribute block_uuid
          && Support.Runtime_codec.value_is_uuid runtime uuid
      | _ -> false
  in
  let block_with_uuid value =
    Support.Runtime_codec.value_is_map runtime value
    && Support.Runtime_codec.map_get runtime value block_uuid
       |> Support.Runtime_codec.value_is_uuid runtime
  in
  let project value =
    let collection = Support.Runtime_codec.value_is_set runtime value in
    let values =
      if collection then Support.Runtime_codec.set_to_array runtime value
      else [||]
    in
    let action =
      Domain.plan_reference_value
        {
          collection;
          all_lookup_refs = collection && Array.for_all lookup_id values;
          single_lookup_ref = lookup_id value;
          all_blocks_with_uuid =
            collection && Array.for_all block_with_uuid values;
          single_block_with_uuid = block_with_uuid value;
        }
    in
    let extract value =
      Support.Runtime_codec.array_to_vector runtime
        [|
          block_uuid; Support.Runtime_codec.map_get runtime value block_uuid;
        |]
    in
    match action with
    | Domain.Keep_reference -> value
    | Extract_block_uuid -> extract value
    | Extract_block_uuid_set ->
        values |> Array.map extract
        |> Support.Runtime_codec.array_to_set runtime
    | Reject_reference -> invalid_arg "Invalid property reference value"
  in
  property_values
  |> Support.Runtime_codec.map_to_entries runtime
  |> Array.map (function
    | [| key; value |] -> [| key; project value |]
    | _ -> invalid_arg "DB property values expect map entries")
  |> Support.Runtime_codec.entries_to_map runtime

let empty_map runtime = Support.Runtime_codec.entries_to_map runtime [||]

let assoc runtime name value map =
  Support.Runtime_codec.map_assoc runtime map
    (Support.Runtime_codec.keyword_from_string runtime name)
    value

let field runtime value name =
  Support.Runtime_codec.map_get runtime value
    (Support.Runtime_codec.keyword_from_string runtime name)

let merge_map runtime map extra =
  extra
  |> Support.Runtime_codec.map_to_entries runtime
  |> Array.fold_left
       (fun result -> function
         | [| key; value |] ->
             Support.Runtime_codec.map_assoc runtime result key value
         | _ -> invalid_arg "DB property build expects map entries")
       map

let optional_property_type runtime value =
  if Support.Runtime_codec.value_is_nil runtime value then None
  else
    value
    |> Support.Runtime_codec.keyword_to_string runtime
    |> Property_type.of_string

let timestamp_block runtime (now_ms : float_callback) block =
  let now = (now_ms () [@u]) in
  let created = field runtime block "block/created-at" in
  let updated = field runtime block "block/updated-at" in
  let timestamps =
    Melange_common.Util.ensure_block_timestamps ~now_ms:now
      ~created_at:
        (if Support.Runtime_codec.value_is_nil runtime created then None
         else Some (Support.Runtime_codec.float_from_value runtime created))
      ~updated_at:
        (if Support.Runtime_codec.value_is_nil runtime updated then None
         else Some (Support.Runtime_codec.float_from_value runtime updated))
  in
  block
  |> assoc runtime "block/created-at"
       (Support.Runtime_codec.float_to_value runtime timestamps.created_at)
  |> assoc runtime "block/updated-at"
       (Support.Runtime_codec.float_to_value runtime timestamps.updated_at)

let buildValueBlockWith runtime (generate_uuid : value_callback)
    (generate_order : value_callback) (now_ms : float_callback) block property
    value (options : encoded_value_block_options) =
  let keyword = Support.Runtime_codec.keyword_from_string runtime in
  let block_id =
    let id = field runtime block "db/id" in
    if Support.Runtime_codec.value_is_nil runtime id then
      field runtime block "db/ident"
    else id
  in
  let property_ident = field runtime property "db/ident" in
  let property_id = field runtime property "db/id" in
  let property_type =
    field runtime property "logseq.property/type"
    |> optional_property_type runtime
  in
  let property_is_default =
    Support.Runtime_codec.value_equals runtime property_ident
      (keyword "logseq.property/default-value")
  in
  let plan =
    Domain.plan_value_block
      {
        block_has_page =
          field runtime block "block/page"
          |> Support.Runtime_codec.value_is_nil runtime
          |> not;
        property_is_default;
        property_has_id =
          property_id |> Support.Runtime_codec.value_is_nil runtime |> not;
        value_content =
          Property_type.property_value_content ~property_type
            ~property_is_default ~block_type:property_type;
      }
  in
  let page =
    match plan.page_source with
    | Domain.Page_from_block ->
        field runtime (field runtime block "block/page") "db/id"
    | Page_from_self -> block_id
  in
  let created_from =
    match plan.created_from_source with
    | Domain.Created_from_block -> block_id
    | Created_from_property_entity -> property_id
    | Created_from_property_lookup ->
        empty_map runtime |> assoc runtime "db/ident" property_ident
  in
  let uuid =
    match Js.Nullable.toOption options.blockUuid with
    | Some uuid -> uuid
    | None -> generate_uuid () [@u]
  in
  let result =
    empty_map runtime
    |> assoc runtime "block/uuid" uuid
    |> assoc runtime "block/page" page
    |> assoc runtime "block/parent" block_id
    |> assoc runtime "logseq.property/created-from-property" created_from
    |> assoc runtime "block/order" (generate_order () [@u])
    |> assoc runtime
         (match plan.value_field with
         | Domain.Property_value -> "logseq.property/value"
         | Block_title -> "block/title")
         value
    |> timestamp_block runtime now_ms
  in
  match Js.Nullable.toOption options.properties with
  | None -> result
  | Some properties -> merge_map runtime result properties

let buildClosedValueBlockWith runtime (now_ms : float_callback) block_uuid
    block_type block_value property (options : encoded_closed_value_options) =
  if Support.Runtime_codec.value_is_nil runtime block_uuid then
    invalid_arg "Closed property value block requires an id";
  let keyword = Support.Runtime_codec.keyword_from_string runtime in
  let property_ident = field runtime property "db/ident" in
  let property_is_default =
    Support.Runtime_codec.value_equals runtime property_ident
      (keyword "logseq.property/default-value")
  in
  let plan =
    Domain.plan_closed_value
      {
        closed_property_is_default = property_is_default;
        closed_value_content =
          Property_type.property_value_content
            ~property_type:
              (field runtime property "logseq.property/type"
              |> optional_property_type runtime)
            ~property_is_default
            ~block_type:(optional_property_type runtime block_type);
      }
  in
  let created_from =
    match plan.closed_created_from_source with
    | Domain.Closed_block_lookup ->
        Support.Runtime_codec.array_to_vector runtime
          [| keyword "block/uuid"; block_uuid |]
    | Closed_property_ident -> property_ident
  in
  let result =
    empty_map runtime
    |> assoc runtime "block/uuid" block_uuid
    |> assoc runtime "block/page" property_ident
    |> assoc runtime "block/closed-value-property" property_ident
    |> assoc runtime "logseq.property/created-from-property" created_from
    |> assoc runtime "block/parent" property_ident
    |> assoc runtime
         (match plan.closed_value_field with
         | Domain.Property_value -> "logseq.property/value"
         | Block_title -> "block/title")
         block_value
  in
  let result =
    match Js.Nullable.toOption options.dbIdent with
    | Some ident when Support.Runtime_codec.value_is_keyword runtime ident
      ->
        assoc runtime "db/ident" ident result
    | _ -> result
  in
  let result =
    match Js.Nullable.toOption options.icon with
    | Some icon when Support.Runtime_codec.value_truthy runtime icon ->
        assoc runtime "logseq.property/icon" icon result
    | _ -> result
  in
  timestamp_block runtime now_ms result

let closedValuesToBlocksWith runtime (generate_order : value_callback)
    (now_ms : float_callback) property =
  let closed_values = field runtime property "closed-values" in
  let entries =
    if Support.Runtime_codec.value_is_nil runtime closed_values then [||]
    else Support.Runtime_codec.collection_to_array runtime closed_values
  in
  entries
  |> Array.map (fun entry ->
      let schema = field runtime entry "schema" in
      let properties = field runtime entry "properties" in
      let base =
        buildClosedValueBlockWith runtime now_ms
          (field runtime entry "uuid")
          (field runtime schema "type")
          (field runtime entry "value")
          property
          {
            dbIdent = field runtime entry "db-ident" |> Js.Nullable.return;
            icon = field runtime entry "icon" |> Js.Nullable.return;
          }
      in
      let has_properties =
        (not (Support.Runtime_codec.value_is_nil runtime properties))
        && Array.length
             (Support.Runtime_codec.map_to_entries runtime properties)
           > 0
      in
      let result =
        match Domain.plan_closed_value_entry ~has_properties with
        | Domain.Merge_entry_properties -> merge_map runtime base properties
        | Keep_entry_base -> base
      in
      assoc runtime "block/order" (generate_order () [@u]) result)
  |> Support.Runtime_codec.array_to_list runtime

let buildClosedValuesWith runtime (generate_order : value_callback)
    (now_ms : float_callback) db_ident property_name property config
    (get_property_schema : Support.Runtime_codec.callback Js.Nullable.t)
    (build_new_property : Support.Runtime_codec.callback Js.Nullable.t) =
  let property_schema =
    let explicit = field runtime property "schema" in
    match
      Domain.plan_property_schema
        ~has_explicit_schema:
          (not (Support.Runtime_codec.value_is_nil runtime explicit))
    with
    | Domain.Explicit_property_schema -> explicit
    | Resolve_property_schema -> (
        match Js.Nullable.toOption get_property_schema with
        | Some callback ->
            Support.Runtime_codec.invoke_callback runtime callback property
        | None -> invalid_arg "Missing get-property-schema capability")
  in
  let properties = field runtime config "properties" in
  let input =
    empty_map runtime
    |> assoc runtime "db-ident" db_ident
    |> assoc runtime "schema" property_schema
    |> assoc runtime "title" property_name
    |> assoc runtime "ref-type?"
         (Support.Runtime_codec.bool_to_value runtime true)
    |> assoc runtime "properties" properties
  in
  let property_tx =
    match Js.Nullable.toOption build_new_property with
    | Some callback ->
        Support.Runtime_codec.invoke_callback runtime callback input
    | None -> invalid_arg "Missing build-new-property capability"
  in
  let property_attributes = field runtime config "property-attributes" in
  let property_tx =
    if Support.Runtime_codec.value_is_nil runtime property_attributes then
      property_tx
    else merge_map runtime property_tx property_attributes
  in
  let closed_values =
    closedValuesToBlocksWith runtime generate_order now_ms property
    |> Support.Runtime_codec.collection_to_array runtime
  in
  Array.append [| property_tx |] closed_values
  |> Support.Runtime_codec.array_to_vector runtime

let build_property_value_entries_with runtime (generate_uuid : value_callback)
    (generate_order : value_callback) (now_ms : float_callback) block entries
    (options : encoded_property_values_options) =
  let keyword = Support.Runtime_codec.keyword_from_string runtime in
  let block =
    let id = field runtime block "db/id" in
    if not (Support.Runtime_codec.value_is_nil runtime id) then block
    else
      let uuid = field runtime block "block/uuid" in
      Support.Runtime_codec.array_to_vector runtime
        [| keyword "block/uuid"; uuid |]
      |> fun lookup -> assoc runtime "db/id" lookup block
  in
  let property_value raw =
    if options.pvalueMap then field runtime raw "value" else raw
  in
  let generated_prefix =
    if not options.pure then None
    else
      let ident = field runtime block "db/ident" in
      let value =
        if Support.Runtime_codec.value_is_nil runtime ident then
          field runtime block "block/uuid"
        else ident
      in
      if Support.Runtime_codec.value_is_nil runtime value then
        invalid_arg "Pure property value generation requires an ident or UUID";
      Some value
  in
  let value_block_options raw =
    let properties =
      if not options.pvalueMap then None
      else
        let attributes = field runtime raw "attributes" in
        if
          Support.Runtime_codec.value_is_nil runtime attributes
          || Array.length
               (Support.Runtime_codec.map_to_entries runtime attributes)
             = 0
        then None
        else Some attributes
    in
    let block_uuid =
      match generated_prefix with
      | None -> None
      | Some prefix ->
          Some
            (Melange_common.Uuid.builtin_block
               (Support.Runtime_codec.value_to_string runtime prefix
               ^ "-"
               ^ Support.Runtime_codec.value_to_string runtime
                   (property_value raw))
            |> Support.Runtime_codec.uuid_from_string runtime)
    in
    ({
       blockUuid = Js.Nullable.fromOption block_uuid;
       properties = Js.Nullable.fromOption properties;
     }
      : encoded_value_block_options)
  in
  let project raw_value property =
    let raw_items =
      if Support.Runtime_codec.value_is_set runtime raw_value then
        Support.Runtime_codec.set_to_array runtime raw_value
      else [||]
    in
    let collection =
      Array.length raw_items > 0
      || Support.Runtime_codec.value_is_set runtime raw_value
    in
    let value =
      if collection then
        raw_items |> Array.map property_value
        |> Support.Runtime_codec.array_to_set runtime
      else property_value raw_value
    in
    let value_items =
      if collection then Support.Runtime_codec.set_to_array runtime value
      else [||]
    in
    match
      Domain.plan_property_value
        {
          value_collection = collection;
          all_values_uuid =
            collection
            && Array.for_all
                 (Support.Runtime_codec.value_is_uuid runtime)
                 value_items;
          single_value_uuid =
            Support.Runtime_codec.value_is_uuid runtime value;
        }
    with
    | Domain.Uuid_set ->
        value_items
        |> Array.map (fun uuid ->
            Support.Runtime_codec.array_to_vector runtime
              [| keyword "block/uuid"; uuid |])
        |> Support.Runtime_codec.array_to_set runtime
    | Value_block_set ->
        raw_items
        |> Array.map (fun raw ->
            buildValueBlockWith runtime generate_uuid generate_order now_ms
              block property (property_value raw) (value_block_options raw))
        |> Support.Runtime_codec.array_to_set runtime
    | Uuid_lookup ->
        Support.Runtime_codec.array_to_vector runtime
          [| keyword "block/uuid"; value |]
    | Value_block ->
        buildValueBlockWith runtime generate_uuid generate_order now_ms block
          property value
          (value_block_options raw_value)
  in
  entries
  |> Array.map (fun (output_key, property, raw_value) ->
      [| output_key; project raw_value property |])
  |> Support.Runtime_codec.entries_to_map runtime

let buildPropertyValuesWith runtime (generate_uuid : value_callback)
    (generate_order : value_callback) (now_ms : float_callback) block properties
    (options : encoded_property_values_options) =
  let entries =
    properties
    |> Support.Runtime_codec.map_to_entries runtime
    |> Array.map (function
      | [| property_key; raw_value |] ->
          let property =
            if Support.Runtime_codec.value_is_map runtime property_key then
              property_key
            else empty_map runtime |> assoc runtime "db/ident" property_key
          in
          let ident = field runtime property "db/ident" in
          if Support.Runtime_codec.value_is_nil runtime ident then
            invalid_arg "Property value map key requires :db/ident";
          let output_key =
            let original = field runtime property "original-property-id" in
            if Support.Runtime_codec.value_is_nil runtime original then
              ident
            else original
          in
          (output_key, property, raw_value)
      | _ -> invalid_arg "DB property values expect map entries")
  in
  build_property_value_entries_with runtime generate_uuid generate_order now_ms
    block entries options

type value_block_shape = {
  blockHasPage : bool;
  propertyIsDefault : bool;
  propertyHasId : bool;
  valueContent : bool;
}

type value_block_plan = {
  pageSource : string;
  createdFromSource : string;
  valueField : string;
}

let planValueBlock (shape : value_block_shape) =
  let plan =
    Domain.plan_value_block
      {
        block_has_page = shape.blockHasPage;
        property_is_default = shape.propertyIsDefault;
        property_has_id = shape.propertyHasId;
        value_content = shape.valueContent;
      }
  in
  {
    pageSource =
      (match plan.page_source with
      | Domain.Page_from_block -> "block-page"
      | Page_from_self -> "block-self");
    createdFromSource =
      (match plan.created_from_source with
      | Domain.Created_from_block -> "block-self"
      | Created_from_property_entity -> "property-entity"
      | Created_from_property_lookup -> "property-lookup");
    valueField =
      (match plan.value_field with
      | Domain.Property_value -> "property-value"
      | Block_title -> "block-title");
  }

type closed_value_shape = { propertyIsDefault : bool; valueContent : bool }
type closed_value_plan = { createdFromSource : string; valueField : string }

let planClosedValue (shape : closed_value_shape) =
  let plan =
    Domain.plan_closed_value
      {
        closed_property_is_default = shape.propertyIsDefault;
        closed_value_content = shape.valueContent;
      }
  in
  {
    createdFromSource =
      (match plan.closed_created_from_source with
      | Domain.Closed_block_lookup -> "block-lookup"
      | Closed_property_ident -> "property-ident");
    valueField =
      (match plan.closed_value_field with
      | Domain.Property_value -> "property-value"
      | Block_title -> "block-title");
  }

type property_value_shape = {
  collection : bool;
  allValuesUuid : bool;
  singleValueUuid : bool;
}

let planPropertyValue (shape : property_value_shape) =
  match
    Domain.plan_property_value
      {
        value_collection = shape.collection;
        all_values_uuid = shape.allValuesUuid;
        single_value_uuid = shape.singleValueUuid;
      }
  with
  | Domain.Uuid_set -> "uuid-set"
  | Value_block_set -> "value-block-set"
  | Uuid_lookup -> "uuid-lookup"
  | Value_block -> "value-block"

let planClosedValueEntry has_properties =
  match Domain.plan_closed_value_entry ~has_properties with
  | Domain.Merge_entry_properties -> "merge-properties"
  | Keep_entry_base -> "keep-base"

let planPropertySchema has_explicit_schema =
  match Domain.plan_property_schema ~has_explicit_schema with
  | Domain.Explicit_property_schema -> "explicit-schema"
  | Resolve_property_schema -> "resolve-schema"
