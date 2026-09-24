(* Tests for the ported query stack:

   - shared-query-dsl/pre-transform + simplify-query, mirroring
     frontend.db.query-dsl-test/pre-transform-test and simplify-query
     (src/test/frontend/db/query_dsl_test.cljs)
   - db-inputs/resolve-input, mirroring
     logseq.db.frontend.inputs-test (deps/db/test/logseq/db/frontend/inputs_test.cljs)
   - the thread-api endpoints in endpoint_query.ml over a real conn. *)

open Datascript

let failures = ref 0

let check name cond =
  if cond then Printf.printf "ok - %s\n" name
  else begin
    incr failures;
    Printf.printf "FAIL - %s\n%!" name
  end

let string_contains haystack needle =
  let hl = String.length haystack and nl = String.length needle in
  let rec go i =
    if i + nl > hl then false
    else if String.sub haystack i nl = needle then true
    else go (i + 1)
  in
  go 0

let await task =
  let result = ref None in
  Db_worker_effect.on_any task (fun v -> result := Some (Ok v)) (fun e -> result := Some (Error e));
  match !result with
  | Some (Ok v) -> v
  | Some (Error e) -> raise e
  | None -> failwith "task still pending"

(* ---- schema + fixture data (subset of the logseq db schema needed by
   the query paths under test) ---- *)

let repo = "test/query-graph"

