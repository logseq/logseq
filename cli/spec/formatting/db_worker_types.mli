type list_options = Edn_ocaml.any

type page_filter = {
  expand : bool;
  include_hidden : bool;
  include_built_in : bool;
  include_journal : bool;
  journal_only : bool;
  created_after : Cli_primitive.timestamp_ms option;
  updated_after : Cli_primitive.timestamp_ms option;
}

type node_filter = {
  tag_ids : Cli_primitive.db_id list;
  property_idents : Cli_primitive.keyword list;
}

val minimal_list_item : Entity.t -> Edn_ocaml.map Edn_ocaml.t
val list_pages : Edn_ocaml.any -> page_filter -> Entity.t list
val list_tags : Edn_ocaml.any -> list_options -> Entity.t list
val list_properties : Edn_ocaml.any -> list_options -> Entity.t list
val list_tasks : Edn_ocaml.any -> list_options -> Entity.t list
val list_nodes : Edn_ocaml.any -> node_filter -> Entity.t list
