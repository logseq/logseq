val page_title : title:string option -> name:string option -> string option

val remove_nil_entries :
  ('key * 'value option) Rrbvec.t -> ('key * 'value) Rrbvec.t

val concat_present_values : 'value option Rrbvec.t Rrbvec.t -> 'value Rrbvec.t

type block_timestamps = { created_at : float; updated_at : float }

val block_timestamps :
  now_ms:float -> created_at:float option -> block_timestamps

val ensure_block_timestamps :
  now_ms:float ->
  created_at:float option ->
  updated_at:float option ->
  block_timestamps

val distinct_by :
  key:('item -> 'key) ->
  equal:('key -> 'key -> bool) ->
  'item Rrbvec.t ->
  'item Rrbvec.t

type 'key distinct_state

val create_distinct_state : unit -> 'key distinct_state

val accept_distinct :
  'key distinct_state -> equal:('key -> 'key -> bool) -> 'key -> bool

val distinct_by_last_wins :
  key:('item -> 'key) ->
  equal:('key -> 'key -> bool) ->
  'item Rrbvec.t ->
  'item Rrbvec.t

type ('item, 'value) sort_criterion = {
  value : 'item -> 'value;
  ascending : bool;
}

val compare_by :
  compare:('value -> 'value -> int) ->
  ('item, 'value) sort_criterion Rrbvec.t ->
  'item ->
  'item ->
  int
