module Domain = Melange_db.Transaction_workflow

let capabilities runtime datascript :
    Support.Runtime_codec.cljs_value Domain.capabilities =
  {
    entity_id =
      (fun value ->
        if not (Support.Datascript.entity_is datascript value) then
          `Not_entity
        else
          let id = Entity_read.field runtime datascript value "db/id" in
          if Support.Runtime_codec.value_is_nil runtime id then `Missing
          else `Id id);
    map_entries =
      (fun value ->
        if Support.Runtime_codec.value_is_map runtime value then
          value
          |> Support.Runtime_codec.map_to_entries runtime
          |> Array.map (fun entry ->
              if Array.length entry <> 2 then
                invalid_arg "DB transaction workflow: invalid map entry";
              (Array.get entry 0, Array.get entry 1))
          |> Rrbvec.of_array |> Option.some
        else None);
    collection =
      (fun value ->
        if Support.Runtime_codec.value_is_vector runtime value then
          Some
            ( `Vector,
              value
              |> Support.Runtime_codec.vector_to_array runtime
              |> Rrbvec.of_array )
        else if Support.Runtime_codec.value_is_set runtime value then
          Some
            ( `Set,
              value
              |> Support.Runtime_codec.set_to_array runtime
              |> Rrbvec.of_array )
        else if Support.Runtime_codec.value_is_sequential runtime value then
          Some
            ( `Sequential,
              value
              |> Support.Runtime_codec.collection_to_array runtime
              |> Rrbvec.of_array )
        else None);
    build_map =
      (fun entries ->
        entries
        |> Rrbvec.map (fun (key, value) -> [| key; value |])
        |> Rrbvec.to_array
        |> Support.Runtime_codec.entries_to_map runtime);
    build_collection =
      (fun kind values ->
        let values = Rrbvec.to_array values in
        match kind with
        | `Vector -> Support.Runtime_codec.array_to_vector runtime values
        | `Set -> Support.Runtime_codec.array_to_set runtime values
        | `Sequential -> Support.Runtime_codec.array_to_list runtime values);
    integer = Support.Runtime_codec.value_is_integer runtime;
    nil = Support.Runtime_codec.value_is_nil runtime;
    value_text =
      (fun value ->
        if Support.Runtime_codec.value_is_keyword runtime value then
          Support.Runtime_codec.keyword_to_string runtime value
        else Support.Runtime_codec.value_to_string runtime value);
  }

let replaceEntities runtime datascript value =
  Domain.replace_entities (capabilities runtime datascript) value

let prepare runtime datascript tx_data external_transact =
  tx_data
  |> Support.Runtime_codec.collection_to_array runtime
  |> Rrbvec.of_array
  |> Domain.prepare (capabilities runtime datascript) ~external_transact
  |> Rrbvec.to_array
