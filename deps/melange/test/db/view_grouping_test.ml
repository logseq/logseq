open Melange_db

type value =
  | Nil
  | Bool of bool
  | Number of float
  | Text of string
  | Keyword of string
  | Collection of value array
  | Entity of (string * value) array

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let field value name =
  match value with
  | Entity entries -> (
      match Array.find_opt (fun (key, _) -> String.equal key name) entries with
      | Some (_, value) -> value
      | None -> Nil)
  | Nil | Bool _ | Number _ | Text _ | Keyword _ | Collection _ -> Nil

let entity entries = Entity (Array.of_list entries)
let keyword value = Keyword value

let capabilities : value View_grouping.capabilities =
  {
    field;
    is_nil = (function Nil -> true | _ -> false);
    is_entity = (function Entity _ -> true | _ -> false);
    is_collection = (function Collection _ -> true | _ -> false);
    is_map = (function Entity _ -> true | _ -> false);
    is_bool = (function Bool _ -> true | _ -> false);
    is_number = (function Number _ -> true | _ -> false);
    is_string = (function Text _ -> true | _ -> false);
    value_truthy = (function Nil | Bool false -> false | _ -> true);
    bool_from_value = (function Bool value -> value | _ -> invalid_arg "bool");
    float_from_value =
      (function Number value -> value | _ -> invalid_arg "number");
    string_from_value =
      (function Text value -> value | _ -> invalid_arg "string");
    ident_text =
      (function Keyword value | Text value -> value | _ -> invalid_arg "ident");
    collection_to_array =
      (function Collection values -> values | _ -> invalid_arg "collection");
    equal = ( = );
  }

let group_rows groups =
  groups
  |> Rrbvec.map (fun (group : value View_grouping.group) ->
      ( group.key,
        group.entities
        |> Rrbvec.map (fun row -> field row "db/id")
        |> Rrbvec.to_list ))
  |> Rrbvec.to_list

