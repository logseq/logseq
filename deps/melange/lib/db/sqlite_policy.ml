type property_input = {
  namespace_ : string;
  name : string;
  normalized_name : string;
  title : string option;
  property_type : string;
  cardinality : string;
  explicit_ref_type : bool;
  known_ref_type : bool;
  uuid : string;
  order : string;
}

type property_plan = {
  ident : string;
  title : string;
  normalized_name : string;
  property_type : string;
  cardinality : string;
  ref_type : bool;
  uuid : string;
  order : string;
}

let regex_special_characters =
  Js.Re.fromStringWithFlags "[\\\\[\\]{}().+*?|$^]" ~flags:"g"

let escape_regex value =
  Js.String.replaceByRe ~regexp:regex_special_characters ~replacement:"\\$&"
    value

let replace_all value pattern replacement =
  let regexp = Js.Re.fromStringWithFlags (escape_regex pattern) ~flags:"g" in
  Js.String.replaceByRe ~regexp ~replacement value

let sanitize_db_name ~prefix value =
  value |> fun value ->
  replace_all value prefix "" |> fun value ->
  replace_all value "/" "_" |> fun value ->
  replace_all value "\\" "_" |> fun value -> replace_all value ":" "_"

let db_based_graph ~prefix value =
  let value_length = String.length value in
  let prefix_length = String.length prefix in
  value_length >= prefix_length && String.sub value 0 prefix_length = prefix

let push_distinct value values =
  if Rrbvec.mem value values then values else Rrbvec.push_back values value

let reachable_addresses ~roots edges =
  let children_by_address = Hashtbl.create (Rrbvec.length edges) in
  Rrbvec.iter
    (fun (address, children) ->
      Hashtbl.replace children_by_address address children)
    edges;
  let pending = Queue.create () in
  Rrbvec.iter (fun address -> Queue.add address pending) roots;
  let result = ref Rrbvec.empty in
  while not (Queue.is_empty pending) do
    let address = Queue.take pending in
    if not (Rrbvec.mem address !result) then (
      result := Rrbvec.push_back !result address;
      match Hashtbl.find_opt children_by_address address with
      | Some children ->
          Rrbvec.iter (fun child -> Queue.add child pending) children
      | None -> ())
  done;
  !result

let unused_addresses ~internal ~all ~referenced =
  Rrbvec.filter
    (fun address ->
      (not (Rrbvec.mem address internal)) && not (Rrbvec.mem address referenced))
    all
  |> Rrbvec.fold_left
       (fun result address -> push_distinct address result)
       Rrbvec.empty

let missing_addresses ~required ~present =
  required
  |> Rrbvec.filter (fun address -> not (Rrbvec.mem address present))
  |> Rrbvec.fold_left
       (fun result address -> push_distinct address result)
       Rrbvec.empty

let property (input : property_input) =
  let title = Option.value input.title ~default:input.name in
  {
    ident = input.namespace_ ^ "/" ^ input.name;
    title;
    normalized_name = input.normalized_name;
    property_type = input.property_type;
    cardinality =
      (if
         input.cardinality = "many" || input.cardinality = "db.cardinality/many"
       then "db.cardinality/many"
       else "db.cardinality/one");
    ref_type = input.explicit_ref_type || input.known_ref_type;
    uuid = input.uuid;
    order = input.order;
  }

let add_root_extends ~ident ~has_extends =
  ident <> "logseq.class/Root" && not has_extends

let hide_page ~title ~quick_add_title = title = quick_add_title

let import_retract_idents =
  Rrbvec.of_array
    [|
      "logseq.kv/graph-uuid";
      "logseq.kv/graph-local-tx";
      "logseq.kv/remote-schema-version";
      "logseq.kv/graph-rtc-e2ee?";
    |]
