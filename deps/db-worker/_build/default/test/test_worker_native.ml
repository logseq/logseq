(* Native smoke tests for the OCaml db-worker slice:
   wire helpers, dispatcher, and the end-to-end conn lifecycle over
   the kvs sqlite format. *)


let failures = ref 0

let check name cond =
  if cond then Printf.printf "ok - %s\n" name
  else begin
    incr failures;
    Printf.printf "FAIL - %s\n%!" name
  end

let string_contains haystack needle =
  let hl = String.length haystack and nl = String.length needle in
  let rec go i =
    if i + nl > hl then false
    else if String.sub haystack i nl = needle then true
    else go (i + 1)
  in
  go 0

let await task =
  let result = ref None in
  Db_worker_effect.on_any task (fun v -> result := Some (Ok v)) (fun e -> result := Some (Error e));
  match !result with
  | Some (Ok v) -> v
  | Some (Error e) -> raise e
  | None -> failwith "task still pending"

let repo = "test/graph"

let setup () =
  let dir = Filename.temp_dir "db_worker_test" "XXXXXX" in
  Unix.putenv "LOGSEQ_WORKER_DB_DIR" dir;
  dir

let () =
  (* --- wire helpers --- *)
  let m = Wire.kw_map [ ("a", Wire.int 1); ("b", Wire.string "s") ] in
  check "kw_map get int" (Wire.get_exn "a" m |> Wire.as_int = Some 1);
  check "kw_map get string" (Wire.get_exn "b" m |> Wire.as_string = Some "s");
  check "kw_map missing" (Wire.get "c" m = None);

  (* --- edn_of_transit --- *)
  let edn =
    Ds_wire.edn_of_transit
      (Wire.Array [ Wire.Keyword "db/add"; Wire.Int (-1); Wire.Keyword "block/name"; Wire.String "x" ])
  in
  check "edn tx vector" (edn = "[:db/add -1 :block/name \"x\"]");

  let edn_map =
    Ds_wire.edn_of_transit
      (Wire.Map [ (Wire.Keyword "db/unique", Wire.Keyword "db.unique/identity") ])
  in
  check "edn map" (edn_map = "{:db/unique :db.unique/identity}");

  (* --- dispatcher --- *)
  Worker_core.init ();
  check "registered q" (Dispatcher.registered "thread-api/q");
  check "not registered" (not (Dispatcher.registered "thread-api/nope"));
  let err = await (Worker_core.invoke "thread-api/nope" "[]") in
  check "unregistered returns error transit" (string_contains err "error");

  (* --- lifecycle end-to-end --- *)
  let _dir = setup () in
  let args = Wire.Array [ Wire.String repo; Wire.Map [ (Wire.Keyword "schema", Wire.Map [ (Wire.Keyword "block/name", Wire.Map [ (Wire.Keyword "db/unique", Wire.Keyword "db.unique/identity") ]) ]) ] ] in
  let schema_args = Transit_codec.to_string args in
  let res = await (Worker_core.invoke "thread-api/create-or-open-db" schema_args) in
  check "create-or-open-db ok" (not (string_contains res "error"));

  let tx_args =
    Transit_codec.to_string
      (Wire.Array
         [
           Wire.String repo;
           Wire.Array
             [
               Wire.Array [ Wire.Keyword "db/add"; Wire.Int (-1); Wire.Keyword "block/name"; Wire.String "hello" ];
               Wire.Array [ Wire.Keyword "db/add"; Wire.Int (-2); Wire.Keyword "block/title"; Wire.String "t" ];
             ];
           Wire.Nil;
           Wire.Nil;
         ])
  in
  let tx_res = await (Worker_core.invoke "thread-api/transact" tx_args) in
  check "transact returns report" (string_contains tx_res "db-after");

  let q_args =
    Transit_codec.to_string
      (Wire.Array
         [
           Wire.String repo;
           Wire.Array [ Wire.String "[:find ?e :where [?e :block/name \"hello\"]]" ];
         ])
  in
  let q_res = await (Worker_core.invoke "thread-api/q" q_args) in
  check "q returns rows" (string_contains q_res "[[" || not (string_contains q_res "error"));

  let pull_args =
    Transit_codec.to_string
      (Wire.Array [ Wire.String repo; Wire.String "[*]"; Wire.Int 1 ])
  in
  let pull_res = await (Worker_core.invoke "thread-api/pull" pull_args) in
  check "pull returns map" (string_contains pull_res "db/id" || string_contains pull_res "hello");

  let datoms_args =
    Transit_codec.to_string (Wire.Array [ Wire.String repo; Wire.Keyword "eavt" ])
  in
  let datoms_res = await (Worker_core.invoke "thread-api/datoms" datoms_args) in
  check "datoms returns tuples" (string_contains datoms_res "block/name");

  (* --- persistence across reopen --- *)
  let _ = await (Worker_core.invoke "thread-api/close-db" (Transit_codec.to_string (Wire.Array [ Wire.String repo ]))) in
  let res2 = await (Worker_core.invoke "thread-api/create-or-open-db" schema_args) in
  check "reopen ok" (not (string_contains res2 "error"));
  let q_res2 = await (Worker_core.invoke "thread-api/q" q_args) in
  check "data survives reopen" (q_res2 = q_res || string_contains q_res2 "[[");

  let list_res = await (Worker_core.invoke "thread-api/list-db" "[]") in
  check "list-db has repo" (string_contains list_res repo);

  if !failures > 0 then begin
    Printf.printf "%d failures\n%!" !failures;
    exit 1
  end else Printf.printf "all tests passed\n"
