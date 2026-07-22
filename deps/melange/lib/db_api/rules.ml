module Domain = Melange_db.Rules

type encoded_form = {
  kind : string;
  text : string;
  children : encoded_form array;
}

let leaf kind text = { kind; text; children = [||] }

let rec encode_form = function
  | Domain.Symbol value -> leaf "symbol" value
  | Keyword value -> leaf "keyword" value
  | String_literal value -> leaf "string" value
  | Bool true -> leaf "true" ""
  | Bool false -> leaf "false" ""
  | List_form values ->
      {
        kind = "list";
        text = "";
        children = values |> Rrbvec.map encode_form |> Rrbvec.to_array;
      }
  | Vector_form values ->
      {
        kind = "vector";
        text = "";
        children = values |> Rrbvec.map encode_form |> Rrbvec.to_array;
      }

let encode_entries entries =
  entries
  |> Rrbvec.map (fun entry ->
      (Domain.entry_name entry, Domain.entry_body entry |> encode_form))
  |> Rrbvec.to_array

let encode_dependencies dependencies =
  dependencies
  |> Rrbvec.map (fun dependency ->
      ( Domain.dependency_name dependency,
        Domain.dependency_names dependency |> Rrbvec.to_array ))
  |> Rrbvec.to_array

let entries = encode_entries Domain.rules
let ruleNames = Domain.rules |> Rrbvec.map Domain.entry_name |> Rrbvec.to_array
let dbQueryDslEntries = encode_entries Domain.db_query_dsl_rules
let dependencyEntries = encode_dependencies Domain.rules_dependencies

let fullDependencies names dependencies =
  let dependencies =
    dependencies
    |> Array.map (fun (name, names) ->
        Domain.dependency name (Rrbvec.of_array names))
    |> Rrbvec.of_array
  in
  Domain.full_dependencies (Rrbvec.of_array names) dependencies
  |> Rrbvec.to_array

let extractWith runtime rules_map rule_names dependencies =
  let selected_names =
    if Support.Runtime_codec.value_is_map runtime dependencies then
      let dependency_entries =
        Support.Runtime_codec.map_to_entries runtime dependencies
        |> Array.map (function
          | [| name; names |] ->
              Domain.dependency
                (Support.Runtime_codec.keyword_to_string runtime name)
                (names
                |> Support.Runtime_codec.collection_to_array runtime
                |> Array.map
                     (Support.Runtime_codec.keyword_to_string runtime)
                |> Rrbvec.of_array)
          | _ -> invalid_arg "DB rule dependency entry requires a pair")
        |> Rrbvec.of_array
      in
      rule_names
      |> Support.Runtime_codec.collection_to_array runtime
      |> Array.map (Support.Runtime_codec.keyword_to_string runtime)
      |> Rrbvec.of_array
      |> fun names ->
      Domain.full_dependencies names dependency_entries
      |> Rrbvec.map (Support.Runtime_codec.keyword_from_string runtime)
      |> Rrbvec.to_array
      |> Support.Runtime_codec.array_to_set runtime
      |> Support.Runtime_codec.collection_to_array runtime
      |> Rrbvec.of_array
    else
      rule_names
      |> Support.Runtime_codec.collection_to_array runtime
      |> Rrbvec.of_array
  in
  selected_names
  |> Rrbvec.fold_left
       (fun result rule_name ->
         let rule_value =
           Support.Runtime_codec.map_get runtime rules_map rule_name
         in
         let values =
           Support.Runtime_codec.collection_to_array runtime rule_value
         in
         if
           Array.length values > 0
           && Support.Runtime_codec.value_is_vector runtime values.(0)
         then Rrbvec.append result (Rrbvec.of_array values)
         else Rrbvec.push_back result rule_value)
       Rrbvec.empty
  |> Rrbvec.to_array
  |> Support.Runtime_codec.array_to_vector runtime
