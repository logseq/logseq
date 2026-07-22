module Domain = Melange_db.Sqlite_lifecycle

let storageConnection datascript storage schema =
  Domain.storage_connection
    ~restore:(fun storage ->
      Support.Datascript.restore_conn datascript storage
      |> Js.Nullable.toOption)
    ~create:(fun schema storage ->
      Support.Datascript.create_conn_with_storage datascript schema storage)
    ~storage ~schema

let backupConnection backup remove db path =
  Domain.backup_connection ~backup ~remove db path

let backupFile open_db backup remove close src dst =
  Domain.backup_file ~open_db ~backup ~remove ~close ~src ~dst
