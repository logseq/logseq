type ref_entry = { target : string; title : string }
type tag_entry = { title : string; id : string }

type title_ref_entry = {
  title : string;
  id : string;
  original_title : string option;
}

type uuid_title_entry = { uuid : string; title : string }

val matched_ids : string -> string Rrbvec.t
val page_ref : string -> string
val replace_id_refs : string -> ref_entry Rrbvec.t -> string
val replace_tags_with_id_refs : string -> tag_entry Rrbvec.t -> string
val replace_tag_refs_with_page_refs : string -> tag_entry Rrbvec.t -> string

val replace_title_refs :
  string -> title_ref_entry Rrbvec.t -> replace_tags:bool -> string

val contains_uuid_ref : string -> bool

val replace_uuid_refs :
  string -> uuid_title_entry Rrbvec.t -> max_depth:int -> string

val replace_id_refs_with_titles :
  string -> uuid_title_entry Rrbvec.t -> string

val page_ref_entity_with :
  tags:('reference -> 'tag Rrbvec.t) ->
  tag_ident:('tag -> 'ident) ->
  is_page_ident:('ident -> bool) ->
  'reference ->
  bool

val uuid_title_entries_with :
  refs:('reference -> 'reference Rrbvec.t) ->
  uuid:('reference -> 'id option) ->
  title:('reference -> string option) ->
  page_ref:('reference -> bool) ->
  is_ref:('reference -> bool) ->
  equal:('id -> 'id -> bool) ->
  stringify:('id -> string) ->
  max_depth:int ->
  replace_block_refs:bool ->
  'reference ->
  uuid_title_entry Rrbvec.t

val select_id_title_entries_with :
  refs:'reference Rrbvec.t ->
  page_ref:('reference -> bool) ->
  uuid:('reference -> string option) ->
  raw_title:('reference -> string option) ->
  duplicate_title:(string -> bool) ->
  replace_block_ids:bool ->
  replace_pages_with_same_name:bool ->
  uuid_title_entry Rrbvec.t
