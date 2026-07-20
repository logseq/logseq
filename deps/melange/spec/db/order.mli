val base_62_digits : string
val validate_order_key : string -> bool
val generate_key_between : string option -> string option -> string

val generate_n_keys_between :
  int -> string option -> string option -> string Rrbvec.t

val advance_max_key : string option -> string option -> string option

val max_order_with :
  nil_value:'value ->
  keyword_from_string:(string -> 'value) ->
  rseek_datoms:('value -> 'value array -> 'datom array) ->
  datom_value:('datom -> 'value) ->
  'value

type state

val create_state : unit -> state
val state_maximum : state -> string option
val reset_state : state -> string option -> unit
val advance_state : state -> string option -> unit

val generate_tracked_key_between :
  state -> string option -> string option -> string

val generate_tracked_n_keys_between :
  state -> int -> string option -> string option -> string Rrbvec.t

val default_state : state

val previous_order :
  value_order:string -> candidates:string Rrbvec.t -> string option

val next_order :
  value_order:string -> candidates:string Rrbvec.t -> string option
