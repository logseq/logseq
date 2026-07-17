type 'db backup = ('db -> string -> unit Js.Promise.t[@u])
type 'db open_db = (string -> 'db[@u])
type remove = (string -> unit[@u])
type 'db close = ('db -> unit[@u])

val storage_connection :
  restore:('storage -> 'connection option) ->
  create:('schema -> 'storage -> 'connection) ->
  storage:'storage ->
  schema:'schema ->
  'connection

val backup_connection :
  backup:'db backup -> remove:remove -> 'db -> string -> unit Js.Promise.t

val backup_file :
  open_db:'db open_db ->
  backup:'db backup ->
  remove:remove ->
  close:'db close ->
  src:string ->
  dst:string ->
  unit Js.Promise.t
