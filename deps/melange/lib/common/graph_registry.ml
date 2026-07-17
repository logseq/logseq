type entry = {
  graph_id : string option;
  local_graph_id : string option;
  repo : string option;
  graph_id_text : string option;
  repo_text : string option;
  graph_name_text : string option;
}

type normalization = {
  normalized_graph_id : string;
  remove_rtc_graph_id : bool;
}

type upsert_result = {
  normalization : normalization;
  retained_indices : int Rrbvec.t;
}

let make_entry ?graph_id ?local_graph_id ?repo ?graph_id_text ?repo_text
    ?graph_name_text () =
  let first_some left right =
    match left with Some _ -> left | None -> right
  in
  {
    graph_id;
    local_graph_id;
    repo;
    graph_id_text = first_some graph_id_text graph_id;
    repo_text = first_some repo_text repo;
    graph_name_text;
  }

let present_string value =
  Option.exists
    (fun value -> not (String.equal (Js.String.trim value) ""))
    value

let graph_identity entry =
  if present_string entry.graph_id then entry.graph_id
  else if present_string entry.local_graph_id then entry.local_graph_id
  else None

let normalization_error entry =
  match graph_identity entry with
  | Some _ -> None
  | None -> Some "Missing graph identity"

let normalize_entry entry =
  match graph_identity entry with
  | Some normalized_graph_id ->
      { normalized_graph_id; remove_rtc_graph_id = true }
  | None -> failwith "Missing graph identity"

let normalized_graph_id normalization = normalization.normalized_graph_id
let remove_rtc_graph_id normalization = normalization.remove_rtc_graph_id

let upsert_entry registry entry =
  let normalization = normalize_entry entry in
  let incoming_graph_id = normalization.normalized_graph_id in
  let same_present incoming existing =
    present_string incoming && Option.equal String.equal incoming existing
  in
  let retained_indices =
    registry
    |> Rrbvec.mapi (fun index existing -> (index, existing))
    |> Rrbvec.filter_map (fun (index, existing) ->
        if
          Option.equal String.equal (Some incoming_graph_id) existing.graph_id
          || same_present entry.repo existing.repo
          || same_present entry.local_graph_id existing.local_graph_id
        then None
        else Some index)
  in
  { normalization; retained_indices }

let upsert_normalization result = result.normalization
let upsert_retained_indices result = result.retained_indices
let normalize_comparable = Option.map Js.String.toLowerCase

let identifier_matches entry graph_identifier =
  let identifier = Js.String.toLowerCase graph_identifier in
  let canonical_repo_name =
    Config.canonicalize_db_version_repo graph_identifier |> normalize_comparable
  in
  let equals_identifier value =
    value |> normalize_comparable |> Option.exists (String.equal identifier)
  in
  equals_identifier entry.repo_text
  || equals_identifier entry.graph_name_text
  || equals_identifier entry.graph_id_text
  || Option.exists
       (fun canonical_repo_name ->
         entry.repo_text |> normalize_comparable
         |> Option.exists (String.equal canonical_repo_name))
       canonical_repo_name

let find_index predicate entries =
  let result = ref None in
  let index = ref 0 in
  while Option.is_none !result && !index < Rrbvec.length entries do
    if predicate (Rrbvec.nth entries !index) then result := Some !index;
    incr index
  done;
  !result

let resolve_target_index registry ~graph_id ~graph_identifier =
  if present_string graph_id then
    find_index
      (fun entry -> Option.equal String.equal graph_id entry.graph_id)
      registry
  else if present_string graph_identifier then
    find_index
      (fun entry -> identifier_matches entry (Option.get graph_identifier))
      registry
  else None
