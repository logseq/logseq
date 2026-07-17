type memo_plan = Return_none | Cached | Direct

type lookup_action =
  | Journal_title
  | Raw_title
  | Properties
  | Property_keys
  | Title
  | Filtered_parent
  | Raw_parent
  | Closed_values
  | Default_lookup

let nil_idents =
  Rrbvec.of_array
    [|
      "block/tx-id";
      "block/uuid";
      "block/journal-day";
      "block/_refs";
      "block/level";
      "block/heading-level";
      "block/warning";
      "block/name";
      "block.temp/ast-title";
      "block.temp/load-status";
      "block.temp/has-children?";
      "block.temp/ast-body";
      "db/valueType";
      "db/cardinality";
      "db/ident";
      "db/index";
      "logseq.property/_query";
    |]

let immutable_idents =
  Rrbvec.of_array
    [|
      "block/link";
      "block/updated-at";
      "block/refs";
      "block/closed-value-property";
      "block/created-at";
      "block/collapsed?";
      "block/tags";
      "block/title";
      "block/parent";
      "block/order";
      "block/page";
      "logseq.property/created-from-property";
      "logseq.property/icon";
      "logseq.property.asset/type";
      "logseq.property.asset/checksum";
      "logseq.property.node/display-type";
      "logseq.kv/db-type";
    |]

let nil_ident value = Rrbvec.mem value nil_idents
let immutable_ident value = Rrbvec.mem value immutable_idents

let memo_plan ~qualified ~node ~cache_enabled ident =
  if (not qualified) || node then Direct
  else if nil_ident ident then Return_none
  else if cache_enabled && immutable_ident ident then Cached
  else Direct

let lookup_action ~db_based ~journal = function
  | "block/raw-title" ->
      if db_based && journal then Journal_title else Raw_title
  | "block/properties" -> Properties
  | "block.temp/property-keys" -> Property_keys
  | "block/title" -> if db_based && journal then Journal_title else Title
  | "block/_parent" -> Filtered_parent
  | "block/_raw-parent" -> Raw_parent
  | "property/closed-values" -> Closed_values
  | _ -> Default_lookup

let default_attribute ~checkbox =
  if checkbox then "logseq.property/scalar-default-value"
  else "logseq.property/default-value"
