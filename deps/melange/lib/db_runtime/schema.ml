module Domain = Melange_db.Schema

let optional_name to_string value =
  value |> Option.map to_string |> Js.Nullable.fromOption

let names values = Rrbvec.to_array values

let entries =
  Domain.entries
  |> Rrbvec.map (fun entry ->
      ( Domain.keyword entry,
        optional_name Domain.uniqueness_to_string (Domain.uniqueness entry),
        optional_name Domain.value_type_to_string (Domain.value_type entry),
        Domain.indexed entry,
        optional_name Domain.cardinality_to_string (Domain.cardinality entry) ))
  |> Rrbvec.to_array

let retractAttributes = names Domain.retract_attributes
let refTypeAttributes = names Domain.ref_type_attributes
let cardManyAttributes = names Domain.card_many_attributes
let cardManyRefTypeAttributes = names Domain.card_many_ref_type_attributes
let cardOneRefTypeAttributes = names Domain.card_one_ref_type_attributes
let dbNonRefAttributes = names Domain.db_non_ref_attributes
