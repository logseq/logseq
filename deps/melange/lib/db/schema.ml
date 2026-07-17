type uniqueness = Identity
type value_type = Ref
type cardinality = Many

type entry = {
  keyword : string;
  uniqueness : uniqueness option;
  value_type : value_type option;
  indexed : bool;
  cardinality : cardinality option;
}

let uniqueness_to_string Identity = "db.unique/identity"
let value_type_to_string Ref = "db.type/ref"
let cardinality_to_string Many = "db.cardinality/many"
let keyword entry = entry.keyword
let uniqueness entry = entry.uniqueness
let value_type entry = entry.value_type
let indexed entry = entry.indexed
let cardinality entry = entry.cardinality

let entry ?uniqueness ?value_type ?(indexed = false) ?cardinality keyword =
  { keyword; uniqueness; value_type; indexed; cardinality }

let entries =
  Rrbvec.of_array
    [|
      entry "file/created-at";
      entry "block/tx-id";
      entry "file/content";
      entry ~value_type:Ref ~indexed:true ~cardinality:Many "block/alias";
      entry "kv/value";
      entry ~value_type:Ref ~indexed:true "block/link";
      entry ~uniqueness:Identity "block/uuid";
      entry ~indexed:true "block/updated-at";
      entry "file/size";
      entry ~value_type:Ref ~cardinality:Many "block/refs";
      entry ~value_type:Ref ~cardinality:Many "block/closed-value-property";
      entry "file/last-modified-at";
      entry ~indexed:true "block/created-at";
      entry "block/collapsed?";
      entry ~indexed:true "block/journal-day";
      entry ~value_type:Ref ~cardinality:Many "block/tags";
      entry ~indexed:true "block/title";
      entry ~uniqueness:Identity "db/ident";
      entry ~value_type:Ref ~indexed:true "block/parent";
      entry ~indexed:true "block/order";
      entry ~value_type:Ref ~indexed:true "block/page";
      entry ~indexed:true "block/name";
      entry ~uniqueness:Identity "file/path";
    |]

let retract_attributes = Rrbvec.of_array [| "block/warning" |]

let attribute_names predicate =
  entries
  |> Rrbvec.filter_map (fun entry ->
      if predicate entry then Some entry.keyword else None)

let ref_type_attributes =
  attribute_names (fun entry -> entry.value_type = Some Ref)

let card_many_attributes =
  attribute_names (fun entry -> entry.cardinality = Some Many)

let card_many_ref_type_attributes =
  attribute_names (fun entry ->
      entry.value_type = Some Ref && entry.cardinality = Some Many)

let card_one_ref_type_attributes =
  attribute_names (fun entry ->
      entry.value_type = Some Ref && entry.cardinality = None)

let db_non_ref_attributes =
  attribute_names (fun entry -> entry.value_type = None)
