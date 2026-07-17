let page_title ~title ~name = match title with Some _ -> title | None -> name

let remove_nil_entries entries =
  entries
  |> Rrbvec.fold_left
       (fun result (key, value) ->
         match value with
         | None -> result
         | Some value -> Rrbvec.push_back result (key, value))
       Rrbvec.empty

let concat_present_values collections =
  collections
  |> Rrbvec.fold_left
       (fun result values ->
         values
         |> Rrbvec.fold_left
              (fun result value ->
                match value with
                | None -> result
                | Some value -> Rrbvec.push_back result value)
              result)
       Rrbvec.empty

type block_timestamps = { created_at : float; updated_at : float }

let block_timestamps ~now_ms ~created_at =
  { created_at = Option.value ~default:now_ms created_at; updated_at = now_ms }

let ensure_block_timestamps ~now_ms ~created_at ~updated_at =
  {
    created_at = Option.value ~default:now_ms created_at;
    updated_at = Option.value ~default:now_ms updated_at;
  }

let distinct_by ~key ~equal values =
  values
  |> Rrbvec.fold_left
       (fun (keys, result) value ->
         let value_key = key value in
         if Rrbvec.exists (equal value_key) keys then (keys, result)
         else (Rrbvec.push_back keys value_key, Rrbvec.push_back result value))
       (Rrbvec.empty, Rrbvec.empty)
  |> snd

type 'key distinct_state = { mutable seen : 'key Rrbvec.t }

let create_distinct_state () = { seen = Rrbvec.empty }

let accept_distinct state ~equal key =
  if Rrbvec.exists (equal key) state.seen then false
  else (
    state.seen <- Rrbvec.push_back state.seen key;
    true)

let distinct_by_last_wins ~key ~equal values =
  values |> Rrbvec.rev |> distinct_by ~key ~equal |> Rrbvec.rev

type ('item, 'value) sort_criterion = {
  value : 'item -> 'value;
  ascending : bool;
}

let compare_by ~compare criteria left right =
  let rec loop criteria =
    match Rrbvec.pop_front criteria with
    | None -> 0
    | Some (criterion, remaining) ->
        let order = compare (criterion.value left) (criterion.value right) in
        if order = 0 then loop remaining
        else if criterion.ascending then order
        else -order
  in
  loop criteria
