let () =
  let result = ref None in
  let path = Filename.concat (Filename.get_temp_dir_name ()) "logseq-absent-vector-capability" in
  Db_worker_effect.on_any (Vector_index.open_index ~path ~dimension:384)
    (fun index -> result := Some index) raise;
  if !result <> Some None then failwith "Native vector capability must be absent";
  if Embedding.enabled () || Embedding.model_id () <> None then
    failwith "Native embeddings must not activate without a vector backend";
  print_endline "PASS native vector capability is absent"
