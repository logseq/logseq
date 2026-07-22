module Domain = Melange_db.Bidirectional

type encoded_class_ref = {
  classId : int;
  classValue : bool;
  builtIn : bool;
  recycled : bool;
  enabled : bool;
  createdAt : float Js.Nullable.t;
}

type encoded_candidate = {
  entityId : int;
  target : bool;
  recycled : bool;
  classValue : bool;
  propertyValue : bool;
  createdAt : float Js.Nullable.t;
  classes : encoded_class_ref array;
}

type encoded_group = { classId : int; entityIds : int array }

let groups target_id candidates =
  candidates
  |> Array.map (fun (candidate : encoded_candidate) ->
      ({
         entity_id = candidate.entityId;
         target = candidate.target;
         recycled = candidate.recycled;
         class_ = candidate.classValue;
         property = candidate.propertyValue;
         created_at = Js.Nullable.toOption candidate.createdAt;
         classes =
           candidate.classes
           |> Array.map (fun (class_ref : encoded_class_ref) ->
               ({
                  id = class_ref.classId;
                  class_ = class_ref.classValue;
                  built_in = class_ref.builtIn;
                  recycled = class_ref.recycled;
                  enabled = class_ref.enabled;
                  created_at = Js.Nullable.toOption class_ref.createdAt;
                }
                 : Domain.class_ref))
           |> Rrbvec.of_array;
       }
        : Domain.candidate))
  |> Rrbvec.of_array |> Domain.groups ~target_id
  |> Rrbvec.map (fun group ->
      ({
         classId = Domain.group_class_id group;
         entityIds = Domain.group_entity_ids group |> Rrbvec.to_array;
       }
        : encoded_group))
  |> Rrbvec.to_array

let field runtime datascript entity name =
  Support.Datascript.entity_get datascript entity
    (Support.Runtime_codec.keyword_from_string runtime name)

let collection runtime datascript entity name =
  let value = field runtime datascript entity name in
  if Support.Runtime_codec.value_is_nil runtime value then Rrbvec.empty
  else
    value
    |> Support.Runtime_codec.collection_to_array runtime
    |> Rrbvec.of_array

let tag_idents runtime datascript entity =
  Support.entity_tag_texts runtime datascript entity

let has_tag runtime datascript entity target =
  Melange_db.Entity_read.has_tag (tag_idents runtime datascript entity) target

let recycled runtime datascript entity =
  Melange_db.Entity_read.recycled_value_with
    ~get:(fun value name -> field runtime datascript value name)
    ~is_nil:(Support.Runtime_codec.value_is_nil runtime)
    ~entity_like:(fun value ->
      Support.Runtime_codec.value_is_map runtime value
      || Support.Datascript.entity_is datascript value)
    ~truthy:(Support.Runtime_codec.value_truthy runtime)
    ~value_to_string:(Support.Runtime_codec.value_to_string runtime)
    entity

let entity_map runtime datascript entity =
  let value =
    entity
    |> Support.Runtime_codec.map_to_entries runtime
    |> Support.Runtime_codec.entries_to_map runtime
  in
  Support.Runtime_codec.map_assoc runtime value
    (Support.Runtime_codec.keyword_from_string runtime "db/id")
    (field runtime datascript entity "db/id")

let getPropertiesWith runtime datascript database target_id =
  match (Js.Nullable.toOption database, Js.Nullable.toOption target_id) with
  | None, _ | _, None -> Js.Nullable.null
  | Some database, Some target_id ->
      let keyword name =
        Support.Runtime_codec.keyword_from_string runtime name
      in
      let entity id =
        Support.Datascript.entity datascript database
          (Support.Runtime_codec.int_to_value runtime id)
        |> Js.Nullable.toOption
      in
      let optional_field value name =
        let result = field runtime datascript value name in
        if Support.Runtime_codec.value_is_nil runtime result then None
        else Some result
      in
      let required_string value name =
        field runtime datascript value name
        |> Support.Runtime_codec.string_from_value runtime
      in
      let capabilities :
          ( Support.Datascript.entity,
            Support.Runtime_codec.cljs_value )
          Domain.workflow_capabilities =
        {
          query_property_attrs =
            (fun query ->
              Support.Datascript.query datascript
                (Support.encode_datalog_form runtime query)
                database [||]
              |> Support.Runtime_codec.collection_to_array runtime
              |> Array.map (Support.Runtime_codec.keyword_to_string runtime)
              |> Rrbvec.of_array);
          referenced_entity_ids =
            (fun attribute target ->
              Support.Datascript.datoms datascript database (keyword "avet")
                [|
                  keyword attribute;
                  Support.Runtime_codec.int_to_value runtime target;
                |]
              |> Array.map (fun datom ->
                  Support.Datascript.datom_entity datascript datom
                  |> Support.Runtime_codec.int_from_value runtime)
              |> Rrbvec.of_array);
          entity;
          entity_id =
            (fun value ->
              field runtime datascript value "db/id"
              |> Support.Runtime_codec.int_from_value runtime);
          recycled = recycled runtime datascript;
          class_value =
            (fun value -> has_tag runtime datascript value "logseq.class/Tag");
          property_value =
            (fun value ->
              has_tag runtime datascript value "logseq.class/Property");
          created_at =
            (fun value ->
              optional_field value "block/created-at"
              |> Option.map (Support.Runtime_codec.float_from_value runtime));
          classes =
            (fun value -> collection runtime datascript value "block/tags");
          built_in =
            (fun value ->
              field runtime datascript value "logseq.property/built-in?"
              |> Support.Runtime_codec.value_truthy runtime);
          bidirectional_enabled =
            (fun value ->
              field runtime datascript value
                "logseq.property.class/enable-bidirectional?"
              |> Support.Runtime_codec.value_truthy runtime);
          created_from_property =
            (fun value ->
              field runtime datascript value
                "logseq.property/created-from-property"
              |> Support.Runtime_codec.value_truthy runtime);
          custom_title =
            (fun value ->
              optional_field value
                "logseq.property.class/bidirectional-property-title");
          value_is_string = Support.Runtime_codec.value_is_string runtime;
          string_from_value =
            Support.Runtime_codec.string_from_value runtime;
          property_value_content =
            (fun value ->
              Melange_db.Property_workflow.value_content_with
                ~get:(fun value name -> field runtime datascript value name)
                ~truthy:(Support.Runtime_codec.value_truthy runtime)
                value
              |> Support.Runtime_codec.string_from_value runtime);
          title = (fun value -> required_string value "block/title");
          plural = Melange_common.Plural.plural;
        }
      in
      Domain.groups_with capabilities ~target_id
      |> Option.map (fun groups ->
          groups
          |> Rrbvec.map (fun group ->
              let class_value = Domain.resolved_class group in
              let entities =
                Domain.resolved_entities group
                |> Rrbvec.to_array
                |> Support.Runtime_codec.array_to_list runtime
              in
              Support.Runtime_codec.entries_to_map runtime
                [|
                  [|
                    keyword "title";
                    Support.Runtime_codec.string_to_value runtime
                      (Domain.resolved_title group);
                  |];
                  [|
                    keyword "class"; entity_map runtime datascript class_value;
                  |];
                  [| keyword "entities"; entities |];
                |])
          |> Rrbvec.to_array)
      |> Js.Nullable.fromOption
