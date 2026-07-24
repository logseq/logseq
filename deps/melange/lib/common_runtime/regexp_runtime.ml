let find regexp value =
  match Js.Re.exec ~str:value regexp with
  | None -> None
  | Some result ->
      result |> Js.Re.captures
      |> Array.map Js.Nullable.toOption
      |> Rrbvec.of_array
      |> fun captures -> Some captures

type trace_callback = (unit -> unit[@u])

let safe_find_value runtime regexp value (trace : trace_callback) =
  let module Runtime_codec = Melange_cljs_runtime_spec.Value_codec in
  if not (Runtime_codec.value_is_string runtime value) then (
    trace () [@u];
    Runtime_codec.nil_value runtime)
  else
    match find regexp (Runtime_codec.string_from_value runtime value) with
    | None -> Runtime_codec.nil_value runtime
    | Some captures when Rrbvec.length captures = 1 -> (
        match Rrbvec.nth captures 0 with
        | Some capture -> Runtime_codec.string_to_value runtime capture
        | None -> Runtime_codec.nil_value runtime)
    | Some captures ->
        captures
        |> Rrbvec.map (function
          | Some capture -> Runtime_codec.string_to_value runtime capture
          | None -> Runtime_codec.nil_value runtime)
        |> Rrbvec.to_array
        |> Runtime_codec.array_to_vector runtime
