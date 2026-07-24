module Domain = struct
  type 'db backup = ('db -> string -> unit Js.Promise.t[@u])
  type 'db open_db = (string -> 'db[@u])
  type remove = (string -> unit[@u])
  type 'db close = ('db -> unit[@u])

  external reject_error : Js.Promise.error -> 'a Js.Promise.t = "reject"
  [@@mel.scope "Promise"]

  external finally_ :
    (unit -> unit) -> ('a Js.Promise.t[@mel.this]) -> 'a Js.Promise.t
    = "finally"
  [@@mel.send]

  let storage_connection ~restore ~create ~storage ~schema =
    match restore storage with
    | Some connection -> connection
    | None -> create schema storage

  let backup_connection ~backup ~remove db path =
    try
      (backup db path [@u])
      |> Js.Promise.catch (fun error ->
          remove path [@u];
          reject_error error)
    with error ->
      remove path [@u];
      Js.Promise.reject error

  let backup_file ~open_db ~backup ~remove ~close ~src ~dst =
    let db = (open_db src [@u]) in
    backup_connection ~backup ~remove db dst
    |> finally_ (fun () -> (close db [@u]))
end

let storageConnection datascript storage schema =
  Domain.storage_connection
    ~restore:(fun storage ->
      Melange_datascript_spec.Api.restore_conn datascript storage
      |> Js.Nullable.toOption)
    ~create:(fun schema storage ->
      Melange_datascript_spec.Api.create_conn_with_storage datascript schema
        storage)
    ~storage ~schema

let backupConnection backup remove db path =
  Domain.backup_connection ~backup ~remove db path

let backupFile open_db backup remove close src dst =
  Domain.backup_file ~open_db ~backup ~remove ~close ~src ~dst
