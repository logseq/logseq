type list_options = Melange_edn_melange.any

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
  tag_ids : Cli_primitive.db_id Rrbvec.t;
  property_idents : Cli_primitive.keyword Rrbvec.t;
}

val minimal_list_item :
  Entity.t -> Melange_edn_melange.map Melange_edn_melange.t
