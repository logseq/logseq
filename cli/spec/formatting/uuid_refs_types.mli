type uuid_label = {
  uuid : Cli_primitive.uuid;
  id : Cli_primitive.db_id option;
  label : string option;
}

val unique_preserve_order : 'a Rrbvec.t -> 'a Rrbvec.t
val extract_wiki_refs : string -> string Rrbvec.t
val extract_uuid_refs : string -> Cli_primitive.uuid Rrbvec.t

val replace_uuid_refs :
  string -> (Cli_primitive.uuid * string) Rrbvec.t -> string

val collect_uuid_refs_from_strings :
  string Rrbvec.t -> Cli_primitive.uuid Rrbvec.t

val collect_uuid_refs_from_items :
  Entity.t Rrbvec.t ->
  Cli_primitive.keyword Rrbvec.t ->
  Cli_primitive.uuid Rrbvec.t

val normalize_item_string_fields :
  Entity.t Rrbvec.t ->
  Cli_primitive.keyword Rrbvec.t ->
  (Cli_primitive.uuid * string) Rrbvec.t ->
  Entity.t Rrbvec.t

val fetch_uuid_entities :
  Cli_config.t ->
  Cli_primitive.repo ->
  Cli_primitive.uuid Rrbvec.t ->
  uuid_label Rrbvec.t Cli_effect.t

val fetch_uuid_labels :
  Cli_config.t ->
  Cli_primitive.repo ->
  Cli_primitive.uuid Rrbvec.t ->
  (Cli_primitive.uuid * string) Rrbvec.t Cli_effect.t
