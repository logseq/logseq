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
