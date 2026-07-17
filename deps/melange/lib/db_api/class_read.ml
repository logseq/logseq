module Domain = Melange_db.Class_read

type encoded_node = { id : int; extendsIds : int array }
type encoded_object = { id : int; hidden : bool }

let extendsIds root_id nodes =
  nodes
  |> Array.map (fun (node : encoded_node) ->
      ({ id = node.id; extends = Rrbvec.of_array node.extendsIds }
        : Domain.node))
  |> Rrbvec.of_array
  |> Domain.extends_ids ~root_id
  |> Rrbvec.to_array

let extendsEntitiesWith runtime datascript root =
  let db_id = Support.Runtime_codec.keyword_from_string runtime "db/id" in
  let extends =
    Support.Runtime_codec.keyword_from_string runtime
      "logseq.property.class/extends"
  in
  Domain.extends_entities_with
    ~entity_id:(fun entity ->
      Support.Datascript.entity_get datascript entity db_id
      |> Support.Runtime_codec.int_from_value runtime)
    ~entity_extends:(fun entity ->
      Support.Datascript.entity_get datascript entity extends
      |> Support.Runtime_codec.collection_to_array runtime)
    root

let extendsEntitiesCheckedWith runtime datascript root =
  if not (Support.Datascript.entity_is datascript root) then
    invalid_arg "get-class-extends class should be an entity";
  extendsEntitiesWith runtime datascript root

let logseqClassValueWith runtime value =
  if not (Support.Runtime_codec.value_is_keyword runtime value) then false
  else
    let ident = Support.Runtime_codec.keyword_to_string runtime value in
    match String.index_opt ident '/' with
    | None -> false
    | Some index -> Domain.logseq_class (String.sub ident 0 index)

let structuredChildren runtime datascript database root =
  let rule =
    Melange_db.Rules.find_body "class-extends"
    |> Support.encode_datalog_form runtime
  in
  Domain.structured_children_with
    ~encode_form:(Support.encode_datalog_form runtime)
    ~query:(fun form inputs ->
      Support.Datascript.query datascript form database inputs)
    ~collection_to_array:(Support.Runtime_codec.collection_to_array runtime)
    ~value_equals:(Support.Runtime_codec.value_equals runtime)
    ~root ~rule

let objectsWith runtime datascript database root =
  let rule =
    Melange_db.Rules.find_body "class-extends"
    |> Support.encode_datalog_form runtime
  in
  let field value name =
    Support.Datascript.entity_get datascript value
      (Support.Runtime_codec.keyword_from_string runtime name)
  in
  let entity_like value =
    Support.Runtime_codec.value_is_map runtime value
    || Support.Datascript.entity_is datascript value
  in
  let hidden value =
    Melange_db.Entity_read.hidden_value_with ~get:field
      ~is_nil:(Support.Runtime_codec.value_is_nil runtime)
      ~is_string:(Support.Runtime_codec.value_is_string runtime)
      ~string_from_value:(Support.Runtime_codec.string_from_value runtime)
      ~entity_like
      ~truthy:(Support.Runtime_codec.value_truthy runtime)
      ~value_to_string:(Support.Runtime_codec.value_to_string runtime)
      value
  in
  Domain.objects_with
    ~encode_form:(Support.encode_datalog_form runtime)
    ~query:(fun form inputs ->
      Support.Datascript.query datascript form database inputs)
    ~collection_to_array:(Support.Runtime_codec.collection_to_array runtime)
    ~value_equals:(Support.Runtime_codec.value_equals runtime)
    ~datoms:(fun index components ->
      Support.Datascript.datoms datascript database index components)
    ~datom_entity:(Support.Datascript.datom_entity datascript)
    ~entity:(fun id ->
      Support.Datascript.entity datascript database id
      |> Js.Nullable.toOption)
    ~hidden ~root ~rule
    ~index:(Support.Runtime_codec.keyword_from_string runtime "avet")
    ~attribute:
      (Support.Runtime_codec.keyword_from_string runtime "block/tags")

let objectIds candidates =
  candidates
  |> Array.map (fun (candidate : encoded_object) ->
      ({ id = candidate.id; hidden = candidate.hidden }
        : Domain.object_candidate))
  |> Rrbvec.of_array |> Domain.object_ids |> Rrbvec.to_array

let logseqClass = Domain.logseq_class
let userClassNamespace = Domain.user_class_namespace
