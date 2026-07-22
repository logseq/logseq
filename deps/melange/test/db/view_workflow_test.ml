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

let number_property =
  entity
    [
      ("db/ident", keyword "user.property/score");
      ("logseq.property/type", keyword "number");
      ("db/cardinality", keyword "db.cardinality/many");
    ]

let text_property =
  entity
    [
      ("db/ident", keyword "user.property/labels");
      ("logseq.property/type", keyword "string");
      ("db/cardinality", keyword "db.cardinality/many");
    ]

let reference_property =
  entity
    [
      ("db/ident", keyword "user.property/owner");
      ("logseq.property/type", keyword "default");
      ("db/valueType", keyword "db.type/ref");
    ]

let status_a = entity [ ("db/id", Number 101.); ("block/order", Text "a") ]
let status_b = entity [ ("db/id", Number 102.); ("block/order", Text "b") ]

let status_property =
  entity
    [
      ("db/ident", keyword "user.property/status");
      ("logseq.property/type", keyword "default");
      ("db/valueType", keyword "db.type/ref");
      ("property/closed-values", Collection [| status_b; status_a |]);
    ]

let properties =
  Rrbvec.of_list
    [
      (keyword "user.property/score", number_property);
      (keyword "user.property/labels", text_property);
      (keyword "user.property/owner", reference_property);
      (keyword "user.property/status", status_property);
    ]

let capabilities : value View_workflow.capabilities =
  {
    field;
    resolve_entity =
      (fun lookup ->
        properties
        |> Rrbvec.find_opt (fun (candidate, _) -> candidate = lookup)
        |> Option.map snd);
    is_nil = (function Nil -> true | _ -> false);
    value_truthy = (function Nil | Bool false -> false | _ -> true);
    is_bool = (function Bool _ -> true | _ -> false);
    bool_from_value = (function Bool value -> value | _ -> invalid_arg "bool");
    is_number = (function Number _ -> true | _ -> false);
    float_from_value =
      (function Number value -> value | _ -> invalid_arg "number");
    is_string = (function Text _ -> true | _ -> false);
    string_from_value =
      (function Text value -> value | _ -> invalid_arg "string");
    ident_text =
      (function Keyword value | Text value -> value | _ -> invalid_arg "ident");
    ident_from_string = (fun value -> Keyword value);
    collection_to_array =
      (function
      | Collection values -> values
      | Nil -> [||]
      | _ -> invalid_arg "collection");
    string_to_value = (fun value -> Text value);
    float_to_value = (fun value -> Number value);
    value_to_string =
      (function
      | Text value | Keyword value -> value
      | Number value -> string_of_float value
      | Bool value -> string_of_bool value
      | Nil -> ""
      | Collection _ | Entity _ -> invalid_arg "stringable");
    equal = ( = );
    datom_entity_ids = (fun _ -> [||]);
  }

let () =
  Fest.test "DB view workflow projects searchable property values" (fun () ->
      let owner = entity [ ("block/title", Text "Alice") ] in
      let score_2 = entity [ ("logseq.property/value", Number 2.) ] in
      let score_3 = entity [ ("logseq.property/value", Number 3.) ] in
      let row =
        entity
          [
            ("user.property/score", Collection [| score_2; score_3 |]);
            ("user.property/labels", Collection [| Text "a"; Text "b" |]);
            ("user.property/owner", owner);
          ]
      in
      expect_equal "many number"
        (View_workflow.property_value_for_search capabilities ~entity:row
           ~property:number_property)
        (Number 5.);
      expect_equal "many text"
        (View_workflow.property_value_for_search capabilities ~entity:row
           ~property:text_property)
        (Text "a, b");
      expect_equal "reference content"
        (View_workflow.property_value_for_search capabilities ~entity:row
           ~property:reference_property)
        (Text "Alice"));
  Fest.test "DB view workflow sorts missing, closed, and minor values"
    (fun () ->
      let row_a =
        let score_2 = entity [ ("logseq.property/value", Number 2.) ] in
        let score_3 = entity [ ("logseq.property/value", Number 3.) ] in
        entity
          [
            ("db/id", Number 1.);
            ("user.property/score", Collection [| score_2; score_3 |]);
            ("user.property/status", status_a);
          ]
      in
      let row_b =
        let score_1 = entity [ ("logseq.property/value", Number 1.) ] in
        entity
          [
            ("db/id", Number 2.);
            ("user.property/score", Collection [| score_1 |]);
            ("user.property/status", status_a);
          ]
      in
      let row_c =
        entity [ ("db/id", Number 3.); ("user.property/status", status_b) ]
      in
      let sorted sorting =
        View_workflow.sort_entities_with capabilities (Rrbvec.of_list sorting)
          (Rrbvec.of_list [ row_b; row_c; row_a ])
        |> Rrbvec.map (fun row -> field row "db/id")
        |> Rrbvec.to_list
      in
      expect_equal "missing number first"
        (sorted
           [
             {
               View_workflow.id = keyword "user.property/score";
               ascending = true;
             };
           ])
        [ Number 3.; Number 2.; Number 1. ];
      expect_equal "closed major with numeric minor"
        (sorted
           [
             {
               View_workflow.id = keyword "user.property/status";
               ascending = true;
             };
             {
               View_workflow.id = keyword "user.property/score";
               ascending = false;
             };
           ])
        [ Number 1.; Number 2.; Number 3. ])
  ;
  Fest.test "DB view workflow fast sorting does not evaluate the fallback"
    (fun () ->
      let fallback_field_calls = ref 0 in
      let fast_capabilities =
        {
          capabilities with
          field =
            (fun value name ->
              if String.equal name "block/title" then (
                incr fallback_field_calls;
                Text "fallback")
              else if String.equal name "db/id" then value
              else Nil);
          datom_entity_ids = (fun _ -> [||]);
        }
      in
      let entities =
        Array.init 10_001 (fun index -> Number (float_of_int index))
        |> Rrbvec.of_array
      in
      ignore
        (View_workflow.sort_entities_with fast_capabilities
           (Rrbvec.singleton
              {
                View_workflow.id = keyword "block/title";
                ascending = true;
              })
           entities);
      expect_equal "fallback field calls" !fallback_field_calls 0)
