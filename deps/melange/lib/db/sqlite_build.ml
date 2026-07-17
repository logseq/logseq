type property_value = Missing | Page of { journal : bool } | Scalar of string
type property_schema = { property_type : string; cardinality : string option }
type temp_id_state = { mutable current : int }

let create_temp_id_state () = { current = 0 }

let next_temp_id state =
  state.current <- state.current - 1;
  state.current

let default_temp_id_state = create_temp_id_state ()

let push_distinct value values =
  if Rrbvec.mem value values then values else Rrbvec.push_back values value

let sort_by_index indices values =
  let values = Rrbvec.to_array values in
  Array.sort
    (fun left right ->
      Int.compare (Hashtbl.find indices left) (Hashtbl.find indices right))
    values;
  Rrbvec.of_array values

let class_property_order constraints =
  let all_properties =
    Rrbvec.fold_left
      (fun result properties ->
        Rrbvec.fold_left
          (fun result property -> push_distinct property result)
          result properties)
      Rrbvec.empty constraints
  in
  let indices = Hashtbl.create (Rrbvec.length all_properties) in
  let incoming = Hashtbl.create (Rrbvec.length all_properties) in
  Rrbvec.iteri
    (fun index property ->
      Hashtbl.add indices property index;
      Hashtbl.add incoming property 0)
    all_properties;
  let outgoing = Hashtbl.create (Rrbvec.length all_properties) in
  let edges = Hashtbl.create (Rrbvec.length all_properties) in
  Rrbvec.iter
    (fun properties ->
      let length = Rrbvec.length properties in
      for index = 0 to length - 2 do
        let left = Rrbvec.nth properties index in
        let right = Rrbvec.nth properties (index + 1) in
        if left <> right && not (Hashtbl.mem edges (left, right)) then (
          Hashtbl.add edges (left, right) ();
          let neighbors =
            Option.value (Hashtbl.find_opt outgoing left) ~default:Rrbvec.empty
          in
          Hashtbl.replace outgoing left (Rrbvec.push_back neighbors right);
          Hashtbl.replace incoming right (Hashtbl.find incoming right + 1))
      done)
    constraints;
  let initial_queue =
    all_properties
    |> Rrbvec.filter (fun property -> Hashtbl.find incoming property = 0)
    |> sort_by_index indices
  in
  let rec consume ordered queue =
    match Rrbvec.pop_front queue with
    | None -> ordered
    | Some (property, remaining) ->
        let unlocked = ref Rrbvec.empty in
        let neighbors =
          Option.value
            (Hashtbl.find_opt outgoing property)
            ~default:Rrbvec.empty
        in
        Rrbvec.iter
          (fun neighbor ->
            let count = Hashtbl.find incoming neighbor - 1 in
            Hashtbl.replace incoming neighbor count;
            if count = 0 then unlocked := Rrbvec.push_back !unlocked neighbor)
          neighbors;
        consume
          (Rrbvec.push_back ordered property)
          (Rrbvec.append remaining !unlocked |> sort_by_index indices)
  in
  let ordered = consume Rrbvec.empty initial_queue in
  if Rrbvec.length ordered <> Rrbvec.length all_properties then
    invalid_arg "Cycle detected in class property constraints";
  ordered

let validate_class_extends_acyclic classes =
  let incoming = Hashtbl.create (Rrbvec.length classes) in
  let outgoing = Hashtbl.create (Rrbvec.length classes) in
  let edges = Hashtbl.create (Rrbvec.length classes) in
  Rrbvec.iter
    (fun (class_ident, _parents) -> Hashtbl.replace incoming class_ident 0)
    classes;
  Rrbvec.iter
    (fun (class_ident, parents) ->
      Rrbvec.iter
        (fun parent_ident ->
          if
            Hashtbl.mem incoming parent_ident
            && not (Hashtbl.mem edges (class_ident, parent_ident))
          then (
            Hashtbl.add edges (class_ident, parent_ident) ();
            let parents =
              Option.value
                (Hashtbl.find_opt outgoing class_ident)
                ~default:Rrbvec.empty
            in
            Hashtbl.replace outgoing class_ident
              (Rrbvec.push_back parents parent_ident);
            Hashtbl.replace incoming parent_ident
              (Hashtbl.find incoming parent_ident + 1)))
        parents)
    classes;
  let initial_queue =
    classes
    |> Rrbvec.filter_map (fun (class_ident, _parents) ->
        if Hashtbl.find incoming class_ident = 0 then Some class_ident
        else None)
  in
  let rec consume count queue =
    match Rrbvec.pop_front queue with
    | None -> count
    | Some (class_ident, remaining) ->
        let unlocked = ref Rrbvec.empty in
        Option.value
          (Hashtbl.find_opt outgoing class_ident)
          ~default:Rrbvec.empty
        |> Rrbvec.iter (fun parent_ident ->
            let count = Hashtbl.find incoming parent_ident - 1 in
            Hashtbl.replace incoming parent_ident count;
            if count = 0 then
              unlocked := Rrbvec.push_back !unlocked parent_ident);
        consume (count + 1) (Rrbvec.append remaining !unlocked)
  in
  if consume 0 initial_queue <> Rrbvec.length classes then
    Js.Exn.raiseError "Cycle detected in :build/class-extends"

let property_schema ~collection value =
  let property_type =
    match value with
    | Missing -> "default"
    | Page { journal = true } -> "date"
    | Page { journal = false } -> "node"
    | Scalar property_type -> property_type
  in
  { property_type; cardinality = (if collection then Some "many" else None) }

let rec extract_blocks ~children ~apply blocks =
  blocks
  |> Rrbvec.concat_map (fun block ->
      Rrbvec.append (apply block)
        (extract_blocks ~children ~apply (children block)))

let rec update_blocks ~children ~with_children ~update blocks =
  blocks
  |> Rrbvec.map (fun block ->
      let updated = update block in
      let nested = children block in
      if Rrbvec.is_empty nested then updated
      else
        with_children updated
          (update_blocks ~children ~with_children ~update nested))
