let missing_from_arrays schema_roots rows row_address row_addresses =
  let present = ref [] in
  let referenced = ref [] in
  Array.iter
    (fun row ->
      present := row_address row :: !present;
      referenced :=
        Array.to_list (row_addresses row) |> List.rev_append !referenced)
    rows;
  let required =
    0 :: 1 :: Array.to_list schema_roots |> List.rev_append !referenced
  in
  Sqlite_policy.missingAddresses (Array.of_list required)
    (Array.of_list !present)

let findMissingWasm database =
  missing_from_arrays
    (Sqlite_kvs.wasm_schema_roots database)
    (Sqlite_kvs.wasm_rows database)
    (fun row ->
      fst (Sqlite_kvs.row_pair row "SQLite debug row")
      |> Sqlite_kvs.json_int "SQLite debug row address")
    (fun row ->
      snd (Sqlite_kvs.row_pair row "SQLite debug row")
      |> Sqlite_kvs.json_string "SQLite debug row addresses"
      |> Sqlite_kvs.parse_addresses)

let findMissingNode database =
  missing_from_arrays
    (Sqlite_kvs.node_schema_roots database)
    (Sqlite_kvs.node_rows database)
    (fun row ->
      Sqlite_kvs.field (Sqlite_kvs.json_object row "SQLite debug row") "addr"
        "SQLite debug row"
      |> Sqlite_kvs.json_int "SQLite debug row address")
    (fun row ->
      Sqlite_kvs.field
        (Sqlite_kvs.json_object row "SQLite debug row")
        "addresses" "SQLite debug row"
      |> Sqlite_kvs.json_string "SQLite debug row addresses"
      |> Sqlite_kvs.parse_addresses)
