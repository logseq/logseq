type 'value lookup =
  | Uuid of 'value
  | Id of 'value
  | Page_name of string
  | Missing

type ('database, 'value) capabilities = {
  field : 'value -> string -> 'value;
  entries : 'value -> (string * 'value) array;
  map : (string * 'value) array -> 'value;
  assoc : 'value -> string -> 'value -> 'value;
  nil : 'value;
  is_nil : 'value -> bool;
  truthy : 'value -> bool;
  entity : 'value -> bool;
  values : 'value -> 'value array;
  entity_values : 'value -> 'value array option;
  sequence : 'value array -> 'value;
  lookup_entity : 'database -> 'value -> 'value option;
  pull_all : 'database -> 'value -> 'value;
  uuid_lookup : 'value -> 'value;
  oldest_page_by_name : 'database -> string -> 'value option;
  children_ids : 'database -> 'value -> bool -> 'value array option;
  block_refs_count : 'database -> 'value -> int;
  has_children : 'database -> 'value -> bool;
  equal : 'value -> 'value -> bool;
  bool : bool -> 'value;
  int : int -> 'value;
  keyword : string -> 'value;
}

let field capabilities value name = capabilities.field value name
let map capabilities entries = entries |> Rrbvec.to_array |> capabilities.map

let id_map capabilities entity =
  Rrbvec.singleton ("db/id", field capabilities entity "db/id")
  |> map capabilities

let entity_id capabilities entity = field capabilities entity "db/id"

let rec project_entity capabilities ~root ~properties entity =
  let project_entry (name, value) =
    let value =
      if not root then value
      else
        match name with
        | "block/parent" | "logseq.property/created-by-ref" ->
            entity_id capabilities value
        | "block/tags" ->
            capabilities.values value
            |> Array.map (id_map capabilities)
            |> capabilities.sequence
        | _ when capabilities.entity value ->
            project_entity capabilities ~root:false ~properties value
        | _ -> (
            match capabilities.entity_values value with
            | Some entities ->
                entities
                |> Array.map
                     (project_entity capabilities ~root:false ~properties)
                |> capabilities.sequence
            | None -> value)
    in
    (name, value)
  in
  let entries =
    capabilities.entries entity
    |> Rrbvec.of_array
    |> Rrbvec.filter (fun (name, _) ->
        (not root) || Rrbvec.is_empty properties || Rrbvec.mem name properties)
    |> Rrbvec.map project_entry
  in
  let result = map capabilities entries in
  let result =
    let raw_title = field capabilities entity "block/raw-title" in
    if capabilities.is_nil raw_title then result
    else capabilities.assoc result "block/title" raw_title
  in
  capabilities.assoc result "db/id" (entity_id capabilities entity)

let entity_to_map capabilities ~properties entity =
  project_entity capabilities ~root:true ~properties entity

let select_id_and_uuid capabilities entity =
  let entries = Rrbvec.singleton ("db/id", entity_id capabilities entity) in
  let uuid = field capabilities entity "block/uuid" in
  let entries =
    if capabilities.is_nil uuid then entries
    else Rrbvec.push_back entries ("block/uuid", uuid)
  in
  map capabilities entries

let without_nil_entries capabilities value =
  capabilities.entries value |> Rrbvec.of_array
  |> Rrbvec.filter (fun (_, entry) -> not (capabilities.is_nil entry))
  |> map capabilities

let with_parent capabilities database block =
  if field capabilities block "block/page" |> capabilities.truthy |> not then
    block
  else
    let parent = field capabilities block "block/parent" in
    let parent_id = entity_id capabilities parent in
    let parent =
      if capabilities.is_nil parent_id then capabilities.nil
      else
        capabilities.lookup_entity database parent_id
        |> Option.map (select_id_and_uuid capabilities)
        |> Option.value ~default:capabilities.nil
    in
    let block =
      capabilities.assoc block "block/parent" parent
      |> without_nil_entries capabilities
    in
    let refs =
      field capabilities block "block/refs"
      |> capabilities.values
      |> Array.map (fun reference ->
          capabilities.pull_all database (entity_id capabilities reference))
      |> capabilities.sequence
    in
    capabilities.assoc block "block/refs" refs

let resolve capabilities database = function
  | Uuid value ->
      capabilities.lookup_entity database (capabilities.uuid_lookup value)
  | Id value -> capabilities.lookup_entity database value
  | Page_name name ->
      Option.bind
        (capabilities.oldest_page_by_name database name)
        (capabilities.lookup_entity database)
  | Missing -> None

let contains capabilities target values =
  Rrbvec.exists (capabilities.equal target) values

let load_status_text = function
  | Initial_read.Full -> "full"
  | Children -> "children"
  | Self -> "self"

let child_payload capabilities selected_ids ~large_page entity =
  let direct_child_ids =
    field capabilities entity "block/_parent"
    |> capabilities.values |> Rrbvec.of_array
    |> Rrbvec.map (entity_id capabilities)
  in
  let full_tree =
    Rrbvec.for_all
      (fun id -> contains capabilities id selected_ids)
      direct_child_ids
  in
  let collapsed =
    field capabilities entity "block/collapsed?" |> capabilities.truthy
  in
  entity_to_map capabilities ~properties:Rrbvec.empty entity |> fun value ->
  capabilities.assoc value "block.temp/has-children?"
    (capabilities.bool
       (field capabilities entity "block/_parent" |> capabilities.is_nil |> not))
  |> fun value ->
  capabilities.assoc value "block.temp/load-status"
    (Initial_read.child_load_status ~collapsed ~large_page
       ~all_children_loaded:full_tree
    |> load_status_text |> capabilities.keyword)

let block_and_children capabilities database lookup ~children ~include_collapsed
    ~properties =
  resolve capabilities database lookup
  |> Option.map (fun block ->
      let block_id = entity_id capabilities block in
      let projected_children =
        if not children then None
        else
          let child_ids =
            capabilities.children_ids database block_id include_collapsed
            |> Option.value ~default:[||] |> Rrbvec.of_array
          in
          let descendants =
            child_ids |> Rrbvec.filter_map (capabilities.lookup_entity database)
          in
          let large_page =
            Initial_read.large_page (Rrbvec.length descendants)
          in
          let child_entities =
            if large_page then
              field capabilities block "block/_parent"
              |> capabilities.values |> Rrbvec.of_array
            else descendants
          in
          child_entities
          |> Rrbvec.filter (fun entity ->
              field capabilities entity "block/closed-value-property"
              |> capabilities.truthy |> not)
          |> Rrbvec.map (child_payload capabilities child_ids ~large_page)
          |> Rrbvec.to_array |> capabilities.sequence |> Option.some
      in
      let include_refs_count = Rrbvec.mem "block.temp/refs-count" properties in
      let block_value = entity_to_map capabilities ~properties block in
      let block_value =
        if not include_refs_count then block_value
        else
          capabilities.assoc block_value "block.temp/refs-count"
            (capabilities.block_refs_count database block_id |> capabilities.int)
      in
      let block_value =
        capabilities.assoc block_value "block.temp/load-status"
          (Initial_read.block_load_status ~children ~include_collapsed
             ~properties_empty:(Rrbvec.is_empty properties)
          |> load_status_text |> capabilities.keyword)
      in
      let block_value =
        capabilities.assoc block_value "block.temp/has-children?"
          (capabilities.has_children database block_id |> capabilities.bool)
      in
      let result =
        Rrbvec.singleton ("block", block_value) |> map capabilities
      in
      match projected_children with
      | None -> result
      | Some values -> capabilities.assoc result "children" values)
