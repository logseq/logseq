type 'database capabilities = {
  index_roots : 'database -> int Rrbvec.t;
  non_referenced : 'database -> int Rrbvec.t;
  edges : 'database -> (int * int Rrbvec.t) Rrbvec.t;
  delete : 'database -> int Rrbvec.t -> unit;
  address_count : 'database -> int;
}

let internal_addresses capabilities database =
  let roots = capabilities.index_roots database in
  Rrbvec.push_front (Rrbvec.push_front roots 1) 0

let recursive_unused capabilities database =
  Sqlite_policy.unused_addresses
    ~internal:(internal_addresses capabilities database)
    ~all:(capabilities.non_referenced database)
    ~referenced:Rrbvec.empty

let walk_unused capabilities database =
  let edges = capabilities.edges database in
  let all = Rrbvec.map fst edges in
  let reachable =
    let values =
      Sqlite_policy.reachable_addresses
        ~roots:(capabilities.index_roots database)
        edges
    in
    Rrbvec.push_front (Rrbvec.push_front values 1) 0
  in
  Sqlite_policy.unused_addresses ~internal:Rrbvec.empty ~all
    ~referenced:reachable

let rec collect_recursive capabilities database ~repeat =
  let unused = recursive_unused capabilities database in
  if not (Rrbvec.is_empty unused) then (
    capabilities.delete database unused;
    if repeat then collect_recursive capabilities database ~repeat)

let collect_wasm_with capabilities database ~full_gc =
  Option.iter
    (fun database -> collect_recursive capabilities database ~repeat:full_gc)
    database

let collect_node_with capabilities database ~walk =
  let _ = capabilities.address_count database in
  if walk then
    let unused = walk_unused capabilities database in
    if not (Rrbvec.is_empty unused) then capabilities.delete database unused
    else collect_recursive capabilities database ~repeat:true

let ensure_no_garbage_with capabilities database =
  recursive_unused capabilities database |> Rrbvec.is_empty
