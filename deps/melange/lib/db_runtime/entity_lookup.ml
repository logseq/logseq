module Domain = Melange_db.Entity_lookup

let nilIdents = Rrbvec.to_array Domain.nil_idents
let immutableIdents = Rrbvec.to_array Domain.immutable_idents

let memoPlan ident qualified node cache_enabled =
  match Domain.memo_plan ~qualified ~node ~cache_enabled ident with
  | Domain.Return_none -> "return-none"
  | Cached -> "cached"
  | Direct -> "direct"

let lookupAction attribute db_based journal =
  match Domain.lookup_action ~db_based ~journal attribute with
  | Domain.Journal_title -> "journal-title"
  | Raw_title -> "raw-title"
  | Properties -> "properties"
  | Property_keys -> "property-keys"
  | Title -> "title"
  | Filtered_parent -> "filtered-parent"
  | Raw_parent -> "raw-parent"
  | Closed_values -> "closed-values"
  | Default_lookup -> "default"

let defaultAttribute checkbox = Domain.default_attribute ~checkbox
