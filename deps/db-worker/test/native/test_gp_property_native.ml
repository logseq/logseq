(* 1:1 port of deps/graph-parser/test/logseq/graph_parser/property_test.cljs
   into native OCaml. The cljs file contains 2 deftests; both are ported
   here with the cljs deftest names kept as OCaml test names.

   Sources:
   - deps/graph-parser/test/logseq/graph_parser/property_test.cljs
     (gp-property/->new-properties, gp-property/remove-properties)

   Skipped cljs cases: none.

   Notes/divergences:
   - cljs `(def test-db "test-db")` is unused in the file and not ported.
   - cljs passes `:org`/`:markdown` keywords for the format arg; the OCaml
     signature takes a format string, matching the port's convention of
     storing format values as strings.
   - LIB BUG (exposed, reported): Gp_property.remove_properties splits
     content with String.split_on_char, which yields a trailing empty line
     after a final "\n" — cljs string/split-lines does not — so the
     org-drawer cases here return "** hello\n" instead of "** hello".
     Same divergence already fixed in Gp_mldoc.to_edn's line splitting.
     The cljs-faithful assertion stays; the fix belongs in lib/. *)

open Test_shared

let test_to_new_properties () =
  List.iteri
    (fun i (input, expected) ->
      check (Printf.sprintf "->new-properties case %d" i)
        (Gp_property.to_new_properties input = expected))
    [ ":PROPERTIES:\n:foo: bar\n:END:", "foo:: bar"
    ; "hello\n:PROPERTIES:\n:foo: bar\n:END:", "hello\nfoo:: bar"
    ; "hello\n:PROPERTIES:\n:foo: bar\n:nice: bingo\n:END:"
      , "hello\nfoo:: bar\nnice:: bingo"
    ; "hello\n:PROPERTIES:\n:foo: bar\n:nice: bingo\n:END:"
      , "hello\nfoo:: bar\nnice:: bingo"
    ; "hello\n:PROPERTIES:\n:foo: bar\n:nice: bingo\n:END:\nnice"
      , "hello\nfoo:: bar\nnice:: bingo\nnice"
    ; "hello\n:PROPERTIES:\n:foo: bar\n:nice:\n:END:\nnice"
      , "hello\nfoo:: bar\nnice:: \nnice"
    ; "hello\n:PROPERTIES:\n:foo: bar\n:nice\n:END:\nnice"
      , "hello\nfoo:: bar\n:nice\nnice" ]

let test_remove_properties () =
  (* testing "properties with non-blank lines" *)
  List.iteri
    (fun i (format, input, expected) ->
      check (Printf.sprintf "non-blank case %d" i)
        (Gp_property.remove_properties format input = expected))
    [ "org", "** hello\n:PROPERTIES:\n:x: y\n:END:\n", "** hello"
    ; "org", "** hello\n:PROPERTIES:\n:x: y\na:b\n:END:\n", "** hello"
    ; "markdown", "** hello\nx:: y\na:: b\n", "** hello"
    ; "markdown", "** hello\nx:: y\na::b\n", "** hello" ];
  (* testing "properties with blank lines" *)
  List.iteri
    (fun i (format, input, expected) ->
      check (Printf.sprintf "blank case %d" i)
        (Gp_property.remove_properties format input = expected))
    [ "org", "** hello\n:PROPERTIES:\n\n:x: y\n:END:\n", "** hello"
    ; "org", "** hello\n:PROPERTIES:\n:x: y\n\na:b\n:END:\n", "** hello" ];
  (* testing "invalid-properties" *)
  List.iteri
    (fun i (format, input, expected) ->
      check (Printf.sprintf "invalid case %d" i)
        (Gp_property.remove_properties format input = expected))
    [ "markdown", "hello\nnice\nfoo:: bar", "hello\nnice\nfoo:: bar"
    ; "markdown", "hello\nnice\nfoo:: bar\ntest", "hello\nnice\nfoo:: bar\ntest"
    ; "markdown", "** hello\nx:: y\n\na:: b\n", "** hello\n\na:: b" ]

let cases =
  [ Alcotest.test_case "test->new-properties" `Quick test_to_new_properties
  ; Alcotest.test_case "test-remove-properties" `Quick test_remove_properties ]