let schema_edn =
  "{:db/ident {:db/unique :db.unique/identity}
    :block/name {:db/unique :db.unique/identity}
    :block/uuid {:db/unique :db.unique/identity}
    :block/title {}
    :block/parent {:db/valueType :db.type/ref}
    :block/page {:db/valueType :db.type/ref}
    :block/tags {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
    :block/refs {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
    :block/alias {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
    :block/created-at {}
    :block/journal-day {}
    :block/link {:db/valueType :db.type/ref}
    :db/valueType {}
    :logseq.property/status {:db/valueType :db.type/ref}
    :logseq.property/type {}
    :logseq.property/public? {}
    :logseq.property/built-in? {}
    :logseq.property/value {}
    :logseq.property/scalar-default-value {}
    :logseq.property/default-value {:db/valueType :db.type/ref}
    :logseq.property.class/properties {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
    :logseq.property.class/extends {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
    :logseq.property.history/block {:db/valueType :db.type/ref}
    :logseq.property.history/property {:db/valueType :db.type/ref}
    :logseq.property.history/ref-value {:db/valueType :db.type/ref}}"

let uuid_b1 = "11111111-1111-1111-1111-111111111111"

let fixture_edn today_day =
  Printf.sprintf
    "[{:db/ident :logseq.class/Journal}
      {:db/ident :logseq.class/Tag}
      {:db/ident :logseq.class/Property}
      {:db/ident :logseq.class/Task}
      {:db/ident :logseq.class/Card}
      {:db/ident :logseq.property/status
       :block/title \"status\"
       :block/tags [:logseq.class/Property]
       :db/valueType :db.type/ref
       :db/cardinality :db.cardinality/one}
      {:db/ident :logseq.property/status.todo :block/title \"Todo\"}
      {:db/ident :logseq.property/status.doing :block/title \"Doing\"}
      {:db/ident :logseq.property/status.done :block/title \"Done\"}
      {:db/id -101 :block/name \"page1\" :block/title \"page1\"}
      {:db/id -102 :block/name \"page two\" :block/title \"Page Two\"}
      {:db/id -1 :block/title \"b1 content\" :block/page -101
       :block/uuid #uuid \"%s\"}
      {:db/id -2 :block/title \"b2 content\" :block/page -101}
      {:db/id -3 :block/title \"b3 links\" :block/page -101 :block/refs [-102]}
      {:db/id -4 :block/title \"task one\" :block/page -101
       :block/tags [:logseq.class/Task]
       :logseq.property/status :logseq.property/status.todo}
      {:db/id -103 :block/name \"today journal\" :block/title \"today journal\"
       :block/journal-day %d :block/tags [:logseq.class/Journal]}
      {:db/id -5 :block/title \"journal block\" :block/page -103}
      {:db/id -9 :block/title \"child\" :block/page -101 :block/parent -1
       :block/uuid #uuid \"22222222-2222-2222-2222-222222222222\"}
      {:db/id -201 :logseq.property.history/block -1
       :logseq.property.history/property :logseq.property/status
       :logseq.property.history/ref-value :logseq.property/status.doing
       :block/created-at 1000}
      {:db/id -202 :logseq.property.history/block -1
       :logseq.property.history/property :logseq.property/status
       :logseq.property.history/ref-value :logseq.property/status.done
       :block/created-at 2000}]"
    uuid_b1 today_day

(* ---- pre-transform (mirroring pre-transform-test) ---- *)

let () =
  let cases =
    [
      ("#foo", "#tag foo");
      ("(and #foo)", "(and #tag foo)");
      ("[[test #foo]]", "\"[[test #foo]]\"");
      ("(and [[test #foo]] (or #foo))", "(and \"[[test #foo]]\" (or #tag foo))");
      ("\"for #clojure\"", "\"for #clojure\"");
      ("(and \"for #clojure\")", "(and \"for #clojure\")");
      ("(and \"for #clojure\" #foo)", "(and \"for #clojure\" #tag foo)");
      ( "(and [[outside]] (property prop \"2 [[6a8ead3b-a450-4916-a7e2-d16d0d2b59fd]]\"))",
        "(and \"[[outside]]\" (property prop \"2 [[6a8ead3b-a450-4916-a7e2-d16d0d2b59fd]]\"))" );
    ]
  in
  List.iter
    (fun (input, expected) ->
      check
        (Printf.sprintf "pre-transform %s" input)
        (Db_query_dsl.pre_transform input = expected))
    cases

(* ---- simplify-query (mirroring simplify-query deftest) ---- *)

let () =
  let cases =
    [
      ("(and [[foo]])", "[[foo]]");
      ("(and (and [[foo]]))", "[[foo]]");
      ("(and (or [[foo]]))", "[[foo]]");
      ("(and (not [[foo]]))", "(not [[foo]])");
      ("(and (or (and [[foo]])))", "[[foo]]");
      ("(not (or [[foo]]))", "(not [[foo]])");
    ]
  in
  List.iter
    (fun (input, expected) ->
      let simplified =
        Db_query_dsl.simplify_query (Parser.read_edn input)
      in
      check
        (Printf.sprintf "simplify %s" input)
        (Ds_wire.edn_of_query_form simplified = expected))
    cases

(* ---- query-input-value ---- *)

let () =
  let of_wire v = Endpoint_query.query_input_value (Wire.String v) in
  check "query-input-value :today" (of_wire ":today" = Keyword "today");
  check "query-input-value 123" (of_wire "123" = Int 123);
  check "query-input-value +5d symbol stays string"
    (of_wire "+5d" = String "+5d");
  check "query-input-value page-ref stays string"
    (of_wire "[[foo]]" = String "[[foo]]");
  check "query-input-value char literal stays string"
    (of_wire "\\a" = String "\\a");
  check "query-input-value list parses"
    (of_wire "(1 2)" = List [ Int 1; Int 2 ])

(* ---- resolve-page-ref-equality ---- *)

let () =
  let rewritten =
    Endpoint_query.resolve_page_ref_equality
      (QueryFormList
         [ QueryFormSymbol "="; QueryFormSymbol "?t";
           QueryFormString "[[Foo Bar]]" ])
  in
  check "resolve-page-ref-equality rewrites ="
    (Ds_wire.edn_of_query_form rewritten = "(contains? ?t \"foo bar\")")

(* ---- find-rules-in-where / extract-rules / add-to-end-of-query-section ---- *)

let () =
  let where =
    match Parser.read_edn "[(between ?b ?start ?end) [?b :block/title ?t]]" with
    | QueryFormVector xs -> xs
    | _ -> assert false
  in
  let found =
    Db_query_dsl.find_rules_in_where where
      (List.map fst Db_query_dsl.db_query_dsl_rules)
  in
  check "find-rules-in-where finds between" (found = [ "between" ]);
  let extracted = Db_query_dsl.extract_rules [ "task" ] in
  let edn = String.concat " " (List.map Ds_wire.edn_of_query_form extracted) in
  check "extract-rules task pulls deps"
    (string_contains edn "(task ?b ?statuses)"
    && string_contains edn "ref-property-with-default"
    && string_contains edn "ref-property-value"
    && string_contains edn "ref->val");
  let q =
    match Parser.read_edn "[:find ?b :in $ ?x :where [?b :a ?x]]" with
    | QueryFormVector xs -> xs
    | _ -> assert false
  in
  let q' =
    Db_query_dsl.add_to_end_of_query_section q "in" [ QueryFormSymbol "%" ]
  in
  check "add-to-end-of-query-section"
    (Ds_wire.edn_of_query_form (QueryFormVector q')
     = "[:find ?b :in $ ?x % :where [?b :a ?x]]")

(* ---- db fixture for db-inputs + endpoint tests ---- *)

let conn =
  let schema = Datascript.schema_of_edn_string schema_edn in
  let conn = Datascript.create_conn ~schema () in
  let today = Date_time_util.date_to_int (Date_time_util.today_ms ()) in
  ignore (Datascript.transact_conn_string conn (fixture_edn today));
  conn

let db = Datascript.db conn

(* ---- db-inputs/resolve-input (mirroring inputs_test.cljs) ---- *)

let () =
  let resolve input ctx = Db_inputs.resolve_input db input ctx in
  let empty_ctx =
    { Db_inputs.current_block_uuid = None; current_page_fn = (fun () -> None) }
  in
  (* :current-page resolves via current-page-fn, lower-cased *)
  check "resolve-input :current-page"
    (resolve (Keyword "current-page")
       { empty_ctx with current_page_fn = (fun () -> Some "Page1") }
     = String "page1");
  (* :query-page resolves to the current block's page :block/name *)
  let qp =
    resolve (Keyword "query-page")
      { empty_ctx with current_block_uuid = Some uuid_b1 }
  in
  check "resolve-input :query-page" (qp = String "page1");
  (* :current-block resolves to the block's :db/id *)
  let b1_id =
    match entity db (Lookup_ref ("block/uuid", Uuid uuid_b1)) with
    | Some e -> e.id
    | None -> -1
  in
  check "resolve-input :current-block"
    (resolve (Keyword "current-block")
       { empty_ctx with current_block_uuid = Some uuid_b1 }
     = Int b1_id);
  (* :parent-block resolves to the parent block's :db/id *)
  check "resolve-input :parent-block"
    (resolve (Keyword "parent-block")
       { empty_ctx with
         current_block_uuid = Some "22222222-2222-2222-2222-222222222222" }
     = Int b1_id);
  (* :today resolves to a journal-day int *)
  check "resolve-input :today"
    (match Db_inputs.resolve_input db (Keyword "today") empty_ctx with
     | Int d -> d = Date_time_util.date_to_int (Date_time_util.today_ms ())
     | _ -> false);
  (* :-7d relative date *)
  check "resolve-input :-7d"
    (match Db_inputs.resolve_input db (Keyword "-7d") empty_ctx with
     | Int d ->
         d = Date_time_util.date_to_int
               (Date_time_util.minus Date_time_util.Days 7
                  (Date_time_util.today_ms ()))
     | _ -> false);
  (* [[page-ref]] string resolves to lower-cased page name *)
  check "resolve-input [[My Page]]"
    (Db_inputs.resolve_input db (String "[[My Page]]") empty_ctx
     = String "my page");
  (* unknown keyword passes through *)
  check "resolve-input passthrough"
    (Db_inputs.resolve_input db (Keyword "nonsense") empty_ctx
     = Keyword "nonsense")

(* ---- thread-api endpoints (force-link Endpoint_query) ---- *)

let () =
  ignore Endpoint_query.query_dsl_query;
  ignore Endpoint_query.query_dsl_custom_query;
  ignore Endpoint_query.task_spent_time;
  ignore Endpoint_query.resolve_query_inputs;
  ignore Endpoint_query.query_custom;
  Worker_state.set_datascript_conn repo conn;
  let invoke name args =
    await (Dispatcher.invoke_transit name (Transit_codec.to_string (Wire.Array args)))
  in
  let kw s = Wire.Keyword s in

  (* query-dsl-query: block-content *)
  let res =
    invoke "thread-api/query-dsl-query"
      [ Wire.String repo; Wire.String "\"b1\""; Wire.nil ]
  in
  check "query-dsl-query block-content"
    (string_contains res "b1 content" && not (string_contains res "b2 content"));

  (* query-dsl-query: page-ref -> self-ref finds the referencing block *)
  let res =
    invoke "thread-api/query-dsl-query"
      [ Wire.String repo; Wire.String "[[Page Two]]"; Wire.nil ]
  in
  check "query-dsl-query page-ref"
    (string_contains res "b3 links" && not (string_contains res "b1 content"));

  (* query-dsl-query: task *)
  let res =
    invoke "thread-api/query-dsl-query"
      [ Wire.String repo; Wire.String "(task todo)"; Wire.nil ]
  in
  check "query-dsl-query task"
    (string_contains res "task one" && not (string_contains res "b1 content"));

  (* query-dsl-query: and/or/not *)
  let res =
    invoke "thread-api/query-dsl-query"
      [ Wire.String repo; Wire.String "(and \"b1\" (not \"b2\"))"; Wire.nil ]
  in
  check "query-dsl-query and-not"
    (string_contains res "b1 content" && not (string_contains res "b2 content"));

  (* query-dsl-custom-query *)
  let res =
    invoke "thread-api/query-dsl-custom-query"
      [ Wire.String repo;
        Wire.Map
          [ (kw "query", Wire.Array [ Wire.Symbol "and"; Wire.String "b1" ]) ];
        Wire.nil ]
  in
  check "query-dsl-custom-query"
    (string_contains res "b1 content" && not (string_contains res "b2 content"));

  (* resolve-query-inputs *)
  let res =
    invoke "thread-api/resolve-query-inputs"
      [ Wire.String repo;
        Wire.Array
          [ kw "current-page"; Wire.String "[[My Page]]"; Wire.Int 123;
            Wire.String "plain" ];
        Wire.Map [ (kw "current-page-title", Wire.String "Page1") ] ]
  in
  check "resolve-query-inputs"
    (string_contains res "page1" && string_contains res "my page"
    && string_contains res "123" && string_contains res "plain");

  (* query-custom: plain find *)
  let res =
    invoke "thread-api/query-custom"
      [ Wire.String repo;
        Wire.Map
          [ ( kw "query",
              Wire.Array
                [ kw "find"; Wire.Symbol "?t"; kw "where";
                  Wire.Array
                    [ Wire.Symbol "?b"; kw "block/title"; Wire.Symbol "?t" ] ] ) ];
        Wire.Map [] ]
  in
  check "query-custom plain"
    (string_contains res "b1 content" && string_contains res "task one");

  (* query-custom: invalid context -> fail!'s synchronous throw escapes
     remoteInvoke as a rejection (cljs remote-function re-throws handler
     sync throws instead of resolving to error transit) *)
  let msg =
    try
      ignore
        (invoke "thread-api/query-custom"
           [ Wire.String repo;
             Wire.Map
               [ ( kw "query",
                   Wire.Array [ kw "find"; Wire.Symbol "?b"; kw "where" ] ) ];
             Wire.Map [ (kw "bogus", Wire.String "x") ] ]);
      "no-error"
    with
    | Dispatcher.Exn_info (msg, _) -> msg
    | _ -> "other-error"
  in
  check "query-custom invalid context errors"
    (string_contains msg "Invalid custom query context");

  (* query-custom: built-in :between rule + :today input *)
  let res =
    invoke "thread-api/query-custom"
      [ Wire.String repo;
        Wire.Map
          [ ( kw "query",
              Wire.Array
                [ kw "find"; Wire.Symbol "?b"; kw "in"; Wire.Symbol "$";
                  Wire.Symbol "?start"; Wire.Symbol "?end"; kw "where";
                  Wire.Array
                    [ Wire.Symbol "between"; Wire.Symbol "?b";
                      Wire.Symbol "?start"; Wire.Symbol "?end" ] ] );
            ( kw "inputs",
              Wire.Array [ kw "today"; kw "today" ] ) ];
        Wire.Map [] ]
  in
  let jblock_id =
    match
      Datascript.q_string (Datascript.db conn)
        "[:find ?e :where [?e :block/title \"journal block\"]]"
    with
    | [ [ Result_entity id ] ] -> id
    | [ [ Result_value (Int id) ] ] -> id
    | _ -> -999
  in
  check "query-custom between rule + :today"
    (res = Printf.sprintf "[[%d]]" jblock_id);

  (* task-spent-time *)
  let b1_id =
    match entity db (Lookup_ref ("block/uuid", Uuid uuid_b1)) with
    | Some e -> e.id
    | None -> -1
  in
  let res =
    invoke "thread-api/task-spent-time" [ Wire.String repo; Wire.Int b1_id ]
  in
  check "task-spent-time"
    (string_contains res "logseq.property/status.doing"
    && string_contains res "logseq.property/status.done"
    && string_contains res "Doing");

  (* get-date-scheduled-or-deadlines: scheduled-in-range todo is grouped under
     its page; done and canceled blocks are filtered out *)
  ignore Endpoint_property.get_date_scheduled_or_deadlines_endpoint;
  ignore
    (Datascript.transact_conn_string conn
       "[{:db/ident :logseq.property/status.canceled :block/title \"Canceled\"}
         {:db/id -301 :block/title \"sched ok\" :block/page [:block/name \"page1\"]
          :logseq.property/scheduled #inst \"2026-09-20T00:00:00.000Z\"
          :logseq.property/status :logseq.property/status.todo}
         {:db/id -302 :block/title \"sched done\" :block/page [:block/name \"page1\"]
          :logseq.property/scheduled #inst \"2026-09-20T00:00:00.000Z\"
          :logseq.property/status :logseq.property/status.done}
         {:db/id -303 :block/title \"dl canceled\" :block/page [:block/name \"page1\"]
          :logseq.property/deadline #inst \"2026-09-20T00:00:00.000Z\"
          :logseq.property/status :logseq.property/status.canceled}]");
  let res =
    invoke "thread-api/get-date-scheduled-or-deadlines"
      [ Wire.String repo; Wire.Int 0; Wire.Int 1800000000000 ]
  in
  check "get-date-scheduled-or-deadlines returns grouped result"
    (string_contains res "sched ok"
    && not (string_contains res "sched done")
    && not (string_contains res "dl canceled"));

  if !failures > 0 then begin
    Printf.printf "%d failures\n%!" !failures;
    exit 1
  end else Printf.printf "all query tests passed\n"
