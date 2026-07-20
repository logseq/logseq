type node = {
  id : string;
  parent : string option;
  own_refs : string Rrbvec.t;
  children : string Rrbvec.t;
  class_ok : bool;
}

type result = { top_ids : string Rrbvec.t; child_ids : string Rrbvec.t }

val select :
  node Rrbvec.t ->
  top_ids:string Rrbvec.t ->
  includes:string Rrbvec.t ->
  excludes:string Rrbvec.t ->
  result

val unlinked_with :
  entity:('id -> 'entity) ->
  title:('entity -> string option) ->
  title_datoms:(unit -> 'datom array) ->
  datom_entity:('datom -> 'id) ->
  datom_title:('datom -> string) ->
  id_equals:('id -> 'id -> bool) ->
  references:('entity -> 'id array) ->
  linked:('entity -> bool) ->
  built_in:('entity -> bool) ->
  lowercase:(string -> string) ->
  'id ->
  'entity array option
