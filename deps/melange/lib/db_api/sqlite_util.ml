module Domain = Melange_db.Sqlite_policy
module Db_ident_domain = Melange_db.Db_ident
module Property_type = Melange_db.Property_type

type value_callback = (unit -> Support.Runtime_codec.cljs_value[@u])
type float_callback = (unit -> float[@u])

let field = Property_build.field
let assoc = Property_build.assoc
let empty_map = Property_build.empty_map
let merge_map = Property_build.merge_map

let value_text runtime value =
  if Support.Runtime_codec.value_is_keyword runtime value then
    Support.Runtime_codec.keyword_to_string runtime value
  else if Support.Runtime_codec.value_is_string runtime value then
    Support.Runtime_codec.string_from_value runtime value
  else Support.Runtime_codec.value_to_string runtime value

let split_ident value =
  match String.index_opt value '/' with
  | Some index ->
      let namespace_ = String.sub value 0 index in
      let name =
        String.sub value (index + 1) (String.length value - index - 1)
      in
      (namespace_, name)
  | None -> invalid_arg "DB ident must be namespace-qualified"

let nonempty_map runtime value =
  (not (Support.Runtime_codec.value_is_nil runtime value))
  && Array.length (Support.Runtime_codec.map_to_entries runtime value) > 0

let build_property_with_ident_text runtime (generate_order : value_callback)
    (now_ms : float_callback) db_ident_text property_schema options =
  let namespace_, name = split_ident db_ident_text in
  let title_value = field runtime options "title" in
  let title =
    if Support.Runtime_codec.value_is_nil runtime title_value then None
    else Some (value_text runtime title_value)
  in
  let property_type_value =
    let value = field runtime property_schema "logseq.property/type" in
    if Support.Runtime_codec.value_is_nil runtime value then
      Support.Runtime_codec.keyword_from_string runtime "default"
    else value
  in
  let property_type = value_text runtime property_type_value in
  let cardinality =
    let value = field runtime property_schema "db/cardinality" in
    if Support.Runtime_codec.value_is_nil runtime value then ""
    else value_text runtime value
  in
  let block_uuid = field runtime options "block-uuid" in
  let uuid =
    if Support.Runtime_codec.value_is_nil runtime block_uuid then
      Melange_common.Uuid.db_ident_block ~namespace_:(Some namespace_) ~name
    else if Support.Runtime_codec.value_is_uuid runtime block_uuid then
      Support.Runtime_codec.uuid_to_string runtime block_uuid
    else if Support.Runtime_codec.value_is_string runtime block_uuid then
      Support.Runtime_codec.string_from_value runtime block_uuid
    else invalid_arg "Property block UUID must be a UUID"
  in
  let order_value = (generate_order () [@u]) in
  let order = value_text runtime order_value in
  let known_ref_type =
    match Property_type.of_string property_type with
    | Some property_type -> Rrbvec.mem property_type Property_type.all_ref
    | None -> false
  in
  let plan =
    Domain.property
      {
        namespace_;
        name;
        normalized_name =
          Melange_common.String_util.page_name_sanity_lower
            (Option.value title ~default:name);
        title;
        property_type;
        cardinality;
        explicit_ref_type =
          field runtime options "ref-type?"
          |> Support.Runtime_codec.value_truthy runtime;
        known_ref_type;
        uuid;
        order;
      }
  in
  let tags =
    Support.Runtime_codec.array_to_set runtime
      [|
        Support.Runtime_codec.keyword_from_string runtime
          "logseq.class/Property";
      |]
  in
  let base =
    empty_map runtime
    |> assoc runtime "db/ident"
         (Support.Runtime_codec.keyword_from_string runtime plan.ident)
    |> assoc runtime "block/tags" tags
    |> assoc runtime "logseq.property/type"
         (Support.Runtime_codec.keyword_from_string runtime
            plan.property_type)
    |> assoc runtime "block/name"
         (Support.Runtime_codec.string_to_value runtime plan.normalized_name)
    |> assoc runtime "block/uuid"
         (Support.Runtime_codec.uuid_from_string runtime plan.uuid)
    |> assoc runtime "block/title"
         (Support.Runtime_codec.string_to_value runtime plan.title)
    |> assoc runtime "db/index"
         (Support.Runtime_codec.bool_to_value runtime true)
    |> assoc runtime "db/cardinality"
         (Support.Runtime_codec.keyword_from_string runtime plan.cardinality)
    |> assoc runtime "block/order"
         (Support.Runtime_codec.string_to_value runtime plan.order)
  in
  let base =
    if plan.ref_type then
      assoc runtime "db/valueType"
        (Support.Runtime_codec.keyword_from_string runtime "db.type/ref")
        base
    else base
  in
  let properties = field runtime options "properties" in
  let base =
    if nonempty_map runtime properties then merge_map runtime base properties
    else base
  in
  let base = Property_build.timestamp_block runtime now_ms base in
  Support.Runtime_codec.map_dissoc runtime property_schema
    (Support.Runtime_codec.keyword_from_string runtime "db/cardinality")
  |> fun schema -> merge_map runtime schema base

