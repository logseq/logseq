module Domain = Melange_db.Transaction_workflow

let capabilities runtime datascript :
    Melange_cljs_runtime_spec.Value_codec.cljs_value Domain.capabilities =
  {
    entity_id =
      (fun value ->
        if not (Melange_datascript_spec.Api.entity_is datascript value) then
          `Not_entity
        else
          let id = Entity_read.field runtime datascript value "db/id" in
          if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime id then
            `Missing
          else `Id id);
    map_entries =
      (fun value ->
        if Melange_cljs_runtime_spec.Value_codec.value_is_map runtime value then
          value
          |> Melange_cljs_runtime_spec.Value_codec.map_to_entries runtime
          |> Array.map (fun entry ->
              if Array.length entry <> 2 then
                invalid_arg "DB transaction workflow: invalid map entry";
              (Array.get entry 0, Array.get entry 1))
          |> Rrbvec.of_array |> Option.some
        else None);
    collection =
      (fun value ->
        if Melange_cljs_runtime_spec.Value_codec.value_is_vector runtime value
        then
          Some
            ( `Vector,
              value
              |> Melange_cljs_runtime_spec.Value_codec.vector_to_array runtime
              |> Rrbvec.of_array )
        else if Melange_cljs_runtime_spec.Value_codec.value_is_set runtime value
        then
          Some
            ( `Set,
              value
              |> Melange_cljs_runtime_spec.Value_codec.set_to_array runtime
              |> Rrbvec.of_array )
        else if
          Melange_cljs_runtime_spec.Value_codec.value_is_sequential runtime
            value
        then
          Some
            ( `Sequential,
              value
              |> Melange_cljs_runtime_spec.Value_codec.collection_to_array
                   runtime
              |> Rrbvec.of_array )
        else None);
    build_map =
      (fun entries ->
        entries
        |> Rrbvec.map (fun (key, value) -> [| key; value |])
        |> Rrbvec.to_array
        |> Melange_cljs_runtime_spec.Value_codec.entries_to_map runtime);
    build_collection =
      (fun kind values ->
        let values = Rrbvec.to_array values in
        match kind with
        | `Vector ->
            Melange_cljs_runtime_spec.Value_codec.array_to_vector runtime values
        | `Set ->
            Melange_cljs_runtime_spec.Value_codec.array_to_set runtime values
        | `Sequential ->
            Melange_cljs_runtime_spec.Value_codec.array_to_list runtime values);
    integer = Melange_cljs_runtime_spec.Value_codec.value_is_integer runtime;
    nil = Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime;
    value_text =
      (fun value ->
        if Melange_cljs_runtime_spec.Value_codec.value_is_keyword runtime value
        then
          Melange_cljs_runtime_spec.Value_codec.keyword_to_string runtime value
        else Melange_cljs_runtime_spec.Value_codec.value_to_string runtime value);
  }

let replaceEntities runtime datascript value =
  Domain.replace_entities (capabilities runtime datascript) value

let prepare runtime datascript tx_data external_transact =
  tx_data
  |> Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime
  |> Rrbvec.of_array
  |> Domain.prepare (capabilities runtime datascript) ~external_transact
  |> Rrbvec.to_array
