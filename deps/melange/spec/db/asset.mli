val digest_hex : int Rrbvec.t -> string

val checksum :
  buffer_of_value:('value -> 'buffer) ->
  sha256:('buffer -> 'digest Js.Promise.t) ->
  digest_bytes:('digest -> int Rrbvec.t) ->
  'value ->
  string Js.Promise.t

val path_type : string -> string
val name_title : string -> string
