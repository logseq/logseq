module Plural = Melange_common.Plural
module Macro = Melange_common.Macro

let fail message =
  Fest.expect |> Fest.equal message "";
  failwith message

let expect_equal label actual expected =
  if actual <> expected then fail (label ^ ": unexpected value")

let () =
  Fest.test "plural rules preserve regular irregular and case behavior"
    (fun () ->
      [|
        ("", "");
        ("duck", "ducks");
        ("ducks", "ducks");
        ("person", "people");
        ("Person", "People");
        ("PERSON", "PEOPLE");
        ("pErSoN", "people");
        ("child", "children");
        ("ox", "oxen");
        ("passerby", "passersby");
        ("analysis", "analyses");
        ("matrix", "matrices");
        ("knife", "knives");
        ("city", "cities");
        ("mouse", "mice");
        ("criterion", "criteria");
        ("alumnus", "alumni");
        ("schema", "schemata");
        ("quiz", "quizzes");
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Plural.plural input) expected));

  Fest.test "singular rules reverse regular irregular and case behavior"
    (fun () ->
      [|
        ("", "");
        ("ducks", "duck");
        ("duck", "duck");
        ("people", "person");
        ("People", "Person");
        ("PEOPLE", "PERSON");
        ("pEoPlE", "person");
        ("children", "child");
        ("oxen", "ox");
        ("passersby", "passerby");
        ("analyses", "analysis");
        ("matrices", "matrix");
        ("knives", "knife");
        ("cities", "city");
        ("mice", "mouse");
        ("criteria", "criterion");
        ("alumni", "alumnus");
        ("schemata", "schema");
        ("quizzes", "quiz");
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Plural.singular input) expected));

  Fest.test "uncountable Unicode checks and count formatting preserve behavior"
    (fun () ->
      let pokemon = "Pok" ^ Js.String.fromCharCode 0x00e9 ^ "mon" in
      let upper_pokemon = Js.String.toUpperCase pokemon in
      let unicode_page = Js.String.fromCharCodeMany [| 0x9875; 0x9762 |] in
      [|
        ("information", "information");
        ("fish", "fish");
        (pokemon, pokemon);
        (upper_pokemon, upper_pokemon);
        (unicode_page, unicode_page);
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Plural.plural input) expected;
          expect_equal input (Plural.singular input) expected);
      [|
        ("duck", false, true);
        ("ducks", true, false);
        ("person", false, true);
        ("people", true, false);
        ("fish", true, true);
        ("", true, true);
        (unicode_page, true, true);
      |]
      |> Array.iter (fun (input, expected_plural, expected_singular) ->
          expect_equal input (Plural.is_plural input) expected_plural;
          expect_equal input (Plural.is_singular input) expected_singular);
      expect_equal "zero"
        (Plural.pluralize ~word:"duck" ~item_count:0 ~inclusive:false)
        "ducks";
      expect_equal "one"
        (Plural.pluralize ~word:"duck" ~item_count:1 ~inclusive:false)
        "duck";
      expect_equal "two"
        (Plural.pluralize ~word:"duck" ~item_count:2 ~inclusive:false)
        "ducks";
      expect_equal "inclusive zero"
        (Plural.pluralize ~word:"duck" ~item_count:0 ~inclusive:true)
        "0 ducks";
      expect_equal "inclusive irregular"
        (Plural.pluralize ~word:"people" ~item_count:1 ~inclusive:true)
        "1 person");

  Fest.test "macro delimiters and detection preserve trimmed boundary behavior"
    (fun () ->
      expect_equal "left braces" Macro.left_braces "{{";
      expect_equal "right braces" Macro.right_braces "}}";
      [|
        ("", false);
        ("  ", false);
        ("{{}}", true);
        ("{{query foo}}", true);
        (" {{query foo}} ", true);
        ("x{{query foo}}", false);
        ("{{query foo}}x", false);
        ("{{ foo }}", true);
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Macro.is_macro input) expected));

  Fest.test "macro substitution preserves sequential literal replacement"
    (fun () ->
      [|
        ("$1 $2 $1", [| "a"; "b" |], "a b a");
        ("$1-$2-$3", [| "a" |], "a-$2-$3");
        ("$10/$1", [| "x" |], "x0/x");
        ("$1", [||], "$1");
      |]
      |> Array.iter (fun (content, arguments, expected) ->
          expect_equal content (Macro.substitute content arguments) expected));

  Fest.test "macro expansion preserves lookup argument and malformed behavior"
    (fun () ->
      let lookup name =
        if String.equal name "foo" then Some "$1-$2" else None
      in
      let empty_lookup name =
        if String.equal name "foo" then Some "<$1>" else None
      in
      [|
        ("{{foo a b}}", lookup, "a-b");
        ("{{foo a   b}}", lookup, "a-b");
        ("{{foo}}", lookup, "{{foo}}");
        ("{{foo }}", empty_lookup, "<>");
        ("{{unknown a}}", lookup, "{{unknown a}}");
        (" {{foo a}} ", lookup, " {{foo a}} ");
        ("plain", lookup, "plain");
      |]
      |> Array.iter (fun (input, lookup, expected) ->
          expect_equal input (Macro.expand_value_if_macro input lookup) expected))
