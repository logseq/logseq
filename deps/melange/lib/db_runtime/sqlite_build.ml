module Domain = Melange_db.Sqlite_build

type encoded_property_schema = {
  propertyType : string;
  cardinality : string Js.Nullable.t;
}

let classPropertyOrder constraints =
  constraints |> Array.map Rrbvec.of_array |> Rrbvec.of_array
  |> Domain.class_property_order |> Rrbvec.to_array

let propertySchema collection kind inferred_type =
  let value =
    match kind with
    | "missing" -> Domain.Missing
    | "page" -> Page { journal = false }
    | "journal" -> Page { journal = true }
    | "scalar" -> Scalar inferred_type
    | value -> invalid_arg ("DB SQLite build: unknown property kind " ^ value)
  in
  let schema = Domain.property_schema ~collection value in
  ({
     propertyType = schema.property_type;
     cardinality = Js.Nullable.fromOption schema.cardinality;
   }
    : encoded_property_schema)

let nextTempId () = Domain.next_temp_id Domain.default_temp_id_state

let children runtime block =
  let value =
    Melange_cljs_runtime_spec.Value_codec.map_get runtime block
      (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
         "build/children")
  in
  if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime value then
    Rrbvec.empty
  else
    Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime value
    |> Rrbvec.of_array

let extractBlocksWith runtime blocks callback =
  blocks
  |> Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime
  |> Rrbvec.of_array
  |> Domain.extract_blocks ~children:(children runtime) ~apply:(fun block ->
      Melange_cljs_runtime_spec.Value_codec.invoke_callback runtime callback
        block
      |> Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime
      |> Rrbvec.of_array)
  |> Rrbvec.to_array
  |> Melange_cljs_runtime_spec.Value_codec.array_to_list runtime

let updateBlocksWith runtime blocks callback =
  blocks
  |> Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime
  |> Rrbvec.of_array
  |> Domain.update_blocks ~children:(children runtime)
       ~with_children:(fun block nested ->
         Melange_cljs_runtime_spec.Value_codec.map_assoc runtime block
           (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
              "build/children")
           (nested |> Rrbvec.to_array
           |> Melange_cljs_runtime_spec.Value_codec.array_to_vector runtime))
       ~update:
         (Melange_cljs_runtime_spec.Value_codec.invoke_callback runtime callback)
  |> Rrbvec.to_array
  |> Melange_cljs_runtime_spec.Value_codec.array_to_vector runtime

let field runtime value name =
  Melange_cljs_runtime_spec.Value_codec.map_get runtime value
    (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime name)

let collection runtime value =
  if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime value then [||]
  else Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime value

let property_values runtime value =
  if Melange_cljs_runtime_spec.Value_codec.value_is_set runtime value then
    Melange_cljs_runtime_spec.Value_codec.set_to_array runtime value
  else [| value |]

let page_property_value runtime value =
  if not (Melange_cljs_runtime_spec.Value_codec.value_is_vector runtime value)
  then None
  else
    match
      Melange_cljs_runtime_spec.Value_codec.vector_to_array runtime value
    with
    | [| marker; page |]
      when Melange_cljs_runtime_spec.Value_codec.value_equals runtime marker
             (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
                "build/page") ->
        Some page
    | _ -> None

let block_property_value runtime value =
  Melange_cljs_runtime_spec.Value_codec.value_is_map runtime value
  && field runtime value "build/property-value"
     |> Melange_cljs_runtime_spec.Value_codec.value_truthy runtime

let blockPropertyValueWith = block_property_value

let pagePropertyValueWith runtime value =
  Option.is_some (page_property_value runtime value)

let add_distinct_pair runtime pairs key value =
  let duplicate =
    Rrbvec.exists
      (fun (existing_key, existing_value) ->
        Melange_cljs_runtime_spec.Value_codec.value_equals runtime existing_key
          key
        && Melange_cljs_runtime_spec.Value_codec.value_equals runtime
             existing_value value)
      pairs
  in
  if duplicate then pairs else Rrbvec.push_back pairs (key, value)

let map_property_pairs runtime pairs properties =
  if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime properties then
    pairs
  else
    properties
    |> Melange_cljs_runtime_spec.Value_codec.map_to_entries runtime
    |> Array.fold_left
         (fun result -> function
           | [| key; value |] -> add_distinct_pair runtime result key value
           | _ -> invalid_arg "Build properties expect map entries")
         pairs

let rec node_property_pairs runtime pairs nodes =
  nodes
  |> Rrbvec.fold_left
       (fun result node ->
         let properties = field runtime node "build/properties" in
         let result = map_property_pairs runtime result properties in
         let nested_nodes =
           if
             Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime
               properties
           then Rrbvec.empty
           else
             properties
             |> Melange_cljs_runtime_spec.Value_codec.map_to_entries runtime
             |> Array.fold_left
                  (fun nested -> function
                    | [| _key; value |] ->
                        value |> property_values runtime
                        |> Array.fold_left
                             (fun nested value ->
                               match page_property_value runtime value with
                               | Some page -> Rrbvec.push_back nested page
                               | None when block_property_value runtime value ->
                                   Rrbvec.push_back nested value
                               | None -> nested)
                             nested
                    | _ -> nested)
                  Rrbvec.empty
         in
         node_property_pairs runtime result nested_nodes)
       pairs

