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

let stable_distinct values =
  let seen = Hashtbl.create (Rrbvec.length values) in
  Rrbvec.fold_left
    (fun result value ->
      if Hashtbl.mem seen value then result
      else (
        Hashtbl.add seen value ();
        Rrbvec.push_back result value))
    Rrbvec.empty values

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

type prepared_block = {
  block_id : int;
  replacement : string option;
  embed_regexp : Js.Re.t;
  block_ref_regexp : Js.Re.t;
  page_ref_regexp : Js.Re.t;
}

let prepare_block block =
  let replacement =
    if block.asset then Some "" else block.title
  in
  let uuid = escape_regex block.uuid in
  {
    block_id = block.id;
    replacement;
    embed_regexp =
      Js.Re.fromStringWithFlags
        ("\\{\\{embed \\(\\(" ^ uuid ^ "\\)\\)\\s?\\}\\}")
        ~flags:"gi";
    block_ref_regexp =
      Js.Re.fromStringWithFlags ("\\(\\(" ^ uuid ^ "\\)\\)") ~flags:"g";
    page_ref_regexp =
      Js.Re.fromStringWithFlags ("\\[\\[" ^ uuid ^ "\\]\\]") ~flags:"g";
  }

let replace_block value block =
  let replacement =
    match block.replacement with
    | Some value -> value
    | None -> invalid_arg "DB delete planning: referenced block has no title"
  in
  value
  |> Js.String.replaceByRe ~regexp:block.embed_regexp
       ~replacement
  |> fun value ->
  Js.String.replaceByRe ~regexp:block.block_ref_regexp
    ~replacement value
  |> fun value ->
  Js.String.replaceByRe ~regexp:block.page_ref_regexp
    ~replacement value

let stable_distinct_operations operations = stable_distinct operations

type ref_group = {
  referrer : referrer;
  mutable blocks : prepared_block Rrbvec.t;
  block_ids : (int, unit) Hashtbl.t;
}

let collect_entity_ids select entities =
  Rrbvec.fold_left
    (fun result entity -> Rrbvec.append result (select entity))
    Rrbvec.empty entities
  |> stable_distinct

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
  let reactions = collect_entity_ids (fun entity -> entity.reactions) entities in
  let views = collect_entity_ids (fun entity -> entity.views) entities in
  let histories = collect_entity_ids (fun entity -> entity.histories) entities in
  let skipped_referrers =
    Hashtbl.create
      (Rrbvec.length self_history_ids + Rrbvec.length reactions
     + Rrbvec.length views + Rrbvec.length histories
      + Rrbvec.length retracted_block_ids)
  in
  let skip ids =
    Rrbvec.iter (fun id -> Hashtbl.replace skipped_referrers id ()) ids
  in
  skip self_history_ids;
  skip reactions;
  skip views;
  skip histories;
  skip retracted_block_ids;
  let groups_by_referrer = Hashtbl.create (Rrbvec.length blocks) in
  let ref_groups =
    Rrbvec.fold_left
      (fun groups (block : block) ->
        let prepared_block = prepare_block block in
        Rrbvec.fold_left
          (fun groups (referrer : referrer) ->
            match Hashtbl.find_opt groups_by_referrer referrer.id with
            | Some group ->
                if not (Hashtbl.mem group.block_ids block.id) then (
                  Hashtbl.add group.block_ids block.id ();
                  group.blocks <- Rrbvec.push_back group.blocks prepared_block);
                groups
            | None ->
                let block_ids = Hashtbl.create 1 in
                Hashtbl.add block_ids block.id ();
                let group =
                  {
                    referrer;
                    blocks = Rrbvec.singleton prepared_block;
                    block_ids;
                  }
                in
                Hashtbl.add groups_by_referrer referrer.id group;
                Rrbvec.push_back groups group)
          groups block.referrers)
      Rrbvec.empty blocks
  in
  let ref_operations =
    Rrbvec.fold_left
      (fun operations group ->
        let operations =
          Rrbvec.fold_left
            (fun operations block ->
              Rrbvec.push_back operations
                (Retract_ref
                   {
                     entity_id = group.referrer.id;
                     block_id = block.block_id;
                   }))
            operations group.blocks
        in
        match group.referrer.raw_title with
        | Some raw_title
          when not (Hashtbl.mem skipped_referrers group.referrer.id) ->
            let title = Rrbvec.fold_left replace_block raw_title group.blocks in
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

let references_id (candidate : history_candidate) retracted_ids =
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
