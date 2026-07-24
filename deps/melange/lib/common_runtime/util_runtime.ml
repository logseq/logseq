module Runtime_codec = Melange_cljs_runtime_spec.Value_codec
module Policy = Melange_common.Util

type now_callback = (unit -> float[@u])

type compare_callback =
  (Runtime_codec.cljs_value -> Runtime_codec.cljs_value -> int[@u])

type read_callback =
  (Runtime_codec.cljs_value -> string -> Runtime_codec.cljs_value[@u])

type read_error_callback = (Js.Exn.t -> unit[@u])
type sort_criterion = { get_value : Runtime_codec.callback; ascending : bool }

let distinct_lazy runtime key values =
  let state = Policy.create_distinct_state () in
  let rec step values =
    Runtime_codec.lazy_sequence runtime (fun[@u] () ->
        let values = Runtime_codec.sequence runtime values in
        if Runtime_codec.value_is_nil runtime values then
          Runtime_codec.nil_value runtime
        else
          let value = Runtime_codec.sequence_first runtime values in
          let remaining = Runtime_codec.sequence_rest runtime values in
          let derived = Runtime_codec.invoke_callback runtime key value in
          if
            Policy.accept_distinct state
              ~equal:(Runtime_codec.value_equals runtime)
              derived
          then Runtime_codec.sequence_cons runtime value (step remaining)
          else step remaining)
  in
  step values

let fast_remove_nils runtime values =
  let remove_nil_map_values value =
    value
    |> Runtime_codec.map_to_entries runtime
    |> Rrbvec.of_array
    |> Rrbvec.filter (function
      | [| _; entry |] -> not (Runtime_codec.value_is_nil runtime entry)
      | _ -> invalid_arg "Common fast-remove-nils expects map entries")
    |> Rrbvec.to_array
    |> Runtime_codec.entries_to_map runtime
  in
  let rec step values =
    Runtime_codec.lazy_sequence runtime (fun[@u] () ->
        let values = Runtime_codec.sequence runtime values in
        if Runtime_codec.value_is_nil runtime values then
          Runtime_codec.nil_value runtime
        else
          let value = Runtime_codec.sequence_first runtime values in
          let remaining = Runtime_codec.sequence_rest runtime values in
          if Runtime_codec.value_is_nil runtime value then step remaining
          else
            let value =
              if Runtime_codec.value_is_map runtime value then
                remove_nil_map_values value
              else value
            in
            Runtime_codec.sequence_cons runtime value (step remaining))
  in
  step values

let distinct_by_last_wins runtime key values =
  values
  |> Runtime_codec.collection_to_array runtime
  |> Rrbvec.of_array
  |> Policy.distinct_by_last_wins
       ~key:(Runtime_codec.invoke_callback runtime key)
       ~equal:(Runtime_codec.value_equals runtime)
  |> Rrbvec.to_array
  |> Runtime_codec.array_to_vector runtime

let block_with_timestamps runtime (now_ms : now_callback) block =
  let keyword = Runtime_codec.keyword_from_string runtime in
  let created_at =
    Runtime_codec.map_get runtime block (keyword "block/created-at")
  in
  let timestamps =
    Policy.block_timestamps ~now_ms:(now_ms () [@u])
      ~created_at:
        (if Runtime_codec.value_is_nil runtime created_at then None
         else Some (Runtime_codec.float_from_value runtime created_at))
  in
  Runtime_codec.map_assoc runtime block
    (keyword "block/created-at")
    (Runtime_codec.float_to_value runtime timestamps.created_at)
  |> fun block ->
  Runtime_codec.map_assoc runtime block
    (keyword "block/updated-at")
    (Runtime_codec.float_to_value runtime timestamps.updated_at)

let compare_by runtime (compare : compare_callback) sorting left right =
  sorting |> Rrbvec.of_array
  |> Rrbvec.map (fun criterion ->
      ({
         Policy.value =
           Runtime_codec.invoke_callback runtime criterion.get_value;
         ascending = criterion.ascending;
       }
        : ( Runtime_codec.cljs_value,
            Runtime_codec.cljs_value )
          Policy.sort_criterion))
  |> fun criteria ->
  Policy.compare_by
    ~compare:(fun left right -> (compare left right [@u]))
    criteria left right

let safe_read_string runtime (read : read_callback)
    (log_error : read_error_callback) options content should_log =
  try read options content [@u]
  with error ->
    (if should_log then
       match Js.Exn.asJsExn error with
       | Some error -> log_error error [@u]
       | None -> Runtime_codec.log_error runtime (Printexc.to_string error));
    Runtime_codec.nil_value runtime

let safe_read_map_string runtime (read : read_callback)
    (log_error : read_error_callback) options content =
  try read options content [@u]
  with error ->
    (match Js.Exn.asJsExn error with
    | Some error -> log_error error [@u]
    | None -> Runtime_codec.log_error runtime (Printexc.to_string error));
    Runtime_codec.entries_to_map runtime [||]
