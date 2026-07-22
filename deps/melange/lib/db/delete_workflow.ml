type 'value snapshot = {
  value : 'value;
  id : int option;
  uuid : string option;
  page_ref : bool;
  page : bool;
  asset : bool;
  title : string option;
  raw_title : string option;
  children : 'value Rrbvec.t;
  referrers : 'value Rrbvec.t;
  history_block : 'value option;
  history_property : 'value option;
  history_ref_value : 'value option;
  history_scalar : bool;
  reactions : 'value Rrbvec.t;
  views : 'value Rrbvec.t;
  histories : 'value Rrbvec.t;
}

type 'value transaction_kind =
  | Retract_entity_tx of { operation : string; target : 'value }
  | Retract_tx of { entity : 'value; attribute : string }
  | Add_tx of { entity : 'value; attribute : string; value : 'value }
  | Map_tx of 'value
  | Other_tx

type 'value transaction = { source : 'value; kind : 'value transaction_kind }
type 'value output = Existing of 'value | Planned of Delete_plan.operation

type ('database, 'value) capabilities = {
  entity : 'database -> 'value -> 'value option;
  snapshot : 'value -> 'value snapshot;
  integer : 'value -> int option;
  int_value : int -> 'value;
  uuid_text : 'value -> string option;
  equal : 'value -> 'value -> bool;
}

let history_attributes =
  Rrbvec.of_array
    [|
      "logseq.property.history/block";
      "logseq.property.history/property";
      "logseq.property.history/ref-value";
    |]

let snapshot_id capabilities value = (capabilities.snapshot value).id

let push_distinct_id capabilities value values =
  match snapshot_id capabilities value with
  | None -> values
  | Some id ->
      if
        Rrbvec.exists
          (fun candidate -> snapshot_id capabilities candidate = Some id)
          values
      then values
      else Rrbvec.push_back values value

let block_snapshot snapshot =
  snapshot.uuid <> None && snapshot.page_ref && not snapshot.page

let history_snapshot snapshot =
  snapshot.history_block <> None
  || snapshot.history_property <> None
  || snapshot.history_ref_value <> None
  || snapshot.history_scalar

let retracted_entities capabilities database transactions =
  Rrbvec.fold_left
    (fun result transaction ->
      match transaction.kind with
      | Retract_entity_tx { target; _ } -> (
          match capabilities.entity database target with
          | Some entity -> push_distinct_id capabilities entity result
          | None -> result)
      | Retract_tx _ | Add_tx _ | Map_tx _ | Other_tx -> result)
    Rrbvec.empty transactions

let history_ref_retracted_entities capabilities database transactions =
  Rrbvec.fold_left
    (fun result transaction ->
      match transaction.kind with
      | Retract_tx { entity; attribute }
        when Rrbvec.mem attribute history_attributes -> (
          match capabilities.entity database entity with
          | Some entity when history_snapshot (capabilities.snapshot entity) ->
              push_distinct_id capabilities entity result
          | Some _ | None -> result)
      | Retract_entity_tx _ | Retract_tx _ | Add_tx _ | Map_tx _ | Other_tx ->
          result)
    Rrbvec.empty transactions

let subtree_nodes capabilities roots =
  let pending = Queue.create () in
  Rrbvec.iter (fun value -> Queue.add value pending) roots;
  let seen = Hashtbl.create 32 in
  let nodes = ref Rrbvec.empty in
  while not (Queue.is_empty pending) do
    let value = Queue.take pending in
    let snapshot = capabilities.snapshot value in
    match snapshot.id with
    | None -> ()
    | Some id when Hashtbl.mem seen id -> ()
    | Some id ->
        Hashtbl.add seen id ();
        Rrbvec.iter (fun child -> Queue.add child pending) snapshot.children;
        nodes :=
          Rrbvec.push_back !nodes
            ({
               Delete_plan.id;
               block = block_snapshot snapshot;
               children =
                 Rrbvec.filter_map (snapshot_id capabilities) snapshot.children;
             }
              : Delete_plan.node)
  done;
  !nodes

let expand capabilities database ~delete_blocks transactions =
  let existing =
    Rrbvec.map (fun transaction -> Existing transaction.source) transactions
  in
  if not delete_blocks then existing
  else
    let roots = retracted_entities capabilities database transactions in
    let root_ids = Rrbvec.filter_map (snapshot_id capabilities) roots in
    let ids =
      subtree_nodes capabilities roots
      |> Delete_plan.expand_retract_ids ~root_ids
    in
    Rrbvec.fold_left
      (fun result id ->
        let duplicate =
          Rrbvec.exists
            (fun transaction ->
              match transaction.kind with
              | Retract_entity_tx { operation = "db/retractEntity"; target } ->
                  capabilities.integer target = Some id
              | Retract_entity_tx _ | Retract_tx _ | Add_tx _ | Map_tx _
              | Other_tx ->
                  false)
            transactions
        in
        if duplicate then result
        else Rrbvec.push_back result (Planned (Delete_plan.Retract_entity id)))
      existing ids

let resolve_id capabilities database value =
  match capabilities.integer value with
  | Some id -> Some id
  | None -> (
      match capabilities.entity database value with
      | Some entity -> snapshot_id capabilities entity
      | None -> None)

let ids_of_values capabilities values =
  Rrbvec.filter_map (snapshot_id capabilities) values

let plan_entity capabilities value =
  let snapshot = capabilities.snapshot value in
  let block =
    if not (block_snapshot snapshot) then None
    else
      match (snapshot.id, snapshot.uuid) with
      | Some id, Some uuid ->
          Some
            ({
               Delete_plan.id;
               uuid;
               title = snapshot.title;
               asset = snapshot.asset;
               referrers =
                 Rrbvec.filter_map
                   (fun value ->
                     let referrer = capabilities.snapshot value in
                     Option.map
                       (fun id ->
                         ({ Delete_plan.id; raw_title = referrer.raw_title }
                           : Delete_plan.referrer))
                       referrer.id)
                   snapshot.referrers;
             }
              : Delete_plan.block)
      | Some _, None | None, Some _ | None, None -> None
  in
  Option.map
    (fun id ->
      ({
         Delete_plan.id;
         block;
         history = history_snapshot snapshot;
         reactions = ids_of_values capabilities snapshot.reactions;
         views = ids_of_values capabilities snapshot.views;
         histories = ids_of_values capabilities snapshot.histories;
       }
        : Delete_plan.entity))
    snapshot.id

let history_candidate capabilities database target snapshot own_ref_retracted =
  {
    Delete_plan.target;
    block_id =
      Option.bind snapshot.history_block (resolve_id capabilities database);
    property_id =
      Option.bind snapshot.history_property (resolve_id capabilities database);
    ref_value_id =
      Option.bind snapshot.history_ref_value (resolve_id capabilities database);
    own_ref_retracted;
  }

let find_attribute attributes name = Hashtbl.find_opt attributes name

let new_history_candidates capabilities database transactions =
  let retracted_history_ids = Hashtbl.create 16 in
  let additions = Hashtbl.create 16 in
  Rrbvec.iter
    (fun transaction ->
      match transaction.kind with
      | Retract_tx { entity; attribute }
        when Rrbvec.mem attribute history_attributes ->
          Option.iter
            (fun id -> Hashtbl.replace retracted_history_ids id ())
            (capabilities.integer entity)
      | Add_tx { entity; attribute; value } ->
          Option.iter
            (fun id ->
              let attributes =
                match Hashtbl.find_opt additions id with
                | Some attributes -> attributes
                | None ->
                    let attributes = Hashtbl.create 8 in
                    Hashtbl.add additions id attributes;
                    attributes
              in
              Hashtbl.replace attributes attribute value)
            (capabilities.integer entity)
      | Retract_entity_tx _ | Retract_tx _ | Map_tx _ | Other_tx -> ())
    transactions;
  let candidates = ref Rrbvec.empty in
  Rrbvec.iter
    (fun transaction ->
      match transaction.kind with
      | Map_tx value ->
          let snapshot = capabilities.snapshot value in
          Option.iter
            (fun uuid ->
              if history_snapshot snapshot then
                candidates :=
                  Rrbvec.push_back !candidates
                    (history_candidate capabilities database
                       (Delete_plan.By_uuid uuid) snapshot false))
            snapshot.uuid
      | Retract_entity_tx _ | Retract_tx _ | Add_tx _ | Other_tx -> ())
    transactions;
  Hashtbl.iter
    (fun id attributes ->
      match find_attribute attributes "block/uuid" with
      | None -> ()
      | Some uuid_value ->
          let history_block =
            find_attribute attributes "logseq.property.history/block"
          in
          let history_property =
            find_attribute attributes "logseq.property.history/property"
          in
          let history_ref_value =
            find_attribute attributes "logseq.property.history/ref-value"
          in
          let history_scalar =
            Hashtbl.mem attributes "logseq.property.history/scalar-value"
          in
          if
            history_block <> None || history_property <> None
            || history_ref_value <> None || history_scalar
          then
            Option.iter
              (fun uuid ->
                let snapshot =
                  {
                    value = capabilities.int_value id;
                    id = Some id;
                    uuid = Some uuid;
                    page_ref = false;
                    page = false;
                    asset = false;
                    title = None;
                    raw_title = None;
                    children = Rrbvec.empty;
                    referrers = Rrbvec.empty;
                    history_block;
                    history_property;
                    history_ref_value;
                    history_scalar;
                    reactions = Rrbvec.empty;
                    views = Rrbvec.empty;
                    histories = Rrbvec.empty;
                  }
                in
                candidates :=
                  Rrbvec.push_back !candidates
                    (history_candidate capabilities database
                       (Delete_plan.By_id id) snapshot
                       (Hashtbl.mem retracted_history_ids id)))
              (capabilities.uuid_text uuid_value))
    additions;
  !candidates

let stable_distinct_operations operations =
  Rrbvec.fold_left
    (fun result operation ->
      if Rrbvec.mem operation result then result
      else Rrbvec.push_back result operation)
    Rrbvec.empty operations

let cleanup capabilities database transactions =
  let initial =
    Rrbvec.fold_left
      (fun result value -> push_distinct_id capabilities value result)
      (retracted_entities capabilities database transactions)
      (history_ref_retracted_entities capabilities database transactions)
  in
  let retracted_ids = Rrbvec.filter_map (snapshot_id capabilities) initial in
  let operations =
    ref
      (new_history_candidates capabilities database transactions
      |> Delete_plan.new_history_retracts ~retracted_ids)
  in
  let pending = Queue.create () in
  Rrbvec.iter (fun value -> Queue.add value pending) initial;
  let seen = Hashtbl.create 32 in
  while not (Queue.is_empty pending) do
    let current = ref Rrbvec.empty in
    while not (Queue.is_empty pending) do
      let value = Queue.take pending in
      match snapshot_id capabilities value with
      | Some id when not (Hashtbl.mem seen id) ->
          Hashtbl.add seen id ();
          current := Rrbvec.push_back !current value
      | Some _ | None -> ()
    done;
    let next =
      !current
      |> Rrbvec.filter_map (plan_entity capabilities)
      |> Delete_plan.direct_cleanup
    in
    operations := Rrbvec.append !operations next;
    Rrbvec.iter
      (function
        | Delete_plan.Retract_entity id ->
            Option.iter
              (fun value -> Queue.add value pending)
              (capabilities.entity database (capabilities.int_value id))
        | Retract_ref _ | Add_title _ | Retract_uuid _ -> ())
      next
  done;
  stable_distinct_operations !operations
