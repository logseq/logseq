module Runtime_codec = Melange_cljs_runtime_spec.Value_codec

let rec encode runtime = function
  | Melange_db.Datalog_form.Symbol value ->
      Runtime_codec.symbol_from_string runtime value
  | Keyword value -> Runtime_codec.keyword_from_string runtime value
  | String_literal value -> Runtime_codec.string_to_value runtime value
  | Bool value -> Runtime_codec.bool_to_value runtime value
  | List_form values ->
      values
      |> Rrbvec.map (encode runtime)
      |> Rrbvec.to_array
      |> Runtime_codec.array_to_list runtime
  | Vector_form values ->
      values
      |> Rrbvec.map (encode runtime)
      |> Rrbvec.to_array
      |> Runtime_codec.array_to_vector runtime
