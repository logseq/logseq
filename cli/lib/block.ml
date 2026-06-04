type position = First_child | Last_child | Sibling

type t = {
  id : Cli_primitive.db_id option;
  uuid : Cli_primitive.uuid option;
  title : string option;
  name : string option;
  order : int option;
  parent : Selector.block option;
  page : Selector.page option;
  tags : Selector.tag list;
  properties : Property.assignment list;
  children : t list;
  raw : Edn_ocaml.any;
}

type tree = { root : t }

let position_of_string = function
  | "first-child" | "first_child" -> Some First_child
  | "last-child" | "last_child" -> Some Last_child
  | "sibling" -> Some Sibling
  | _ -> None

let string_of_position = function
  | First_child -> "first-child"
  | Last_child -> "last-child"
  | Sibling -> "sibling"

let make ?uuid ?title ?(children = []) () =
  {
    id = None;
    uuid;
    title;
    name = None;
    order = None;
    parent = None;
    page = None;
    tags = [];
    properties = [];
    children;
    raw = Edn_util.nil;
  }

let of_value raw =
  {
    (make ()) with
    raw;
    id = Edn_util.get_int64 raw ":db/id";
    uuid = Edn_util.get_string raw ":block/uuid";
    title = Edn_util.get_string raw ":block/title";
  }

let tag_to_value = function
  | Selector.Tag_id id -> Edn_util.int64 id
  | Tag_name name -> Edn_util.string name
  | Tag_ident ident -> Edn_util.any ident
  | Tag_uuid uuid -> Edn_util.uuid uuid

let property_key_to_value = function
  | Property.Key_ident ident -> Edn_util.any ident
  | Key_id id -> Edn_util.int64 id
  | Key_name name -> Edn_util.string name

let parent_to_value = function
  | Selector.Block_id id -> Edn_util.int64 id
  | Block_uuid uuid ->
      Edn_util.vector [ Edn_util.keyword ":block/uuid"; Edn_util.uuid uuid ]

let rec to_value t =
  let fields =
    [
      ( Edn_util.keyword ":block/title",
        Edn_util.string (Option.value t.title ~default:"") );
    ]
  in
  let fields =
    if t.children = [] then fields
    else
      ( Edn_util.keyword ":block/children",
        Edn_util.vector
          (List.map (fun child -> Edn_util.any (to_value child)) t.children) )
      :: fields
  in
  let fields =
    match t.uuid with
    | Some uuid ->
        (Edn_util.keyword ":block/uuid", Edn_util.uuid uuid) :: fields
    | None -> fields
  in
  let fields =
    match t.parent with
    | Some parent ->
        (Edn_util.keyword ":block/parent", parent_to_value parent) :: fields
    | None -> fields
  in
  let fields =
    match t.tags with
    | [] -> fields
    | tags ->
        ( Edn_util.keyword ":block/tags",
          Edn_util.set (List.map tag_to_value tags) )
        :: fields
  in
  let fields =
    List.fold_left
      (fun fields assignment ->
        (property_key_to_value assignment.Property.key, assignment.value)
        :: fields)
      fields t.properties
  in
  Edn_util.map_t (List.rev fields)

let rec flatten xs = xs @ List.concat_map (fun t -> flatten t.children) xs
let collect_uuids xs = flatten xs |> List.filter_map (fun t -> t.uuid)
let label t = match t.title with Some _ as x -> x | None -> t.name
