open Melange_db

type value =
  | Nil
  | Bool of bool
  | Number of float
  | Text of string
  | Keyword of string
  | Symbol of string
  | Uuid of string
  | Instant of float
  | Collection of value array
  | Entity of (string * value) array

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let expect_invalid label callback =
  match callback () with
  | exception Invalid_argument _ -> ()
  | _ -> failwith (label ^ ": expected Invalid_argument")

let field value name =
  match value with
  | Entity entries -> (
      match Array.find_opt (fun (key, _) -> String.equal key name) entries with
      | Some (_, value) -> value
      | None -> Nil)
  | Nil | Bool _ | Number _ | Text _ | Keyword _ | Symbol _ | Uuid _ | Instant _
  | Collection _ ->
      Nil

let entity entries = Entity (Array.of_list entries)
let collection values = Collection (Array.of_list values)
let keyword value = Keyword value

let status_property =
  entity
    [
      ("db/ident", keyword "user.property/status");
      ("logseq.property/type", keyword "default");
      ("db/valueType", keyword "db.type/ref");
    ]

let owner_property =
  entity
    [
      ("db/ident", keyword "user.property/owner");
      ("logseq.property/type", keyword "node");
      ("db/valueType", keyword "db.type/ref");
    ]

let status_open =
  entity
    [
      ("db/id", Number 101.);
      ("block/uuid", Uuid "open");
      ("logseq.property/value", Text "Open");
    ]

let owner_alice =
  entity
    [
      ("db/id", Number 201.);
      ("block/uuid", Uuid "alice");
      ("block/title", Text "Alice");
    ]

let properties =
  Rrbvec.of_list
    [
      (keyword "user.property/status", status_property);
      (keyword "user.property/owner", owner_property);
    ]

let uuid_entities =
  Rrbvec.of_list [ (Uuid "open", status_open); (Uuid "alice", owner_alice) ]

let capabilities : value View_query_workflow.capabilities =
  {
    field;
    map_keys =
      (function
      | Entity entries -> Array.map (fun (key, _) -> Keyword key) entries
      | _ -> [||]);
    resolve_ident =
      (fun lookup ->
        properties
        |> Rrbvec.find_opt (fun (candidate, _) -> candidate = lookup)
        |> Option.map snd);
    resolve_uuid =
      (fun lookup ->
        uuid_entities
        |> Rrbvec.find_opt (fun (candidate, _) -> candidate = lookup)
        |> Option.map snd);
    nil_value = Nil;
    is_nil = (function Nil -> true | _ -> false);
    is_entity = (function Entity _ -> true | _ -> false);
    is_collection = (function Collection _ -> true | _ -> false);
    is_string = (function Text _ -> true | _ -> false);
    is_bool = (function Bool _ -> true | _ -> false);
    is_number = (function Number _ -> true | _ -> false);
    is_keyword = (function Keyword _ -> true | _ -> false);
    is_uuid = (function Uuid _ -> true | _ -> false);
    is_instant = (function Instant _ -> true | _ -> false);
    value_truthy = (function Nil | Bool false -> false | _ -> true);
    bool_from_value = (function Bool value -> value | _ -> invalid_arg "bool");
    float_from_value =
      (function Number value -> value | _ -> invalid_arg "number");
    string_from_value =
      (function Text value -> value | _ -> invalid_arg "string");
    string_to_value = (fun value -> Text value);
    lowercase = String.lowercase_ascii;
    ident_text =
      (function
      | Keyword value | Symbol value | Text value -> value
      | _ -> invalid_arg "ident");
    collection_to_array =
      (function Collection values -> values | Nil -> [||] | _ -> [||]);
    value_to_string =
      (function
      | Text value | Keyword value | Symbol value | Uuid value -> value
      | Number value -> string_of_float value
      | Bool value -> string_of_bool value
      | Nil -> ""
      | Instant value -> string_of_float value
      | Collection _ | Entity _ -> invalid_arg "stringable");
    equal = ( = );
    instant_to_ms =
      (function Instant value -> value | _ -> invalid_arg "instant");
    now_ms = (fun () -> 86_401_000.);
    relative_timestamp_ms =
      (fun ~now_ms token ->
        if String.equal token "1 day ago" then Some (now_ms -. 86_400_000.)
        else None);
  }

let clause property operator match_ =
  collection [ property; keyword operator; match_ ]

let filters ?(or_ = false) clauses =
  entity [ ("or?", Bool or_); ("filters", Collection (Array.of_list clauses)) ]

