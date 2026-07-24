module Page_ref = Melange_common.Page_ref
module Block_ref = Melange_common.Block_ref

let fail message =
  Fest.expect |> Fest.equal message "";
  failwith message

let expect_equal label actual expected =
  if actual <> expected then fail (label ^ ": unexpected value")

let () =
  Fest.test
    "page reference constants and regular expressions preserve CLJS values"
    (fun () ->
      expect_equal "left brackets" Page_ref.left_brackets "[[";
      expect_equal "right brackets" Page_ref.right_brackets "]]";
      expect_equal "combined brackets" Page_ref.left_and_right_brackets "[[]]";
      expect_equal "page ref regex" Page_ref.page_ref_pattern
        "\\[\\[(.*?)\\]\\]";
      expect_equal "non-nested page ref regex"
        Page_ref.page_ref_without_nested_pattern "\\[\\[([^\\[\\]]+)\\]\\]";
      expect_equal "any page ref regex" Page_ref.page_ref_any_pattern
        "\\[\\[(.*)\\]\\]";
      expect_equal "markdown page ref regex" Page_ref.markdown_page_ref_pattern
        "\\[(.*)\\]\\(file:.*\\)");

  Fest.test "page references preserve wrapping and permissive boundary checks"
    (fun () ->
      [|
        ("[[page]]", true);
        ("[[another page]]", true);
        ("[[some [[nested]] page]]", true);
        ("[[]]", true);
        ("[[ ]]", true);
        ("[[a]] [[b]]", true);
        ("[single bracket]", false);
        ("no brackets", false);
        ("x[[page]]", false);
        ("[[page]]x", false);
        ("", false);
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Page_ref.is_page_ref input) expected);
      [| ("page", "[[page]]"); ("", "[[]]"); ("页面", "[[页面]]") |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Page_ref.to_page_ref input) expected));

  Fest.test
    "page reference names preserve markdown nested and fallback behavior"
    (fun () ->
      [|
        ("[[page]]", Some "page");
        ("[[some [[nested]] page]]", Some "some [[nested]] page");
        ("[[]]", Some "");
        ("[[ ]]", Some " ");
        ("[[a]][[b]]", Some "a]][[b");
        ("[ label ](file:path)", Some "label");
        ("[](file:path)", Some "");
        ("[label](file:)", Some "label");
        (" [label] (file:path) ", None);
        ("no ref", None);
        ("[[page]]suffix", None);
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Page_ref.get_page_name input) expected);
      [|
        ("[[page]]", "page");
        ("[ label ](file:path)", "label");
        ("no ref", "no ref");
        ("", "");
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Page_ref.get_page_name_or_self input) expected));

  Fest.test "page reference scanning preserves ordered duplicate matches"
    (fun () ->
      [|
        ("before [[one]] after [[two words]]", [| "one"; "two words" |]);
        ("[[same]] and [[same]]", [| "same"; "same" |]);
        ("{{macro [[ignored]]}}", [||]);
        ("plain text", [||]);
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input
            (Page_ref.matched_names input |> Rrbvec.to_array)
            expected));

  Fest.test "file basenames preserve POSIX plus and Unicode behavior" (fun () ->
      [|
        ("", None);
        ("   ", None);
        ("/a/b/c.md", Some "c.md");
        ("a+b+c.md", Some "c.md");
        ("页面+文档.md", Some "文档.md");
        ("C:\\Users\\alice\\file.md", Some "C:\\Users\\alice\\file.md");
        ("/a/.hidden", Some ".hidden");
        ("/a/b/", Some "b");
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Page_ref.get_file_basename input) expected));

  Fest.test "block reference constants and UUID extraction preserve CLJS values"
    (fun () ->
      expect_equal "left parens" Block_ref.left_parens "((";
      expect_equal "right parens" Block_ref.right_parens "))";
      expect_equal "combined parens" Block_ref.left_and_right_parens "(())";
      expect_equal "block ref regex" Block_ref.block_ref_pattern
        "\\(\\(([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})\\)\\)";
      [|
        ( "((550e8400-e29b-41d4-a716-446655440000))",
          Some "550e8400-e29b-41d4-a716-446655440000" );
        ( "((550E8400-E29B-41D4-A716-446655440000))",
          Some "550E8400-E29B-41D4-A716-446655440000" );
        ("((550e8400-e29b-41d4-a716-44665544000g))", None);
        ("((123))", None);
        ("x((550e8400-e29b-41d4-a716-446655440000))", None);
        ("", None);
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Block_ref.get_block_ref_id input) expected));

  Fest.test "loose block references preserve substring and wrapping behavior"
    (fun () ->
      [|
        ("((123))", "123");
        ("(())", "");
        ("((页面))", "页面");
        ("", "");
        ("abc", "b");
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Block_ref.get_string_block_ref_id input) expected);
      [|
        ("((123))", true);
        ("(())", true);
        ("((页面))", true);
        ("((a))suffix", false);
        ("prefix((a))", false);
        ("", false);
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Block_ref.is_string_block_ref input) expected);
      [|
        ( "550e8400-e29b-41d4-a716-446655440000",
          "((550e8400-e29b-41d4-a716-446655440000))" );
        ("123", "((123))");
        ("页面", "((页面))");
        ("", "(())");
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Block_ref.to_block_ref input) expected))
