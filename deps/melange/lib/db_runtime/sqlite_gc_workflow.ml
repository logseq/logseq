module Domain = Melange_db.Sqlite_gc_workflow

type database = Js.Json.t

let wasm_capabilities : database Domain.capabilities =
  {
    index_roots =
      (fun database -> Sqlite_kvs.wasm_schema_roots database |> Rrbvec.of_array);
    non_referenced =
      (fun database ->
        Sqlite_kvs.wasm_non_referenced database |> Rrbvec.of_array);
    edges = (fun _database -> Rrbvec.empty);
    delete = Sqlite_kvs.wasm_delete;
    address_count = (fun _database -> 0);
  }

let node_capabilities : database Domain.capabilities =
  {
    index_roots =
      (fun database -> Sqlite_kvs.node_schema_roots database |> Rrbvec.of_array);
    non_referenced =
      (fun database ->
        Sqlite_kvs.node_non_referenced database |> Rrbvec.of_array);
    edges = (fun database -> Sqlite_kvs.node_edges database |> Rrbvec.of_array);
    delete = Sqlite_kvs.node_delete;
    address_count = Sqlite_kvs.node_address_count;
  }

let collectWasmDefault (database : database Js.Nullable.t) full_gc =
  Domain.collect_wasm_with wasm_capabilities
    (Js.Nullable.toOption database)
    ~full_gc

let collectNodeDefault database walk =
  Domain.collect_node_with node_capabilities database ~walk

let ensureNoGarbageDefault database =
  Domain.ensure_no_garbage_with node_capabilities database
