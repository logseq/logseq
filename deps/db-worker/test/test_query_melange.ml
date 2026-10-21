(* Melange/node tests for the ported query modules — the pure-function
   surface (pre-transform, simplify-query, query-input-value,
   resolve-page-ref-equality, rules helpers) mirrored from
   query_dsl_test.cljs plus the endpoint registrations. *)

open Datascript

let repo = "test/melange-query-graph"

let () =
  Fest.test "pre-transform" (fun () ->
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
          Fest.expect |> Fest.deep_equal (Db_query_dsl.pre_transform input) expected)
        cases);

  Fest.test "simplify-query" (fun () ->
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
          let simplified = Db_query_dsl.simplify_query (Parser.read_edn input) in
          Fest.expect
          |> Fest.deep_equal (Ds_wire.edn_of_query_form simplified) expected)
        cases);

  Fest.test "query-input-value" (fun () ->
      let of_wire v = Endpoint_query.query_input_value (Wire.String v) in
      Fest.expect |> Fest.deep_equal (of_wire ":today") (Keyword "today");
      Fest.expect |> Fest.deep_equal (of_wire "123") (Int64 123L);
      Fest.expect |> Fest.deep_equal (of_wire "+5d") (String "+5d");
      Fest.expect |> Fest.deep_equal (of_wire "[[foo]]") (String "[[foo]]");
      Fest.expect |> Fest.deep_equal (of_wire "\\a") (String "\\a");
      Fest.expect |> Fest.deep_equal (of_wire "(1 2)") (List [ Int64 1L; Int64 2L ]));

  Fest.test "resolve-page-ref-equality" (fun () ->
      let rewritten =
        Endpoint_query.resolve_page_ref_equality
          (QueryFormList
             [ QueryFormSymbol "="; QueryFormSymbol "?t";
               QueryFormString "[[Foo Bar]]" ])
      in
      Fest.expect
      |> Fest.deep_equal (Ds_wire.edn_of_query_form rewritten)
           "(contains? ?t \"foo bar\")");

  Fest.test "rules helpers" (fun () ->
      let where =
        match Parser.read_edn "[(between ?b ?start ?end) [?b :block/title ?t]]" with
        | QueryFormVector xs -> xs
        | _ -> assert false
      in
      Fest.expect
      |> Fest.deep_equal
           (Db_query_dsl.find_rules_in_where where
              (List.map fst Db_query_dsl.db_query_dsl_rules))
           [ "between" ];
      let extracted = Db_query_dsl.extract_rules [ "task" ] in
      let edn =
        String.concat " " (List.map Ds_wire.edn_of_query_form extracted)
      in
      Fest.expect
      |> Fest.deep_equal (Js.String.includes ~search:"(task ?b ?statuses)" edn) true;
      let q =
        match Parser.read_edn "[:find ?b :in $ ?x :where [?b :a ?x]]" with
        | QueryFormVector xs -> xs
        | _ -> assert false
      in
      let q' =
        Db_query_dsl.add_to_end_of_query_section q "in"
          [ QueryFormSymbol "%" ]
      in
      Fest.expect
      |> Fest.deep_equal
           (Ds_wire.edn_of_query_form (QueryFormVector q'))
           "[:find ?b :in $ ?x % :where [?b :a ?x]]");

  Fest.test "endpoints registered" (fun () ->
      ignore Endpoint_query.query_dsl_query;
      ignore Endpoint_query.query_dsl_custom_query;
      ignore Endpoint_query.task_spent_time;
      ignore Endpoint_query.resolve_query_inputs;
      ignore Endpoint_query.query_custom;
      Worker_core.init ();
      Fest.expect
      |> Fest.deep_equal (Dispatcher.registered "thread-api/query-dsl-query") true;
      Fest.expect
      |> Fest.deep_equal (Dispatcher.registered "thread-api/query-custom") true;
      Fest.expect
      |> Fest.deep_equal (Dispatcher.registered "thread-api/task-spent-time") true;
      Fest.expect
      |> Fest.deep_equal (Dispatcher.registered "thread-api/resolve-query-inputs")
           true)
