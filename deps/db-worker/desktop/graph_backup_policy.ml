let backup_root_dir_name = "backup"
let backup_db_file_name = "db.sqlite"
let backup_metadata_file_name = "metadata.edn"
let metadata_schema_version = 1

let build_backup_name ~graph_name ~label ~timestamp =
  match Option.map String.trim label with
  | Some label when label <> "" ->
      graph_name ^ "-" ^ label ^ "-" ^ timestamp
  | Some _ | None -> graph_name ^ "-" ^ timestamp

let candidate_name ~base_name ~suffix =
  if suffix = 0 then base_name else base_name ^ "-" ^ string_of_int suffix

let metadata_fields ~keyword ~string ~int ~backup_name ~repo ~source
    ~created_at ~db_path =
  [ keyword "schema-version", int metadata_schema_version
  ; keyword "name", string backup_name
  ; keyword "repo", string repo
  ; keyword "source", keyword source
  ; keyword "created-at-ms", created_at
  ; keyword "db-path", string db_path
  ]
