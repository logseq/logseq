type uuid_label = {
  uuid : Cli_primitive.uuid;
  id : Cli_primitive.db_id option;
  label : string option;
}

val unique_preserve_order : 'a list -> 'a list
val extract_wiki_refs : string -> string list
val extract_uuid_refs : string -> Cli_primitive.uuid list
val replace_uuid_refs : string -> (Cli_primitive.uuid * string) list -> string
val collect_uuid_refs_from_strings : string list -> Cli_primitive.uuid list

val collect_uuid_refs_from_items :
  Entity.t list -> Cli_primitive.keyword list -> Cli_primitive.uuid list

val normalize_item_string_fields :
  Entity.t list ->
  Cli_primitive.keyword list ->
  (Cli_primitive.uuid * string) list ->
  Entity.t list

val fetch_uuid_entities :
  Cli_config.t ->
  Cli_primitive.repo ->
  Cli_primitive.uuid list ->
  uuid_label list Cli_effect.t

val fetch_uuid_labels :
  Cli_config.t ->
  Cli_primitive.repo ->
  Cli_primitive.uuid list ->
  (Cli_primitive.uuid * string) list Cli_effect.t
