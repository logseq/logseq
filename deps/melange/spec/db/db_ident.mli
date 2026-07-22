val alphabet : string
val normalize_name_part : string -> string
val nano_id : int Rrbvec.t -> string
val requires_random_suffix : namespace_:string -> stable:bool -> bool
val create : namespace_:string -> name:string -> suffix:string option -> string

val create_with :
  stable_idents:(unit -> bool) ->
  random_index:(int -> int) ->
  random_bytes:(int -> int Rrbvec.t) ->
  namespace_:string ->
  name:string ->
  string

val ensure_unique :
  base:string -> base_exists:bool -> existing:string Rrbvec.t -> string

val ensure_unique_with :
  encode_form:(Datalog_form.t -> 'value) ->
  keyword_to_string:('value -> string) ->
  keyword_from_string:(string -> 'value) ->
  string_to_value:(string -> 'value) ->
  collection_to_array:('value -> 'value array) ->
  entity_exists:('value -> bool) ->
  query:('value -> 'value array -> 'value) ->
  'value ->
  'value
