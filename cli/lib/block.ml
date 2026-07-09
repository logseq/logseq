type position = First_child | Last_child | Sibling

type t = {
  id : Cli_primitive.db_id option;
  uuid : Cli_primitive.uuid option;
  title : string option;
  name : string option;
  order : int option;
  parent : Selector.block option;
  page : Selector.page option;
  tags : Selector.tag Rrbvec.t;
  properties : Property.assignment Rrbvec.t;
  children : t Rrbvec.t;
  raw : Melange_edn_melange.any;
}

type tree = { root : t }

let position_of_string = function
  | "first-child" | "first_child" -> Some First_child
  | "last-child" | "last_child" -> Some Last_child
  | "sibling" -> Some Sibling
  | _ -> None

let make ?uuid ?title ?(children = Vec.empty) () =
  {
    id = None;
    uuid;
    title;
    name = None;
    order = None;
    parent = None;
    page = None;
    tags = Vec.empty;
    properties = Vec.empty;
    children;
    raw = Edn_util.nil;
  }

let of_value raw =
  {
    (make ()) with
    raw;
    id = Edn_util.get_int64 raw "db/id";
    uuid = Edn_util.get_string raw "block/uuid";
    title = Edn_util.get_string raw "block/title";
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
      Edn_util.vector_vec
        (Vec.of_array [| Edn_util.keyword "block/uuid"; Edn_util.uuid uuid |])

let rec to_value t =
  let fields =
    Vec.singleton
      ( Edn_util.keyword "block/title",
        Edn_util.string (Option.value t.title ~default:"") )
  in
  let fields =
    if Vec.is_empty t.children then fields
    else
      Vec.push_front fields
        ( Edn_util.keyword "block/children",
          Edn_util.vector_vec
            (t.children |> Vec.map (fun child -> Edn_util.any (to_value child)))
        )
  in
  let fields =
    match t.uuid with
    | Some uuid ->
        Vec.push_front fields (Edn_util.keyword "block/uuid", Edn_util.uuid uuid)
    | None -> fields
  in
  let fields =
    match t.id with
    | Some id ->
        Vec.push_front fields (Edn_util.keyword "db/id", Edn_util.int64 id)
    | None -> fields
  in
  let fields =
    match t.parent with
    | Some parent ->
        Vec.push_front fields
          (Edn_util.keyword "block/parent", parent_to_value parent)
    | None -> fields
  in
  let fields =
    if Vec.is_empty t.tags then fields
    else
      Vec.push_front fields
        ( Edn_util.keyword "block/tags",
          Edn_util.set_vec (t.tags |> Vec.map tag_to_value) )
  in
  let fields =
    Vec.fold_left
      (fun fields assignment ->
        Vec.push_front fields
          (property_key_to_value assignment.Property.key, assignment.value))
      fields t.properties
  in
  Edn_util.map_t_rev_vec fields

let rec flatten xs =
  Vec.append xs (Vec.concat_map (fun t -> flatten t.children) xs)

let label t = match t.title with Some _ as x -> x | None -> t.name
