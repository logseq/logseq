open Melange_db

type value =
  | Nil
  | Bool of bool
  | Number of float
  | Text of string
  | Keyword of string
  | Uuid of string
  | Set of value array
  | Entity of (string * value) array

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let field value name =
  match value with
  | Entity entries -> (
      match Array.find_opt (fun (key, _) -> String.equal key name) entries with
      | Some (_, value) -> value
      | None -> Nil)
  | Nil | Bool _ | Number _ | Text _ | Keyword _ | Uuid _ | Set _ -> Nil

let entity entries = Entity (Array.of_list entries)

let alice =
  entity
    [
      ("db/id", Number 1.);
      ("block/uuid", Uuid "alice");
      ("block/title", Text "Alice");
    ]

let duplicate_alice =
  entity
    [
      ("db/id", Number 2.);
      ("block/uuid", Uuid "alice-duplicate");
      ("block/title", Text "Alice");
    ]

let bob =
  entity
    [
      ("db/id", Number 3.);
      ("block/uuid", Uuid "bob");
      ("block/title", Text "Bob");
    ]

let recycled =
  entity
    [
      ("db/id", Number 4.);
      ("block/uuid", Uuid "recycled");
      ("block/title", Text "Recycled");
      ("logseq.property/deleted-at", Number 1.);
    ]

let placeholder =
  entity
    [
      ("db/id", Number 999.);
      ("block/uuid", Uuid "placeholder");
      ("block/title", Text "Empty");
    ]

let entities =
  Rrbvec.of_list
    [
      (Number 1., alice);
      (Number 2., duplicate_alice);
      (Number 3., bob);
      (Number 4., recycled);
    ]

let uuid_entities = Rrbvec.of_list [ (Uuid "alice", alice); (Uuid "bob", bob) ]

let project value =
  entity
    [ ("db/id", field value "db/id"); ("block/uuid", field value "block/uuid") ]

let capabilities : value View_property_values.capabilities =
  {
    field;
    resolve_entity =
      (fun lookup ->
        entities
        |> Rrbvec.find_opt (fun (candidate, _) -> candidate = lookup)
        |> Option.map snd);
    resolve_uuid =
      (fun lookup ->
        uuid_entities
        |> Rrbvec.find_opt (fun (candidate, _) -> candidate = lookup)
        |> Option.map snd);
    recycled =
      (fun value ->
        field value "logseq.property/deleted-at" |> function
        | Nil | Bool false -> false
        | _ -> true);
    nil_value = Nil;
    is_nil = (function Nil -> true | _ -> false);
    is_entity = (function Entity _ -> true | _ -> false);
    is_set = (function Set _ -> true | _ -> false);
    is_string = (function Text _ -> true | _ -> false);
    is_keyword = (function Keyword _ -> true | _ -> false);
    is_uuid = (function Uuid _ -> true | _ -> false);
    value_truthy = (function Nil | Bool false -> false | _ -> true);
    collection_to_array =
      (function Set values -> values | _ -> invalid_arg "set");
    string_to_value = (fun value -> Text value);
    value_to_string =
      (function
      | Nil -> ""
      | Bool value -> string_of_bool value
      | Number value -> string_of_float value
      | Text value -> value
      | Keyword value -> ":" ^ value
      | Uuid value -> value
      | Set _ | Entity _ -> invalid_arg "stringable");
    equal = ( = );
    project_entity = project;
  }

let entries values =
  values
  |> Rrbvec.map (fun (entry : value View_property_values.entry) ->
      (entry.label, entry.value))
  |> Rrbvec.to_list

let () =
  Fest.test "DB view property values filter project and deduplicate labels"
    (fun () ->
      let row =
        entity
          [
            ( "user.property/value",
              Set
                [|
                  alice;
                  duplicate_alice;
                  recycled;
                  placeholder;
                  Text "";
                  Keyword "tag";
                  Nil;
                |] );
          ]
      in
      let values =
        View_property_values.from_entities capabilities
          ~property_ident:"user.property/value" ~empty_id:(Number 999.)
          (Rrbvec.singleton row)
      in
      expect_equal "view values" (entries values)
        [ (Text "Alice", project alice); (Text ":tag", Keyword "tag") ]);
  Fest.test
    "DB global ref property values prepend defaults and remove recycled values"
    (fun () ->
      let values =
        View_property_values.from_datoms capabilities ~ref_type:true
          ~default_value:(Some alice)
          (Rrbvec.of_list [ Number 1.; Number 3.; Number 4.; Number 1. ])
      in
      expect_equal "reference values" (entries values)
        [ (Text "Alice", project alice); (Text "Bob", project bob) ]);
  Fest.test "DB global scalar property values retain typed labels" (fun () ->
      let values =
        View_property_values.from_datoms capabilities ~ref_type:false
          ~default_value:None
          (Rrbvec.of_list [ Text "alpha"; Number 2.; Bool false; Text "alpha" ])
      in
      expect_equal "scalar values" (entries values)
        [
          (Text "alpha", Text "alpha");
          (Number 2., Number 2.);
          (Bool false, Bool false);
        ])
