open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let names entries = entries |> Rrbvec.map Rules.entry_name |> Rrbvec.to_array

let () =
  Fest.test "Datalog rule catalogs preserve legacy key order" (fun () ->
      expect_equal "rules" (names Rules.rules)
        [| "parent"; "class-extends"; "alias"; "self-ref"; "has-ref" |];
      expect_equal "DB query DSL rules"
        (names Rules.db_query_dsl_rules)
        [|
          "has-ref";
          "class-extends";
          "ref-property-value";
          "tags";
          "has-simple-query-property";
          "has-private-simple-query-property";
          "scalar-property-with-default";
          "self-ref";
          "scalar-property";
          "parent";
          "private-scalar-property-with-default";
          "task";
          "property";
          "private-scalar-property";
          "ref-property-with-default";
          "block-content";
          "property-missing-value";
          "between";
          "page";
          "object-has-class-property";
          "page-ref";
          "alias";
          "priority";
          "ref-property";
          "has-property";
          "ref->val";
          "scalar-property-value-with-default";
          "private-ref-property";
          "has-property-or-object-property";
          "private-ref-property-with-default";
          "scalar-property-value";
          "ref-property-value-with-default";
        |]);
  Fest.test "Datalog rule forms retain symbols keywords lists and vectors"
    (fun () ->
      let self_ref = Rrbvec.nth Rules.rules 3 |> Rules.entry_body in
      expect_equal "self-ref form" self_ref
        (Rules.Vector_form
           (Rrbvec.of_array
              [|
                Rules.List_form
                  (Rrbvec.of_array
                     [|
                       Rules.Symbol "self-ref";
                       Rules.Symbol "?b";
                       Rules.Symbol "?ref";
                     |]);
                Rules.Vector_form
                  (Rrbvec.of_array
                     [|
                       Rules.Symbol "?b";
                       Rules.Keyword "block/refs";
                       Rules.Symbol "?ref";
                     |]);
              |])));
  Fest.test "Datalog dependency closure is typed and transitive" (fun () ->
      expect_equal "task dependencies"
        (Rules.full_dependencies
           (Rrbvec.of_array [| "task" |])
           Rules.rules_dependencies
        |> Rrbvec.to_array)
        [|
          "task";
          "ref-property-with-default";
          "ref-property-value-with-default";
          "ref-property-value";
          "property-missing-value";
          "ref->val";
          "object-has-class-property";
          "class-extends";
        |]);
  Fest.test "Query rule extraction flattens multi-branch rule bodies" (fun () ->
      let rules =
        Rules.extract_query_rules
          (Rrbvec.singleton "has-property-or-object-property")
        |> Rrbvec.to_array
      in
      expect_equal "property rule count" (Array.length rules) 4;
      Array.iter
        (function
          | Rules.Vector_form children -> (
              match Rrbvec.nth children 0 with
              | Rules.List_form _ -> ()
              | _ -> failwith "query rule is missing a rule head")
          | _ -> failwith "query rule is not a vector")
        rules)
