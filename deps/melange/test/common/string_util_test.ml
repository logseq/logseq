module String_util = Melange_common.String_util
module Regexp_runtime = Melange_common_runtime.Common_runtime.Regexp_runtime
module Util = Melange_common.Util

let fail message =
  Fest.expect |> Fest.equal message "";
  failwith message

let expect_equal label actual expected =
  if actual <> expected then fail (label ^ ": unexpected value")

let expect_raises label f =
  match f () with
  | _ -> fail (label ^ ": expected an exception")
  | exception _ -> ()

let () =
  let smile = Js.String.fromCharCodeMany [| 0xd83d; 0xde42 |] in
  Fest.test "first and last splits preserve missing empty and Unicode behavior"
    (fun () ->
      [|
        (":", "a:b:c", Some ("a", "b:c"));
        (":", "abc", None);
        ("", "abc", Some ("", "abc"));
        (smile, "a" ^ smile ^ "b", Some ("a", "b"));
      |]
      |> Array.iter (fun (pattern, value, expected) ->
          expect_equal value (String_util.split_first pattern value) expected);
      [|
        (":", "a:b:c", Some ("a:b", "c"));
        (":", "abc", None);
        ("", "abc", Some ("abc", ""));
        (smile, "a" ^ smile ^ "b" ^ smile ^ "c", Some ("a" ^ smile ^ "b", "c"));
      |]
      |> Array.iter (fun (pattern, value, expected) ->
          expect_equal value (String_util.split_last pattern value) expected));

  Fest.test "tag validation rejects hashes and line whitespace" (fun () ->
      [|
        ("", true);
        ("tag name", true);
        ("a#b", false);
        ("a\tb", false);
        ("a\rb", false);
        ("a\nb", false);
      |]
      |> Array.iter (fun (value, expected) ->
          expect_equal value (String_util.is_valid_tag value) expected));

  Fest.test
    "safe substrings preserve clamping endpoint swap and UTF-16 behavior"
    (fun () ->
      [| ("abc", 1, "bc"); ("abc", 8, ""); (smile ^ "a", 2, "a") |]
      |> Array.iter (fun (value, start, expected) ->
          expect_equal value (String_util.safe_substring value ~start) expected);
      [|
        ("abc", 1, 8, "bc");
        ("abc", 3, 1, "bc");
        (smile ^ "a", 0, 1, Js.String.fromCharCode 0xd83d);
        (smile ^ "a", 0, 2, smile);
      |]
      |> Array.iter (fun (value, start, end_, expected) ->
          expect_equal value
            (String_util.safe_substring_range value ~start ~end_)
            expected));

  Fest.test
    "quote and parenthesis predicates preserve short and Unicode behavior"
    (fun () ->
      [|
        ("", false, false);
        ("\"\"", true, false);
        ("\"x\"", true, false);
        ("(x)", false, true);
        ("(" ^ smile ^ ")", false, true);
        ("x", false, false);
      |]
      |> Array.iter (fun (value, quotes, parens) ->
          expect_equal value (String_util.is_wrapped_by_quotes value) quotes;
          expect_equal value (String_util.is_wrapped_by_parens value) parens));

  Fest.test "zero padding preserves numeric string formatting" (fun () ->
      [| (0, "00"); (9, "09"); (10, "10"); (-1, "0-1") |]
      |> Array.iter (fun (value, expected) ->
          expect_equal expected (String_util.zero_pad value) expected));

  Fest.test "markdown heading clearing preserves anchoring and whitespace"
    (fun () ->
      [|
        ("# Title", "Title");
        ("###\tTitle", "Title");
        ("#Title", "#Title");
        ("  # Title", "  # Title");
        ("##  Title", "Title");
        ("##\nTitle", "Title");
      |]
      |> Array.iter (fun (value, expected) ->
          expect_equal value (String_util.clear_markdown_heading value) expected));

  Fest.test "NFC normalization preserves path text without resolving segments"
    (fun () ->
      let combining_acute = Js.String.fromCharCode 0x0301 in
      let composed_e = Js.String.fromCharCode 0x00e9 in
      expect_equal "decomposed accent"
        (String_util.normalize_nfc ("cafe" ^ combining_acute))
        ("caf" ^ composed_e);
      expect_equal "path segments" (String_util.normalize_nfc "A/../B") "A/../B");

  Fest.test "boundary slash removal preserves one-pass behavior" (fun () ->
      [|
        ("", "");
        ("/", "");
        ("//", "");
        ("///", "/");
        ("/a/", "a");
        ("/a", "a");
        ("a/", "a");
        ("a", "a");
      |]
      |> Array.iter (fun (value, expected) ->
          expect_equal value
            (String_util.remove_boundary_slashes value)
            expected));

  Fest.test "namespace page splitting preserves cumulative untrimmed segments"
    (fun () ->
      [|
        ("", [| "" |]);
        ("a/", [| "a" |]);
        ("/a", [| ""; "/a" |]);
        (" a / b ", [| "a"; "a / b" |]);
        ("a//b", [| "a"; "a/"; "a//b" |]);
        ("page/child/end", [| "page"; "page/child"; "page/child/end" |]);
      |]
      |> Array.iter (fun (value, expected) ->
          expect_equal value
            (String_util.split_namespace_pages value |> Rrbvec.to_array)
            expected);
      expect_raises "separator only" (fun () ->
          String_util.split_namespace_pages "/"));

  Fest.test "page-name sanitation preserves slashes case and Unicode NFC"
    (fun () ->
      let combining_acute = Js.String.fromCharCode 0x0301 in
      let combining_dot_above = Js.String.fromCharCode 0x0307 in
      let composed_e = Js.String.fromCharCode 0x00e9 in
      let dotted_i = Js.String.fromCharCode 0x0130 in
      [|
        ("", "");
        ("/Foo/", "Foo");
        ("//", "");
        ("///", "/");
        ("cafe" ^ combining_acute, "caf" ^ composed_e);
      |]
      |> Array.iter (fun (value, expected) ->
          expect_equal value (String_util.page_name_sanity value) expected);
      expect_equal "lowercase"
        (String_util.page_name_sanity_lower "/FOO/")
        "foo";
      expect_equal "Unicode lowercase"
        (String_util.page_name_sanity_lower dotted_i)
        ("i" ^ combining_dot_above));

  Fest.test "capitalization preserves spaces and lowercases word tails"
    (fun () ->
      let e_acute = Js.String.fromCharCode 0x00e9 in
      let upper_e_acute = Js.String.fromCharCode 0x00c9 in
      [|
        ("", "");
        ("hELLO wORLD", "Hello World");
        ("a  b", "A  B");
        ("foo-bar", "Foo-bar");
        (e_acute ^ "COLE", upper_e_acute ^ "cole");
      |]
      |> Array.iter (fun (value, expected) ->
          expect_equal value (String_util.capitalize_all value) expected));

  Fest.test "URI decoding returns explicit failures without changing input"
    (fun () ->
      [|
        ("", Ok "");
        ("hello%20world", Ok "hello world");
        ("%E4%B8%AD", Ok (Js.String.fromCharCode 0x4e2d));
        ("%2F", Ok "/");
        ("%2520", Ok "%20");
        ("a+b", Ok "a+b");
        ("%", Error "%");
        ("%ZZ", Error "%ZZ");
        ("%E0%A4%A", Error "%E0%A4%A");
      |]
      |> Array.iter (fun (value, expected) ->
          expect_equal value (String_util.decode_uri_component value) expected));

  Fest.test "URL classification preserves origin-based browser behavior"
    (fun () ->
      [|
        ("", false);
        ("http://logseq.com", true);
        ("HTTPS://EXAMPLE.COM/a", true);
        ("ftp://x/a", true);
        ("custom://host/a", false);
        ("file:///tmp/a", false);
        ("assets:///a", false);
        ("memory:///a", false);
        ("mailto:help@x.com", false);
        ("data:text/plain,x", false);
        ("blob:https://example.com/id", true);
        ("//example.com/a", false);
        ("a:", false);
        ("prop:: value", false);
        ("http://a b", false);
        ("http://localhost:3000/a", true);
      |]
      |> Array.iter (fun (value, expected) ->
          expect_equal value (String_util.is_url value) expected));

  Fest.test "encoded URI pattern preserves case-insensitive first matches"
    (fun () ->
      [|
        ("abc", None);
        ("%2f", Some "%2f");
        ("%2F", Some "%2F");
        ("x%zz", None);
        ("%2f%3A", Some "%2f");
        ("%", None);
      |]
      |> Array.iter (fun (value, expected) ->
          let actual =
            Js.Re.exec ~str:value
              (Js.Re.fromStringWithFlags String_util.url_encoded_pattern_text
                 ~flags:"i")
            |> Option.map (fun result ->
                Js.Re.captures result |> fun captures ->
                captures.(0) |> Js.Nullable.toOption)
            |> Option.join
          in
          expect_equal value actual expected));

  Fest.test "format names preserve markdown alias and case" (fun () ->
      [|
        ("", "");
        ("md", "markdown");
        ("markdown", "markdown");
        ("MD", "MD");
        ("org", "org");
        ("foo/bar", "foo/bar");
        (":md", ":md");
      |]
      |> Array.iter (fun (value, expected) ->
          expect_equal value (String_util.normalize_format_name value) expected));

  Fest.test "path extensions preserve current regex and final segment behavior"
    (fun () ->
      [|
        ("", None);
        ("foo", None);
        ("foo.bar", Some "bar");
        ("foo.bar.baz", Some "baz");
        ("../assets/audio.mp3?t=10,20#t=10", Some "mp3");
        ("C:\\Users\\foo\\audio.MP3", Some "MP3");
        (".gitignore", Some "gitignore");
        ("foo.", None);
        ("a.foo-bar", Some "foo");
        ("a.7z", Some "7z");
        ("a.中文", None);
        ("dir.with.dot/file", None);
        ("file.mp3?x=.foo", Some "foo");
      |]
      |> Array.iter (fun (value, expected) ->
          expect_equal value (String_util.path_file_extension value) expected));

  Fest.test "file formats and lowercase extensions preserve aliases and absence"
    (fun () ->
      [|
        ("", None, None);
        ("foo", None, None);
        ("foo.", None, None);
        ("foo.md", Some "markdown", Some "md");
        ("foo.MD", Some "markdown", Some "md");
        ("foo.org", Some "org", Some "org");
        ("foo.foo-bar", Some "foo", Some "foo");
        (".gitignore", Some "gitignore", Some "gitignore");
        ("a.中文", None, None);
      |]
      |> Array.iter (fun (value, expected_format, expected_extension) ->
          expect_equal (value ^ " format")
            (String_util.file_format_name value)
            expected_format;
          expect_equal (value ^ " extension")
            (String_util.file_extension value)
            expected_extension));

  Fest.test "path segment joins preserve empty and Unicode segments" (fun () ->
      [|
        ([||], "");
        ([| "" |], "");
        ([| "a" |], "a");
        ([| "a"; "b" |], "a/b");
        ([| "a"; ""; "b" |], "a//b");
        ([| ""; "a" |], "/a");
        ([| "a"; "" |], "a/");
        ([| "a b"; "文" |], "a b/文");
      |]
      |> Array.iter (fun (segments, expected) ->
          expect_equal expected
            (String_util.join_path_segments (Rrbvec.of_array segments))
            expected));

  Fest.test "regular expression escaping preserves literal text" (fun () ->
      [|
        ("", "");
        ("plain", "plain");
        ("[]{}().+*?|$^", "\\[\\]\\{\\}\\(\\)\\.\\+\\*\\?\\|\\$\\^");
        ("a.b+c?", "a\\.b\\+c\\?");
        ("\\", "\\\\");
        ("\\[]", "\\\\\\[\\]");
        ("文.字", "文\\.字");
        ("^^", "\\^\\^");
        ("$1", "\\$1");
        ("a/b-c", "a/b-c");
      |]
      |> Array.iter (fun (value, expected) ->
          expect_equal value (String_util.escape_regex_chars value) expected));

  Fest.test "case-insensitive replacement preserves literal matching" (fun () ->
      [|
        ("Hello HELLO hello", "hello", "x", "x x x");
        ("a.b A.B", "a.b", "x", "x x");
        ("aaaa", "aa", "b", "bb");
        ("Straße STRASSE", "straße", "x", "x STRASSE");
        ("文A文a", "文a", "X", "XX");
        ("no match", "z", "x", "no match");
        ("$value $VALUE", "$value", "$$new", "$new $new");
        ("abc", "", "x", "xaxbxcx");
        ("a\\b A\\B", "a\\b", "x", "x x");
        ("a\nb A\nB", "a\nb", "x", "x x");
        ("aba", "a", "$1", "$1b$1");
        ("aba", "a", "$`", "bab");
      |]
      |> Array.iter (fun (value, old_value, new_value, expected) ->
          expect_equal value
            (String_util.replace_ignore_case value old_value new_value)
            expected));

  Fest.test "EDN keyword validation preserves reader token behavior" (fun () ->
      [|
        ("", false);
        (":", false);
        (":foo", true);
        (":foo-bar", true);
        (":foo!", true);
        (":foo?", true);
        (":foo/bar", true);
        (":foo/bar/baz", false);
        (":/", true);
        ("://", false);
        ("::foo", false);
        (":1", true);
        (":1foo", true);
        (":+", true);
        (":-", true);
        (":.", true);
        (":foo.bar", true);
        (":foo#bar", true);
        (":foo|bar", true);
        (":foo@bar", false);
        (":foo:bar", true);
        (":foo,bar", false);
        (":foo bar", false);
        (":foo\nbar", false);
        (":foo/bar/", false);
        (":/foo", false);
        (":foo//bar", false);
        (":foo;bar", false);
        (":foo\\bar", false);
        (":`property", false);
        (":foo'bar", true);
        (":foo[bar", false);
        (":foo{bar", false);
        (":页面/子页", true);
        (":🙂", true);
        (":foo%bar", true);
        (":foo&bar", true);
        (":foo=bar", true);
        ("foo", false);
        ("4", false);
        ("`property", false);
      |]
      |> Array.iter (fun (value, expected) ->
          expect_equal value (String_util.is_valid_edn_keyword value) expected));

  Fest.test "regular expression matching preserves captures and lastIndex"
    (fun () ->
      let captures regexp value =
        Regexp_runtime.find regexp value
        |> Option.map (fun matches -> matches |> Rrbvec.to_array)
      in
      expect_equal "absent match" (captures (Js.Re.fromString "z") "abc") None;
      expect_equal "match without captures"
        (captures (Js.Re.fromString "b") "abc")
        (Some [| Some "b" |]);
      expect_equal "required captures"
        (captures (Js.Re.fromString "(b)(c)") "abc")
        (Some [| Some "bc"; Some "b"; Some "c" |]);
      expect_equal "optional capture"
        (captures (Js.Re.fromString "a(b)?") "a")
        (Some [| Some "a"; None |]);
      expect_equal "empty capture"
        (captures (Js.Re.fromString "a()") "a")
        (Some [| Some "a"; Some "" |]);
      expect_equal "Unicode capture"
        (captures (Js.Re.fromString "(页面)") "前页面后")
        (Some [| Some "页面"; Some "页面" |]);
      expect_equal "multiline match"
        (captures (Js.Re.fromStringWithFlags "^b" ~flags:"m") "a\nb")
        (Some [| Some "b" |]);
      let global = Js.Re.fromStringWithFlags "a" ~flags:"g" in
      expect_equal "first global match" (captures global "a a")
        (Some [| Some "a" |]);
      expect_equal "first global lastIndex" (Js.Re.lastIndex global) 1;
      expect_equal "second global match" (captures global "a a")
        (Some [| Some "a" |]);
      expect_equal "second global lastIndex" (Js.Re.lastIndex global) 3;
      expect_equal "exhausted global match" (captures global "a a") None;
      expect_equal "reset global lastIndex" (Js.Re.lastIndex global) 0;
      expect_equal "UUID pattern" String_util.uuid_pattern
        "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");

  Fest.test "page titles prefer present titles over names" (fun () ->
      [|
        (None, None, None);
        (None, Some "name", Some "name");
        (Some "Title", None, Some "Title");
        (Some "Title", Some "name", Some "Title");
        (Some "", Some "name", Some "");
        (None, Some "页面", Some "页面");
      |]
      |> Array.iter (fun (title, name, expected) ->
          expect_equal "page title" (Util.page_title ~title ~name) expected));

  Fest.test "nil entry filtering preserves keys values and order" (fun () ->
      expect_equal "empty entries"
        (Util.remove_nil_entries Rrbvec.empty |> Rrbvec.to_array)
        [||];
      expect_equal "mixed entries"
        (Util.remove_nil_entries
           (Rrbvec.of_array
              [|
                ("nil", None);
                ("false", Some false);
                ("duplicate", Some true);
                ("duplicate", Some false);
              |])
        |> Rrbvec.to_array)
        [| ("false", false); ("duplicate", true); ("duplicate", false) |]);

  Fest.test "collection concatenation removes only absent values" (fun () ->
      expect_equal "empty collections"
        (Util.concat_present_values Rrbvec.empty |> Rrbvec.to_array)
        [||];
      expect_equal "mixed collections"
        (Util.concat_present_values
           (Rrbvec.of_array
              [|
                Rrbvec.of_array [| Some false; None; Some true |];
                Rrbvec.empty;
                Rrbvec.of_array [| None; Some false |];
              |])
        |> Rrbvec.to_array)
        [| false; true; false |]);

  Fest.test "block timestamps preserve creation and always advance update"
    (fun () ->
      let created =
        Util.block_timestamps ~now_ms:2000. ~created_at:(Some 1000.)
      in
      expect_equal "preserved created-at" created.created_at 1000.;
      expect_equal "updated-at" created.updated_at 2000.;
      let missing = Util.block_timestamps ~now_ms:3000. ~created_at:None in
      expect_equal "created-at defaults to now" missing.created_at 3000.;
      expect_equal "shared timestamp" missing.updated_at 3000.);

  Fest.test "ensured block timestamps preserve both existing values" (fun () ->
      let existing =
        Util.ensure_block_timestamps ~now_ms:100. ~created_at:(Some 10.)
          ~updated_at:(Some 20.)
      in
      expect_equal "ensured creation" existing.created_at 10.;
      expect_equal "ensured update" existing.updated_at 20.;
      let missing =
        Util.ensure_block_timestamps ~now_ms:100. ~created_at:None
          ~updated_at:None
      in
      expect_equal "missing creation" missing.created_at 100.;
      expect_equal "missing update" missing.updated_at 100.);

  Fest.test "collection distinct helpers preserve winning order" (fun () ->
      let values = Rrbvec.of_list [ ("a", 1); ("b", 2); ("a", 3) ] in
      expect_equal "first wins"
        (Util.distinct_by ~key:fst ~equal:String.equal values |> Rrbvec.to_list)
        [ ("a", 1); ("b", 2) ];
      expect_equal "last wins"
        (Util.distinct_by_last_wins ~key:fst ~equal:String.equal values
        |> Rrbvec.to_list)
        [ ("b", 2); ("a", 3) ]);

  Fest.test "multi-field comparison stops after the first difference" (fun () ->
      let criteria =
        Rrbvec.of_list
          [
            { Util.value = fst; ascending = true };
            { Util.value = snd; ascending = false };
          ]
      in
      expect_equal "major key"
        (Util.compare_by ~compare criteria (1, 9) (2, 1))
        (-1);
      expect_equal "descending minor"
        (Util.compare_by ~compare criteria (1, 9) (1, 1))
        (-1);
      expect_equal "equal" (Util.compare_by ~compare criteria (1, 9) (1, 9)) 0)
