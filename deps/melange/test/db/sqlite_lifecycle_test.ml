open Melange_db

let () =
  Fest.test "DB SQLite storage connection owns restore-or-create sequencing"
    (fun () ->
      let calls = ref [] in
      let restored =
        Sqlite_lifecycle.storage_connection
          ~restore:(fun storage ->
            calls := !calls @ [ "restore:" ^ storage ];
            Some "restored")
          ~create:(fun schema storage ->
            calls := !calls @ [ "create:" ^ schema ^ ":" ^ storage ];
            "created")
          ~storage:"store" ~schema:"schema"
      in
      Fest.equal restored "restored" Fest.expect;
      Fest.deepEqual !calls [ "restore:store" ] Fest.expect;
      calls := [];
      let created =
        Sqlite_lifecycle.storage_connection
          ~restore:(fun storage ->
            calls := !calls @ [ "restore:" ^ storage ];
            None)
          ~create:(fun schema storage ->
            calls := !calls @ [ "create:" ^ schema ^ ":" ^ storage ];
            "created")
          ~storage:"store" ~schema:"schema"
      in
      Fest.equal created "created" Fest.expect;
      Fest.deepEqual !calls
        [ "restore:store"; "create:schema:store" ]
        Fest.expect);
  Fest.Promise.test "DB SQLite backup cleans failed destinations" (fun () ->
      let removed = ref [] in
      let remove : Sqlite_lifecycle.remove =
       fun[@u] path -> removed := path :: !removed
      in
      let sync_backup : unit Sqlite_lifecycle.backup =
       fun[@u] _ _ -> raise (Failure "sync backup failure")
      in
      let async_backup : unit Sqlite_lifecycle.backup =
       fun[@u] _ _ -> Js.Promise.reject (Failure "async backup failure")
      in
      let sync_result =
        Sqlite_lifecycle.backup_connection ~backup:sync_backup ~remove ()
          "sync.sqlite"
        |> Js.Promise.catch (fun _ -> Js.Promise.resolve ())
      in
      sync_result
      |> Js.Promise.then_ (fun () ->
          Fest.deepEqual !removed [ "sync.sqlite" ] Fest.expect;
          Sqlite_lifecycle.backup_connection ~backup:async_backup ~remove ()
            "async.sqlite"
          |> Js.Promise.catch (fun _ -> Js.Promise.resolve ()))
      |> Js.Promise.then_ (fun () ->
          Fest.deepEqual !removed [ "async.sqlite"; "sync.sqlite" ] Fest.expect;
          Js.Promise.resolve ()));
  Fest.Promise.test "DB SQLite file backup closes its connection once"
    (fun () ->
      let closed = ref 0 in
      let close : unit Sqlite_lifecycle.close = fun[@u] _ -> incr closed in
      let open_db : unit Sqlite_lifecycle.open_db = fun[@u] _ -> () in
      let backup : unit Sqlite_lifecycle.backup =
       fun[@u] _ _ -> Js.Promise.resolve ()
      in
      let remove : Sqlite_lifecycle.remove = fun[@u] _ -> () in
      Sqlite_lifecycle.backup_file ~open_db ~backup ~remove ~close
        ~src:"source.sqlite" ~dst:"destination.sqlite"
      |> Js.Promise.then_ (fun () ->
          Fest.equal !closed 1 Fest.expect;
          Js.Promise.resolve ()))
