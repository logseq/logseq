type list_options = Melange_edn_melange.any

type page_filter = {
  expand : bool;
  include_hidden : bool;
  include_built_in : bool;
  include_journal : bool;
  journal_only : bool;
  created_after : Js.Date.t option;
  updated_after : Js.Date.t option;
}

type node_filter = {
  tag_ids : Cli_primitive.db_id Rrbvec.t;
  property_idents : Cli_primitive.keyword Rrbvec.t;
}

let add_raw_field key raw fields =
  match Edn_util.get raw key with
  | None -> fields
  | Some value -> Vec.push_front fields (Edn_util.keyword key, value)

let minimal_list_item e =
  Vec.empty
  |> add_raw_field "logseq.property/type" e.Entity.raw
  |> add_raw_field "db/cardinality" e.Entity.raw
  |> add_raw_field "db/ident" e.Entity.raw
  |> add_raw_field "block/updated-at" e.Entity.raw
  |> add_raw_field "block/created-at" e.Entity.raw
  |> add_raw_field "block/title" e.Entity.raw
  |> add_raw_field "db/id" e.Entity.raw
  |> fun fields -> Edn_util.map_t_vec fields