let getUsedPropertiesWith runtime options =
  let pages_and_blocks = field runtime options "pages-and-blocks" in
  let pairs =
    pages_and_blocks |> collection runtime |> Rrbvec.of_array
    |> Rrbvec.fold_left
         (fun result page_and_blocks ->
           let blocks =
             field runtime page_and_blocks "blocks"
             |> collection runtime |> Rrbvec.of_array
           in
           let nodes =
             Rrbvec.push_back blocks (field runtime page_and_blocks "page")
           in
           node_property_pairs runtime result nodes)
         Rrbvec.empty
  in
  let properties = field runtime options "properties" in
  let pairs =
    properties
    |> (fun properties ->
    if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime properties
    then [||]
    else Melange_cljs_runtime_spec.Value_codec.map_to_entries runtime properties)
    |> Array.fold_left
         (fun result -> function
           | [| _ident; definition |] ->
               map_property_pairs runtime result
                 (field runtime definition "build/properties")
           | _ -> result)
         pairs
  in
  let no_value =
    Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
      "logseq.db.sqlite.build/no-value"
  in
  let classes = field runtime options "classes" in
  let pairs =
    classes
    |> (fun classes ->
    if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime classes then
      [||]
    else Melange_cljs_runtime_spec.Value_codec.map_to_entries runtime classes)
    |> Array.fold_left
         (fun result -> function
           | [| _ident; definition |] ->
               let result =
                 field runtime definition "build/class-properties"
                 |> collection runtime
                 |> Array.fold_left
                      (fun result property ->
                        add_distinct_pair runtime result property no_value)
                      result
               in
               map_property_pairs runtime result
                 (field runtime definition "build/properties")
           | _ -> result)
         pairs
  in
  let groups =
    Rrbvec.fold_left
      (fun groups (key, value) ->
        let found = ref false in
        let groups =
          Rrbvec.map
            (fun (existing_key, values) ->
              if
                Melange_cljs_runtime_spec.Value_codec.value_equals runtime
                  existing_key key
              then (
                found := true;
                (existing_key, Rrbvec.push_back values value))
              else (existing_key, values))
            groups
        in
        if !found then groups
        else Rrbvec.push_back groups (key, Rrbvec.singleton value))
      Rrbvec.empty pairs
  in
  groups
  |> Rrbvec.map (fun (key, values) ->
      [|
        key;
        values |> Rrbvec.to_array
        |> Melange_cljs_runtime_spec.Value_codec.array_to_vector runtime;
      |])
  |> Rrbvec.to_array
  |> Melange_cljs_runtime_spec.Value_codec.entries_to_map runtime

let inferPropertySchemaWith runtime property_pair_values =
  let no_value =
    Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
      "logseq.db.sqlite.build/no-value"
  in
  let observed =
    Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime
      property_pair_values
  in
  let property_value =
    Array.find_opt
      (fun value ->
        not
          (Melange_cljs_runtime_spec.Value_codec.value_equals runtime value
             no_value))
      observed
  in
  let property_value =
    property_value
    |> Option.map (fun value ->
        if Melange_cljs_runtime_spec.Value_codec.value_is_set runtime value then
          let values =
            Melange_cljs_runtime_spec.Value_codec.set_to_array runtime value
          in
          if Array.length values = 0 then
            Melange_cljs_runtime_spec.Value_codec.nil_value runtime
          else values.(0)
        else value)
  in
  let collection =
    property_value
    |> Option.fold ~none:false ~some:(fun _ ->
        observed
        |> Array.find_opt (fun value ->
            not
              (Melange_cljs_runtime_spec.Value_codec.value_equals runtime value
                 no_value))
        |> Option.fold ~none:false
             ~some:(Melange_cljs_runtime_spec.Value_codec.value_is_set runtime))
  in
  let value =
    match property_value with
    | None -> Domain.Missing
    | Some value
      when Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime value ->
        Missing
    | Some value -> (
        match page_property_value runtime value with
        | Some page ->
            Domain.Page
              {
                journal =
                  field runtime page "build/journal"
                  |> Melange_cljs_runtime_spec.Value_codec.value_truthy runtime;
              }
        | None ->
            let property_type =
              Melange_db.Property_type.infer
                ~number:
                  (Melange_cljs_runtime_spec.Value_codec.value_is_number runtime
                     value)
                ~url:
                  (Melange_cljs_runtime_spec.Value_codec.value_is_string runtime
                     value
                  && Melange_cljs_runtime_spec.Value_codec.string_is_url runtime
                       (Melange_cljs_runtime_spec.Value_codec.string_from_value
                          runtime value))
                ~boolean:
                  (Melange_cljs_runtime_spec.Value_codec.value_is_bool runtime
                     value)
              |> Melange_db.Property_type.to_string
            in
            Domain.Scalar property_type)
  in
  let schema = Domain.property_schema ~collection value in
  let result =
    Melange_cljs_runtime_spec.Value_codec.map_assoc runtime
      (Melange_cljs_runtime_spec.Value_codec.entries_to_map runtime [||])
      (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
         "logseq.property/type")
      (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
         schema.property_type)
  in
  match schema.cardinality with
  | None -> result
  | Some cardinality ->
      Melange_cljs_runtime_spec.Value_codec.map_assoc runtime result
        (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
           "db/cardinality")
        (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
           cardinality)

