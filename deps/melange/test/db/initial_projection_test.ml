open Melange_db

type value =
  | Nil
  | Bool of bool
  | Int of int
  | Text of string
  | Entity of (string * value) array
  | Collection of value array
  | Map of (string * value) array

let rec equal_value left right =
  match (left, right) with
  | Nil, Nil -> true
  | Bool left, Bool right -> Bool.equal left right
  | Int left, Int right -> Int.equal left right
  | Text left, Text right -> String.equal left right
  | Entity left, Entity right | Map left, Map right -> equal_entries left right
  | Collection left, Collection right -> equal_array left right
  | Nil, (Bool _ | Int _ | Text _ | Entity _ | Collection _ | Map _)
  | (Bool _ | Int _ | Text _ | Entity _ | Collection _ | Map _), Nil
  | Bool _, (Int _ | Text _ | Entity _ | Collection _ | Map _)
  | (Int _ | Text _ | Entity _ | Collection _ | Map _), Bool _
  | Int _, (Text _ | Entity _ | Collection _ | Map _)
  | (Text _ | Entity _ | Collection _ | Map _), Int _
  | Text _, (Entity _ | Collection _ | Map _)
  | (Entity _ | Collection _ | Map _), Text _
  | Entity _, (Collection _ | Map _)
  | (Collection _ | Map _), Entity _
  | Collection _, Map _
  | Map _, Collection _ ->
      false

and equal_entries left right =
  Array.length left = Array.length right
  && Array.for_all2
       (fun (left_key, left_value) (right_key, right_value) ->
         String.equal left_key right_key && equal_value left_value right_value)
       left right

and equal_array left right =
  Array.length left = Array.length right
  && Array.for_all2 equal_value left right

let entries = function Entity values | Map values -> values | _ -> [||]

let field value name =
  entries value
  |> Array.find_map (fun (key, value) ->
      if String.equal key name then Some value else None)
  |> Option.value ~default:Nil

let entity id fields = Entity (Array.append [| ("db/id", Int id) |] fields)
let map_get value name = field value name

let assoc value name entry =
  let retained =
    entries value |> Array.to_list
    |> List.filter (fun (key, _) -> not (String.equal key name))
    |> Array.of_list
  in
  Map (Array.append retained [| (name, entry) |])

let capabilities entities : (unit, value) Initial_projection.capabilities =
  {
    field;
    entries;
    map = (fun values -> Map values);
    assoc;
    nil = Nil;
    is_nil = (fun value -> equal_value value Nil);
    truthy = (function Nil | Bool false -> false | _ -> true);
    entity = (function Entity _ -> true | _ -> false);
    values = (function Collection values -> values | Nil -> [||] | _ -> [||]);
    entity_values =
      (function
      | Collection values
        when Array.for_all (function Entity _ -> true | _ -> false) values ->
          Some values
      | _ -> None);
    sequence = (fun values -> Collection values);
    lookup_entity =
      (fun () lookup ->
        let id =
          match lookup with
          | Int id -> Some id
          | Collection [| Text "block/uuid"; Int id |] -> Some id
          | _ -> None
        in
        Option.bind id (fun id -> Hashtbl.find_opt entities id));
    pull_all =
      (fun () lookup ->
        match lookup with
        | Int id -> Hashtbl.find_opt entities id |> Option.value ~default:Nil
        | _ -> Nil);
    uuid_lookup = (fun value -> Collection [| Text "block/uuid"; value |]);
    oldest_page_by_name =
      (fun () name -> if String.equal name "page" then Some (Int 1) else None);
    children_ids =
      (fun () id _include_collapsed ->
        match id with Int 1 -> Some [| Int 2; Int 3 |] | _ -> None);
    block_refs_count = (fun () _ -> 4);
    has_children = (fun () id -> equal_value id (Int 1));
    equal = equal_value;
    bool = (fun value -> Bool value);
    int = (fun value -> Int value);
    keyword = (fun value -> Text value);
  }

let expect label actual expected =
  if not (equal_value actual expected) then
    failwith (label ^ ": unexpected value")

let () =
  Fest.test "DB initial projection owns entity representation" (fun () ->
      let entities = Hashtbl.create 8 in
      let parent = entity 2 [| ("block/uuid", Text "parent") |] in
      let tag = entity 3 [| ("block/title", Text "Tag") |] in
      let creator = entity 4 [||] in
      let nested = entity 5 [| ("block/raw-title", Text "Nested raw") |] in
      let root =
        entity 1
          [|
            ("block/title", Text "Stored");
            ("block/raw-title", Text "Raw");
            ("block/parent", parent);
            ("block/tags", Collection [| tag |]);
            ("logseq.property/created-by-ref", creator);
            ("block/link", nested);
          |]
      in
      let result =
        Initial_projection.entity_to_map (capabilities entities)
          ~properties:Rrbvec.empty root
      in
      expect "raw title" (map_get result "block/title") (Text "Raw");
      expect "parent id" (map_get result "block/parent") (Int 2);
      expect "creator id"
        (map_get result "logseq.property/created-by-ref")
        (Int 4);
      expect "tag ids"
        (map_get result "block/tags")
        (Collection [| Map [| ("db/id", Int 3) |] |]);
      expect "nested entity title"
        (map_get (map_get result "block/link") "block/title")
        (Text "Nested raw"));
  Fest.test "DB initial projection owns parent and lazy child payloads"
    (fun () ->
      let entities = Hashtbl.create 8 in
      let child =
        entity 2
          [|
            ("block/title", Text "Child");
            ("block/_parent", Collection [| entity 3 [||] |]);
          |]
      in
      let grandchild = entity 3 [| ("block/title", Text "Grandchild") |] in
      let root =
        entity 1
          [|
            ("block/page", Int 10);
            ("block/title", Text "Root");
            ("block/parent", entity 9 [| ("block/uuid", Text "parent") |]);
            ("block/refs", Collection [| entity 2 [||] |]);
            ("block/_parent", Collection [| child |]);
          |]
      in
      Array.iter
        (fun value ->
          match field value "db/id" with
          | Int id -> Hashtbl.replace entities id value
          | _ -> ())
        [|
          root; child; grandchild; entity 9 [| ("block/uuid", Text "parent") |];
        |];
      let capabilities = capabilities entities in
      let with_parent = Initial_projection.with_parent capabilities () root in
      expect "parent projection"
        (map_get (map_get with_parent "block/parent") "block/uuid")
        (Text "parent");
      expect "pulled refs"
        (map_get with_parent "block/refs")
        (Collection [| child |]);
      let result =
        Initial_projection.block_and_children capabilities ()
          (Initial_projection.Id (Int 1)) ~children:true
          ~include_collapsed:false
          ~properties:
            (Rrbvec.of_array [| "block/title"; "block.temp/refs-count" |])
        |> Option.get
      in
      expect "root refs count"
        (map_get (map_get result "block") "block.temp/refs-count")
        (Int 4);
      expect "root load status"
        (map_get (map_get result "block") "block.temp/load-status")
        (Text "self");
      let children =
        match map_get result "children" with
        | Collection values -> values
        | _ -> [||]
      in
      if Array.length children <> 2 then failwith "children: unexpected count";
      expect "child load status"
        (map_get children.(0) "block.temp/load-status")
        (Text "full"))
