let entries =
  Support.Kv_entity.entries
  |> Rrbvec.map (fun entry ->
      ( Support.Kv_entity.keyword entry,
        Support.Kv_entity.doc entry,
        Support.Kv_entity.ignore_entity_when_init_upload entry ))
  |> Rrbvec.to_array
