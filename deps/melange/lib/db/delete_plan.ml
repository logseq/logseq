type node = { id : int; block : bool; children : int Rrbvec.t }
type referrer = { id : int; raw_title : string option }

type block = {
  id : int;
  uuid : string;
  title : string option;
  asset : bool;
  referrers : referrer Rrbvec.t;
}

type entity = {
  id : int;
  block : block option;
  history : bool;
  reactions : int Rrbvec.t;
  views : int Rrbvec.t;
  histories : int Rrbvec.t;
}

type retract_target = By_id of int | By_uuid of string

type history_candidate = {
  target : retract_target;
  block_id : int option;
  property_id : int option;
  ref_value_id : int option;
  own_ref_retracted : bool;
}

type operation =
  | Retract_entity of int
  | Retract_ref of { entity_id : int; block_id : int }
  | Add_title of { entity_id : int; title : string }
  | Retract_uuid of string

let push_distinct value values =
  if Rrbvec.mem value values then values else Rrbvec.push_back values value

let expand_retract_ids ~root_ids nodes =
  let by_id = Hashtbl.create (Rrbvec.length nodes) in
  Rrbvec.iter (fun (node : node) -> Hashtbl.replace by_id node.id node) nodes;
  let pending = Queue.create () in
  Rrbvec.iter (fun id -> Queue.add id pending) root_ids;
  let seen = Hashtbl.create (Rrbvec.length nodes) in
  let result = ref Rrbvec.empty in
  while not (Queue.is_empty pending) do
    let id = Queue.take pending in
    if not (Hashtbl.mem seen id) then (
      Hashtbl.add seen id ();
      match Hashtbl.find_opt by_id id with
      | Some node when node.block ->
          result := Rrbvec.push_back !result id;
          Rrbvec.iter (fun child_id -> Queue.add child_id pending) node.children
      | Some _ | None -> ())
  done;
  !result

let regex_special_characters =
  Js.Re.fromStringWithFlags "[\\[\\]{}().+*?|$^]" ~flags:"g"

let escape_regex value =
  Js.String.replaceByRe ~regexp:regex_special_characters ~replacement:"\\$&"
    value

let replace_pattern value pattern replacement =
  let regexp = Js.Re.fromStringWithFlags (escape_regex pattern) ~flags:"g" in
  Js.String.replaceByRe ~regexp ~replacement value

let replace_block value block =
  let replacement =
    if block.asset then ""
    else
      match block.title with
      | Some title -> title
      | None -> invalid_arg "DB delete planning: referenced block has no title"
  in
  let embed =
    Js.Re.fromStringWithFlags
      ("\\{\\{embed \\(\\(" ^ escape_regex block.uuid ^ "\\)\\)\\s?\\}\\}")
      ~flags:"gi"
  in
  value |> Js.String.replaceByRe ~regexp:embed ~replacement |> fun value ->
  replace_pattern value ("((" ^ block.uuid ^ "))") replacement |> fun value ->
  replace_pattern value ("[[" ^ block.uuid ^ "]]") replacement

let stable_distinct_operations operations =
  Rrbvec.fold_left
    (fun result operation -> push_distinct operation result)
    Rrbvec.empty operations

type ref_group = { referrer : referrer; block_ids : int Rrbvec.t }

let direct_cleanup entities =
  let blocks = Rrbvec.filter_map (fun entity -> entity.block) entities in
  let retracted_block_ids =
    Rrbvec.map (fun (block : block) -> block.id) blocks
  in
  let self_history_ids =
    Rrbvec.filter_map
      (fun entity -> if entity.history then Some entity.id else None)
      entities
  in
  let reactions =
    Rrbvec.fold_left
      (fun result entity ->
        Rrbvec.fold_left
          (fun result id -> push_distinct id result)
          result entity.reactions)
      Rrbvec.empty entities
  in
  let views =
    Rrbvec.fold_left
      (fun result entity ->
        Rrbvec.fold_left
          (fun result id -> push_distinct id result)
          result entity.views)
      Rrbvec.empty entities
  in
  let histories =
    Rrbvec.fold_left
      (fun result entity ->
        Rrbvec.fold_left
          (fun result id -> push_distinct id result)
          result entity.histories)
      Rrbvec.empty entities
  in
  let cleanup_ids =
    Rrbvec.empty |> fun result ->
    Rrbvec.fold_left
      (fun result id -> push_distinct id result)
      result self_history_ids
    |> fun result ->
    Rrbvec.fold_left (fun result id -> push_distinct id result) result reactions
    |> fun result ->
    Rrbvec.fold_left (fun result id -> push_distinct id result) result views
    |> fun result ->
    Rrbvec.fold_left (fun result id -> push_distinct id result) result histories
  in
  let skipped_referrers =
    Rrbvec.fold_left
      (fun result id -> push_distinct id result)
      cleanup_ids retracted_block_ids
  in
  let ref_groups =
    Rrbvec.fold_left
      (fun groups (block : block) ->
        Rrbvec.fold_left
          (fun groups (referrer : referrer) ->
            match
              Rrbvec.find_opt
                (fun group -> group.referrer.id = referrer.id)
                groups
            with
            | Some _ ->
                Rrbvec.map
                  (fun group ->
                    if group.referrer.id = referrer.id then
                      {
                        group with
                        block_ids = push_distinct block.id group.block_ids;
                      }
                    else group)
                  groups
            | None ->
                Rrbvec.push_back groups
                  { referrer; block_ids = Rrbvec.singleton block.id })
          groups block.referrers)
      Rrbvec.empty blocks
  in
  let ref_operations =
    Rrbvec.fold_left
      (fun operations group ->
        let operations =
          Rrbvec.fold_left
            (fun operations block_id ->
              Rrbvec.push_back operations
                (Retract_ref { entity_id = group.referrer.id; block_id }))
            operations retracted_block_ids
        in
        match group.referrer.raw_title with
        | Some raw_title
          when not (Rrbvec.mem group.referrer.id skipped_referrers) ->
            let title = Rrbvec.fold_left replace_block raw_title blocks in
            Rrbvec.push_back operations
              (Add_title { entity_id = group.referrer.id; title })
        | Some _ | None -> operations)
      Rrbvec.empty ref_groups
  in
  let retract operations ids =
    Rrbvec.fold_left
      (fun operations id -> Rrbvec.push_back operations (Retract_entity id))
      operations ids
  in
  ref_operations |> fun operations ->
  retract operations views |> fun operations ->
  retract operations self_history_ids |> fun operations ->
  retract operations histories |> fun operations ->
  retract operations reactions |> stable_distinct_operations

let references_id candidate retracted_ids =
  let matches = function
    | Some id -> Rrbvec.mem id retracted_ids
    | None -> false
  in
  matches candidate.block_id
  || matches candidate.property_id
  || matches candidate.ref_value_id

let new_history_retracts ~retracted_ids candidates =
  candidates
  |> Rrbvec.filter_map (fun candidate ->
      if candidate.own_ref_retracted || references_id candidate retracted_ids
      then
        match candidate.target with
        | By_id id -> Some (Retract_entity id)
        | By_uuid uuid -> Some (Retract_uuid uuid)
      else None)
  |> stable_distinct_operations
