let entries =
  Melange_db.Kv_entity.entries
  |> Rrbvec.map (fun entry ->
      ( Melange_db.Kv_entity.keyword entry,
        Melange_db.Kv_entity.doc entry,
        Melange_db.Kv_entity.ignore_entity_when_init_upload entry ))
  |> Rrbvec.to_array
