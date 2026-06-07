type list_options = Melange_edn.any

type page_filter = {
  expand : bool;
  include_hidden : bool;
  include_built_in : bool;
  include_journal : bool;
  journal_only : bool;
  created_after : Time.date option;
  updated_after : Time.date option;
}

type node_filter = {
  tag_ids : Cli_primitive.db_id list;
  property_idents : Cli_primitive.keyword list;
}

val minimal_list_item : Entity.t -> Melange_edn.map Melange_edn.t
val list_pages : Melange_edn.any -> page_filter -> Entity.t list
val list_tags : Melange_edn.any -> list_options -> Entity.t list
val list_properties : Melange_edn.any -> list_options -> Entity.t list
val list_tasks : Melange_edn.any -> list_options -> Entity.t list
val list_nodes : Melange_edn.any -> node_filter -> Entity.t list