let namespace_of_keyword runtime value =
  if not (Melange_cljs_runtime_spec.Value_codec.value_is_keyword runtime value)
  then None
  else
    let text =
      Melange_cljs_runtime_spec.Value_codec.keyword_to_string runtime value
    in
    String.rindex_opt text '/'
    |> Option.map (fun index -> String.sub text 0 index)

let contains_key runtime map key =
  map
  |> Melange_cljs_runtime_spec.Value_codec.map_to_entries runtime
  |> Array.exists (function
    | [| existing; _value |] ->
        Melange_cljs_runtime_spec.Value_codec.value_equals runtime existing key
    | _ -> false)

let merge_maps runtime base extra =
  extra
  |> Melange_cljs_runtime_spec.Value_codec.map_to_entries runtime
  |> Array.fold_left
       (fun result -> function
         | [| key; value |] ->
             Melange_cljs_runtime_spec.Value_codec.map_assoc runtime result key
               value
         | _ -> result)
       base

let autoCreateOntologyWith runtime options =
  let empty_map () =
    Melange_cljs_runtime_spec.Value_codec.entries_to_map runtime [||]
  in
  let pages_and_blocks =
    field runtime options "pages-and-blocks" |> collection runtime
  in
  let properties =
    let value = field runtime options "properties" in
    if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime value then
      empty_map ()
    else value
  in
  let classes =
    let value = field runtime options "classes" in
    if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime value then
      empty_map ()
    else value
  in
  let used_classes =
    pages_and_blocks
    |> Array.fold_left
         (fun result page_and_blocks ->
           let nodes =
             Array.append
               (field runtime page_and_blocks "blocks" |> collection runtime)
               [| field runtime page_and_blocks "page" |]
           in
           nodes
           |> Array.fold_left
                (fun result node ->
                  field runtime node "build/tags"
                  |> collection runtime
                  |> Array.fold_left
                       (fun result tag ->
                         let logseq_class =
                           namespace_of_keyword runtime tag
                           |> Option.fold ~none:false
                                ~some:Melange_db.Class_read.logseq_class
                         in
                         if
                           logseq_class
                           || contains_key runtime classes tag
                           || Rrbvec.exists
                                (Melange_cljs_runtime_spec.Value_codec
                                 .value_equals runtime tag)
                                result
                         then result
                         else Rrbvec.push_back result tag)
                       result)
                result)
         Rrbvec.empty
  in
  let new_classes =
    used_classes
    |> Rrbvec.map (fun ident -> [| ident; empty_map () |])
    |> Rrbvec.to_array
    |> Melange_cljs_runtime_spec.Value_codec.entries_to_map runtime
  in
  let classes = merge_maps runtime new_classes classes in
  let used_properties = getUsedPropertiesWith runtime options in
  let new_properties =
    used_properties
    |> Melange_cljs_runtime_spec.Value_codec.map_to_entries runtime
    |> Array.fold_left
         (fun result -> function
           | [| ident; values |] ->
               let text =
                 if
                   Melange_cljs_runtime_spec.Value_codec.value_is_keyword
                     runtime ident
                 then
                   Melange_cljs_runtime_spec.Value_codec.keyword_to_string
                     runtime ident
                 else
                   Melange_cljs_runtime_spec.Value_codec.value_to_string runtime
                     ident
               in
               let internal =
                 let namespace_ = namespace_of_keyword runtime ident in
                 Melange_db.Property_identity.is_internal_property ~namespace_
                   ~ident:text
                   ~is_keyword:
                     (Melange_cljs_runtime_spec.Value_codec.value_is_keyword
                        runtime ident)
               in
               if contains_key runtime properties ident || internal then result
               else
                 Rrbvec.push_back result
                   [| ident; inferPropertySchemaWith runtime values |]
           | _ -> result)
         Rrbvec.empty
    |> Rrbvec.to_array
    |> Melange_cljs_runtime_spec.Value_codec.entries_to_map runtime
  in
  let properties = merge_maps runtime new_properties properties in
  let result =
    Melange_cljs_runtime_spec.Value_codec.map_assoc runtime (empty_map ())
      (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
         "classes")
      classes
  in
  Melange_cljs_runtime_spec.Value_codec.map_assoc runtime result
    (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
       "properties")
    properties
