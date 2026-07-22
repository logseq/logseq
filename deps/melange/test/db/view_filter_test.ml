open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let values items = Rrbvec.of_list items

let () =
  Fest.test "DB view filters evaluate text operators" (fun () ->
      expect_equal "contains normalized"
        (View_filter.text_contains (values [ "alphabeta"; "gamma" ]) "hab")
        true;
      expect_equal "missing text"
        (View_filter.text_contains (values [ "alpha" ]) "z")
        false;
      expect_equal "not contains is case-sensitive"
        (View_filter.text_not_contains (values [ "AlphaBeta" ]) "hab")
        true;
      expect_equal "not contains rejects a hit"
        (View_filter.text_not_contains (values [ "AlphaBeta" ]) "Beta")
        false);
  Fest.test "DB view filters evaluate numeric operators and ranges" (fun () ->
      let numbers = values [ 2.; 10. ] in
      expect_equal "gt" (View_filter.number_match Gt numbers 9.) true;
      expect_equal "gte" (View_filter.number_match Gte numbers 10.) true;
      expect_equal "lt" (View_filter.number_match Lt numbers 3.) true;
      expect_equal "lte" (View_filter.number_match Lte numbers 2.) true;
      expect_equal "between hit"
        (View_filter.between numbers ~start:(Some 2.) ~end_:(Some 9.))
        true;
      expect_equal "between miss"
        (View_filter.between numbers ~start:(Some 3.) ~end_:(Some 9.))
        false;
      expect_equal "open range"
        (View_filter.between numbers ~start:None ~end_:(Some 2.))
        true);
  Fest.test "DB view filters evaluate boolean empty and membership operators"
    (fun () ->
      expect_equal "boolean is"
        (View_filter.boolean_match ~negated:false ~value:false ~expected:false)
        true;
      expect_equal "boolean is not"
        (View_filter.boolean_match ~negated:true ~value:false ~expected:true)
        true;
      expect_equal "empty is"
        (View_filter.empty_match ~negated:false ~empty:true)
        true;
      expect_equal "empty is not"
        (View_filter.empty_match ~negated:true ~empty:true)
        false;
      expect_equal "membership hit"
        (View_filter.membership_match ~negated:false ~match_empty:false
           ~hit:true)
        true;
      expect_equal "empty match is neutral"
        (View_filter.membership_match ~negated:true ~match_empty:true ~hit:false)
        true);
  Fest.test "DB view filters evaluate timestamps and clause composition"
    (fun () ->
      expect_equal "before inclusive"
        (View_filter.timestamp_match ~before:true ~value:(Some 1000.)
           ~target:(Some 1000.))
        true;
      expect_equal "after inclusive"
        (View_filter.timestamp_match ~before:false ~value:(Some 1000.)
           ~target:(Some 1000.))
        true;
      expect_equal "missing value"
        (View_filter.timestamp_match ~before:true ~value:None
           ~target:(Some 1000.))
        false;
      expect_equal "missing target keeps a present value"
        (View_filter.timestamp_match ~before:true ~value:(Some 1000.)
           ~target:None)
        true;
      expect_equal "all"
        (View_filter.combine ~or_:false (values [ true; false ]))
        false;
      expect_equal "any"
        (View_filter.combine ~or_:true (values [ false; true ]))
        true;
      expect_equal "empty all" (View_filter.combine ~or_:false (values [])) true;
      expect_equal "empty any" (View_filter.combine ~or_:true (values [])) false)