let () =
  Fest.test "DB view grouping groups scalar values and preserves duplicate rows"
    (fun () ->
      let property =
        entity
          [
            ("db/ident", keyword "block/title");
            ("logseq.property/type", keyword "string");
          ]
      in
      let rows =
        Rrbvec.of_list
          [
            entity [ ("db/id", Number 1.); ("block/title", Text "B") ];
            entity [ ("db/id", Number 2.); ("block/title", Text "A") ];
            entity [ ("db/id", Number 3.); ("block/title", Text "B") ];
          ]
      in
      let groups =
        View_grouping.group_entities_with capabilities ~property
          ~group_ident:"block/title" ~sort_ident:"block/title" ~descending:false
          rows
      in
      expect_equal "scalar groups" (group_rows groups)
        [ (Text "A", [ Number 2. ]); (Text "B", [ Number 1.; Number 3. ]) ]);
  Fest.test "DB view grouping expands many entity values and sorts their titles"
    (fun () ->
      let property =
        entity
          [
            ("db/ident", keyword "block/tags");
            ("logseq.property/type", keyword "node");
            ("db/valueType", keyword "db.type/ref");
          ]
      in
      let drama =
        entity [ ("db/id", Number 20.); ("block/title", Text "Drama") ]
      in
      let scifi =
        entity [ ("db/id", Number 21.); ("block/title", Text "Sci-Fi") ]
      in
      let rows =
        Rrbvec.of_list
          [
            entity
              [
                ("db/id", Number 1.);
                ("block/tags", Collection [| scifi; drama |]);
              ];
            entity
              [ ("db/id", Number 2.); ("block/tags", Collection [| scifi |]) ];
          ]
      in
      let groups =
        View_grouping.group_entities_with capabilities ~property
          ~group_ident:"block/tags" ~sort_ident:"block/title" ~descending:false
          rows
      in
      expect_equal "entity group titles"
        (groups
        |> Rrbvec.map (fun (group : value View_grouping.group) ->
            (field group.key "block/title", Rrbvec.length group.entities))
        |> Rrbvec.to_list)
        [ (Text "Drama", 1); (Text "Sci-Fi", 2) ]);
  Fest.test "DB view grouping extracts and numerically sorts value refs"
    (fun () ->
      let property =
        entity
          [
            ("db/ident", keyword "user.property/score");
            ("logseq.property/type", keyword "number");
            ("db/valueType", keyword "db.type/ref");
          ]
      in
      let score value = entity [ ("logseq.property/value", Number value) ] in
      let rows =
        Rrbvec.of_list
          [
            entity [ ("db/id", Number 1.); ("user.property/score", score 2.) ];
            entity [ ("db/id", Number 2.); ("user.property/score", score 10.) ];
            entity [ ("db/id", Number 3.); ("user.property/score", score 1.) ];
          ]
      in
      let groups =
        View_grouping.group_entities_with capabilities ~property
          ~group_ident:"user.property/score" ~sort_ident:"block/journal-day"
          ~descending:false rows
      in
      expect_equal "numeric groups"
        (groups
        |> Rrbvec.map (fun (group : value View_grouping.group) -> group.key)
        |> Rrbvec.to_list)
        [ Number 1.; Number 2.; Number 10. ];
      let descending =
        View_grouping.group_entities_with capabilities ~property
          ~group_ident:"user.property/score" ~sort_ident:"block/journal-day"
          ~descending:true rows
      in
      expect_equal "numeric descending"
        (descending
        |> Rrbvec.map (fun (group : value View_grouping.group) -> group.key)
        |> Rrbvec.to_list)
        [ Number 10.; Number 2.; Number 1. ]);
  Fest.test "DB view grouping orders closed values and missing journal pages"
    (fun () ->
      let closed_property =
        entity
          [
            ("db/ident", keyword "user.property/status");
            ("logseq.property/type", keyword "default");
            ("db/valueType", keyword "db.type/ref");
            ("property/closed-values", Collection [||]);
          ]
      in
      let later =
        entity
          [
            ("db/id", Number 31.);
            ("db/ident", keyword "user.closed/later");
            ("block/order", Text "b");
            ("logseq.property/value", Text "Later");
          ]
      in
      let earlier =
        entity
          [
            ("db/id", Number 30.);
            ("db/ident", keyword "user.closed/earlier");
            ("block/order", Text "a");
            ("logseq.property/value", Text "Earlier");
          ]
      in
      let closed_rows =
        Rrbvec.of_list
          [
            entity [ ("db/id", Number 1.); ("user.property/status", later) ];
            entity [ ("db/id", Number 2.); ("user.property/status", earlier) ];
          ]
      in
      expect_equal "closed order"
        (View_grouping.group_entities_with capabilities
           ~property:closed_property ~group_ident:"user.property/status"
           ~sort_ident:"block/title" ~descending:false closed_rows
        |> Rrbvec.map (fun (group : value View_grouping.group) ->
            field group.key "block/order")
        |> Rrbvec.to_list)
        [ Text "a"; Text "b" ];
      let page_property = entity [ ("db/ident", keyword "block/page") ] in
      let journal =
        entity
          [
            ("db/id", Number 40.);
            ("block/title", Text "Journal");
            ("block/journal-day", Number 20240101.);
          ]
      in
      let page =
        entity [ ("db/id", Number 41.); ("block/title", Text "Page") ]
      in
      let page_rows =
        Rrbvec.of_list
          [
            entity [ ("db/id", Number 1.); ("block/page", page) ];
            entity [ ("db/id", Number 2.); ("block/page", journal) ];
          ]
      in
      expect_equal "missing journal last"
        (View_grouping.group_entities_with capabilities ~property:page_property
           ~group_ident:"block/page" ~sort_ident:"block/journal-day"
           ~descending:false page_rows
        |> Rrbvec.map (fun (group : value View_grouping.group) ->
            field group.key "db/id")
        |> Rrbvec.to_list)
        [ Number 40.; Number 41. ])