let db_ident_text_with runtime stable_idents random_index random_bytes db_ident =
  let db_ident_text = value_text runtime db_ident in
  if
    Support.Runtime_codec.value_is_keyword runtime db_ident
    && String.contains db_ident_text '/'
  then db_ident_text
  else
    Db_ident_domain.create_with ~stable_idents ~random_index ~random_bytes
      ~namespace_:"user.property" ~name:db_ident_text

let buildProperty runtime (generate_order : value_callback)
    (now_ms : float_callback) db_ident property_schema options =
  db_ident
  |> db_ident_text_with runtime Db_ident.Default_runtime.stable_idents
       Db_ident.Default_runtime.random_index
       Db_ident.Default_runtime.random_bytes
  |> fun db_ident_text ->
  build_property_with_ident_text runtime generate_order now_ms db_ident_text
    property_schema options

let buildClassWith runtime (now_ms : float_callback) block =
  let ident = field runtime block "db/ident" in
  if not (Support.Runtime_codec.value_is_keyword runtime ident) then
    invalid_arg "Class DB ident must be a qualified keyword";
  let ident_text = Support.Runtime_codec.keyword_to_string runtime ident in
  let _namespace, _name = split_ident ident_text in
  let tags_value = field runtime block "block/tags" in
  let tags =
    (if Support.Runtime_codec.value_is_nil runtime tags_value then [||]
     else Support.Runtime_codec.collection_to_array runtime tags_value)
    |> fun values ->
    Array.append values
      [|
        Support.Runtime_codec.keyword_from_string runtime "logseq.class/Tag";
      |]
    |> Support.Runtime_codec.array_to_set runtime
  in
  let result = assoc runtime "block/tags" tags block in
  let extends = field runtime block "logseq.property.class/extends" in
  let result =
    if
      Domain.add_root_extends ~ident:ident_text
        ~has_extends:
          (not (Support.Runtime_codec.value_is_nil runtime extends))
    then
      assoc runtime "logseq.property.class/extends"
        (Support.Runtime_codec.keyword_from_string runtime
           "logseq.class/Root")
        result
    else result
  in
  Property_build.timestamp_block runtime now_ms result

let buildPageWith runtime (now_ms : float_callback) title =
  let tags =
    Support.Runtime_codec.array_to_set runtime
      [|
        Support.Runtime_codec.keyword_from_string runtime
          "logseq.class/Page";
      |]
  in
  let result =
    empty_map runtime
    |> assoc runtime "block/name"
         (Melange_common.String_util.page_name_sanity_lower title
         |> Support.Runtime_codec.string_to_value runtime)
    |> assoc runtime "block/title"
         (Support.Runtime_codec.string_to_value runtime title)
    |> assoc runtime "block/uuid"
         (Melange_common.Uuid.builtin_block title
         |> Support.Runtime_codec.uuid_from_string runtime)
    |> assoc runtime "block/tags" tags
  in
  let result =
    if
      Domain.hide_page ~title
        ~quick_add_title:Melange_common.Config.quick_add_page_name
    then
      assoc runtime "logseq.property/hide?"
        (Support.Runtime_codec.bool_to_value runtime true)
        result
    else result
  in
  Property_build.timestamp_block runtime now_ms result

let kvWith runtime key value =
  if not (Support.Runtime_codec.value_is_keyword runtime key) then
    invalid_arg "KV ident must be a qualified keyword";
  let namespace_, _name =
    Support.Runtime_codec.keyword_to_string runtime key |> split_ident
  in
  if namespace_ <> "logseq.kv" then
    invalid_arg "KV ident must use the logseq.kv namespace";
  empty_map runtime
  |> assoc runtime "db/ident" key
  |> assoc runtime "kv/value" value

let importTxWith runtime (now_ms : float_callback) import_type =
  let keyword = Support.Runtime_codec.keyword_from_string runtime in
  let imported_at =
    (now_ms () [@u]) |> Support.Runtime_codec.float_to_value runtime
  in
  let retracts =
    Domain.import_retract_idents
    |> Rrbvec.map (fun ident ->
        Support.Runtime_codec.array_to_vector runtime
          [| keyword "db/retractEntity"; keyword ident |])
    |> Rrbvec.to_array
  in
  Array.concat
    [
      [|
        kvWith runtime (keyword "logseq.kv/import-type") import_type;
        kvWith runtime (keyword "logseq.kv/imported-at") imported_at;
      |];
      retracts;
    ]
  |> Support.Runtime_codec.array_to_list runtime