let row_a =
  entity
    [
      ("db/id", Number 1.);
      ("block/title", Text "Alpha");
      ("user.property/score", Number 10.);
      ("user.property/enabled", Bool false);
      ("user.property/status", status_open);
      ("user.property/owner", owner_alice);
      ("block/updated-at", Instant 1_000.);
    ]

let row_b =
  entity
    [
      ("db/id", Number 2.);
      ("block/title", Text "Beta");
      ("user.property/score", Number 5.);
      ("user.property/enabled", Bool true);
      ("block/updated-at", Instant 2_000.);
    ]

let ids values =
  values |> Rrbvec.map (fun row -> field row "db/id") |> Rrbvec.to_list

let () =
  Fest.test "DB view query workflow filters text numeric boolean and timestamps"
    (fun () ->
      let selected =
        View_query_workflow.filter_entities_with capabilities
          ~filters:
            (filters
               [
                 clause
                   (keyword "user.property/score")
                   "number-gte" (Number 10.);
                 clause
                   (keyword "user.property/score")
                   "between"
                   (collection [ Number 9.; Number 10. ]);
                 clause (keyword "user.property/enabled") "is" (Bool false);
                 clause (keyword "block/updated-at") "before" (Text "1 day ago");
               ])
          ~input:"alp"
          (Rrbvec.of_list [ row_b; row_a ])
      in
      expect_equal "selected row" (ids selected) [ Number 1. ]);
  Fest.test "DB view query workflow preserves reference date and empty matching"
    (fun () ->
      let journal = entity [ ("block/journal-day", Number 20240101.) ] in
      let match_journal = entity [ ("block/journal-day", Number 20240201.) ] in
      let row =
        match row_a with
        | Entity entries ->
            Entity (Array.append entries [| ("user.property/date", journal) |])
        | _ -> invalid_arg "row"
      in
      let selected =
        View_query_workflow.filter_entities_with capabilities
          ~filters:
            (filters
               [
                 clause
                   (keyword "user.property/status")
                   "is"
                   (collection [ Uuid "open" ]);
                 clause
                   (keyword "user.property/owner")
                   "is"
                   (collection [ Uuid "alice" ]);
                 clause (keyword "user.property/missing") "is" (keyword "empty");
                 clause
                   (keyword "user.property/date")
                   "date-before" match_journal;
               ])
          ~input:"" (Rrbvec.singleton row)
      in
      expect_equal "reference row" (ids selected) [ Number 1. ]);
  Fest.test
    "DB view query workflow handles OR nil clauses and invalid operators"
    (fun () ->
      let selected =
        View_query_workflow.filter_entities_with capabilities
          ~filters:
            (filters ~or_:true
               [
                 clause
                   (keyword "user.property/score")
                   "number-gt" (Number 100.);
                 clause (keyword "user.property/score") "is" Nil;
               ])
          ~input:""
          (Rrbvec.of_list [ row_a; row_b ])
      in
      expect_equal "nil clause" (ids selected) [ Number 1.; Number 2. ];
      expect_invalid "operator" (fun () ->
          View_query_workflow.filter_entities_with capabilities
            ~filters:
              (filters
                 [
                   clause
                     (keyword "user.property/score")
                     "unsupported" (Number 1.);
                 ])
            ~input:"" (Rrbvec.singleton row_a)));
  Fest.test "DB view query workflow selects explicit and fallback properties"
    (fun () ->
      let explicit_query =
        collection
          [
            keyword "find";
            collection
              [
                Symbol "pull";
                Symbol "?entity";
                collection
                  [ keyword "block/title"; keyword "user.property/score" ];
              ];
          ]
      in
      expect_equal "explicit"
        (View_query_workflow.query_properties_with capabilities
           ~query:explicit_query
           ~entities:(Rrbvec.of_list [ row_a; row_b ])
        |> Rrbvec.to_list)
        [ keyword "block/title"; keyword "user.property/score" ];
      let wildcard_query =
        collection
          [
            keyword "find";
            collection
              [ Symbol "pull"; Symbol "?entity"; collection [ Symbol "*" ] ];
          ]
      in
      expect_equal "wildcard fallback"
        (View_query_workflow.query_properties_with capabilities
           ~query:wildcard_query
           ~entities:
             (Rrbvec.of_list
                [
                  entity
                    [
                      ("block/title", Text "A");
                      ("user.property/score", Number 1.);
                    ];
                  entity
                    [
                      ("block/title", Text "B");
                      ("user.property/enabled", Bool true);
                    ];
                ])
        |> Rrbvec.to_list)
        [
          keyword "block/title";
          keyword "user.property/score";
          keyword "user.property/enabled";
        ])
