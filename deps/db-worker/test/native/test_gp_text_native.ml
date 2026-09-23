(* 1:1 port of deps/graph-parser/test/logseq/graph_parser/text_test.cljs into
   native OCaml. The cljs file contains 5 deftests; all 5 are ported here with
   the cljs deftest names kept as OCaml test names.

   Sources:
   - deps/graph-parser/test/logseq/graph_parser/text_test.cljs
     (text/get-page-name, text/page-ref-un-brackets!,
      text/remove-level-spaces, text/parse-property)

   Skipped cljs cases: none.

   Notes/divergences:
   - cljs `=` on sets is order-insensitive; [v_eq] implements cljs equality
     semantics for every `(is (= ...))`.
   - cljs keyword properties (:tags, :title, ...) are passed as plain attr
     strings; user config maps as (attr * value) assoc lists.
   - cljs (gp-mldoc/get-references v config) -> Gp_mldoc.get_references ~text
     ~config, whose result is a value; its items are passed to
     Gp_text.parse_property as the mldoc reference AST. *)

open Datascript
open Test_shared

(* cljs = : order-insensitive for maps and sets, sequential across
   vector/list *)
let rec v_eq (a : value) (b : value) : bool =
  match a, b with
  | Map ka, Map kb ->
      List.length ka = List.length kb
      && List.for_all
           (fun (k, v) ->
             match List.find_opt (fun (k', _) -> v_eq k' k) kb with
             | Some (_, v') -> v_eq v v'
             | None -> false)
           ka
  | Set sa, Set sb ->
      List.length sa = List.length sb
      && List.for_all (fun x -> List.exists (fun y -> v_eq x y) sb) sa
      && List.for_all (fun y -> List.exists (fun x -> v_eq x y) sa) sb
  | Vector va, Vector vb
  | List va, List vb
  | Vector va, List vb
  | List va, Vector vb ->
      List.length va = List.length vb && List.for_all2 v_eq va vb
  | _ -> Util.value_equal a b

let sset (ss : string list) : value =
  Set (List.map (fun s -> String s) ss)

(* text-test/parse-property helper *)
let parse_property (k : attr) (v : string)
    (user_config : (attr * value) list) : value =
  let references =
    Gp_mldoc.get_references ~text:v
      ~config:(Gp_mldoc.default_config "markdown")
  in
  Gp_text.parse_property k v (Clj_value.coll_items references) user_config

let comma_config : (attr * value) list =
  [ "property/separated-by-commas", Set [ Keyword "comma-prop" ] ]

let test_get_page_name () =
  List.iter
    (fun (x, y) ->
      check ("get-page-name " ^ x) (Gp_text.get_page_name x = y))
    [ "[[page]]", Some "page"
    ; "[[another page]]", Some "another page"
    ; "[single bracket]", None
    ; "no brackets", None
    ; "[[another page]]", Some "another page"
    ; "[[nested [[page]]]]", Some "nested [[page]]"
    ; "[[file:./page.org][page]]", Some "page"
    ; "[[file:./pages/page.org][page]]", Some "page"
    ; "[[file:./namespace.page.org][namespace/page]]",
      Some "namespace/page"
    ; "[[file:./pages/namespace.page.org][namespace/page]]",
      Some "namespace/page"
    ; "[[file:./pages/namespace.page.org][please don't change me]]",
      Some "namespace/page"
    ; "[page](file:./page.md)", Some "page"
    ; "[page](file:.pages/page.md)", Some "page"
    ; "[logseq/page](file:./logseq.page.md)", Some "logseq/page"
    ; "[logseq/page](file:./pages/logseq.page.md)", Some "logseq/page" ]

let page_ref_un_brackets' () =
  List.iter
    (fun (x, y) ->
      check ("page-ref-un-brackets! " ^ x)
        (Gp_text.page_ref_un_brackets x = y))
    [ "[[page]]", "page"
    ; "[[another page]]", "another page"
    ; "[[nested [[page]]]]", "nested [[page]]"
    ; "[single bracket]", "[single bracket]"
    ; "no brackets", "no brackets" ]

let remove_level_spaces' () =
  let block_pattern_markdown = "-" in
  let block_pattern_org = "*" in
  List.iter
    (fun (x, y) ->
      check ("remove-level-spaces md-space " ^ x)
        (Gp_text.remove_level_spaces x "markdown" block_pattern_markdown
           ~space:true ()
        = y))
    [ "- foobar", "foobar"; " - foobar", "foobar" ];
  List.iter
    (fun (x, y) ->
      check ("remove-level-spaces md-nospace " ^ x)
        (Gp_text.remove_level_spaces x "markdown" block_pattern_markdown ()
        = y))
    [ "-foobar", "foobar" ];
  List.iter
    (fun (x, y) ->
      check ("remove-level-spaces org-space " ^ x)
        (Gp_text.remove_level_spaces x "org" block_pattern_org ~space:true ()
        = y))
    [ "* foobar", "foobar"
    ; "**   foobar", "foobar"
    ; "*********************   foobar", "foobar" ];
  List.iter
    (fun (x, y) ->
      check ("remove-level-spaces org-nospace " ^ x)
        (Gp_text.remove_level_spaces x "org" block_pattern_org () = y))
    [ "*foobar", "foobar"
    ; "**foobar", "foobar"
    ; "*********************foobar", "foobar" ]

let test_parse_property () =
  List.iter
    (fun (label, k, v, cfg, y) ->
      check ("parse-property " ^ label)
        (v_eq (parse_property k v cfg) y))
    [ "tags foo", "tags", "foo", [], sset [ "foo" ]
    ; "tags comma", "tags", "comma, separated", [],
      sset [ "comma"; "separated" ]
    ; "alias dedupe", "alias", "one, two, one", [],
      sset [ "one"; "two" ]
    ; "comma-prop foo", "comma-prop", "foo", comma_config,
      sset [ "foo" ]
    ; "comma-prop comma", "comma-prop", "comma, separated", comma_config,
      sset [ "comma"; "separated" ]
    ; "comma-prop dedupe", "comma-prop", "one, two, one", comma_config,
      sset [ "one"; "two" ]
    ; "comma-prop mixed", "comma-prop", "foo, #bar", comma_config,
      sset [ "foo"; "bar" ]
    ; "comma-prop refs", "comma-prop",
      "comma, separated, [[page ref]], [[nested [[page]]]], #[[nested [[tag]]]], end",
      comma_config,
      sset
        [ "page ref"; "nested [[page]]"; "nested [[tag]]"; "comma"
        ; "separated"; "end" ]
    ; "normal refs", "normal", "[[foo]] [[bar]]", [],
      sset [ "foo"; "bar" ]
    ; "normal comma refs", "normal", "[[foo]], [[bar]]", [],
      sset [ "foo"; "bar" ]
    ; "normal single", "normal", "[[foo]]", [], sset [ "foo" ]
    ; "normal tag ref", "normal", "[[foo]], [[bar]], #baz", [],
      sset [ "foo"; "bar"; "baz" ]
    ; "normal nested", "normal", "[[foo [[bar]]]]", [],
      sset [ "foo [[bar]]" ]
    ; "normal nested 2", "normal", "[[foo [[bar]]]], [[baz]]", [],
      sset [ "baz"; "foo [[bar]]" ]
    ; "title comma", "title", "comma, is ok", [],
      String "comma, is ok"
    ; "prop punctuation", "prop", "#foo, #bar. #baz!", [],
      sset [ "foo"; "bar"; "baz" ]
    ; "prop quoted tag", "prop", "#foo: '#bar'", [],
      sset [ "foo"; "bar" ]
    ; "tags quoted", "tags", "\"foo, bar\"", [],
      String "\"foo, bar\""
    ; "tags quoted refs", "tags", "\"[[foo]], [[bar]]\"", [],
      String "\"[[foo]], [[bar]]\""
    ; "title bracket", "title", "[[Jan 11th, 2022]] 21:26", [],
      String "[[Jan 11th, 2022]] 21:26"
    ; "title nested brackets", "title", "[[[[aldsfkd]] a.b/c.d]]", [],
      String "[[[[aldsfkd]] a.b/c.d]]"
    ; "id", "id", "62e98716-9c0b-4253-83e7-7f8e8a23fe19", [],
      String "62e98716-9c0b-4253-83e7-7f8e8a23fe19"
    ; "filters", "filters", "{\"product process\" true}", [],
      String "{\"product process\" true}"
    ; "collapsed", "collapsed", "false", [], Bool false
    ; "created-at", "created-at", "1609233702047", [],
      Int 1609233702047
    ; "background-color", "background-color", "#533e7d", [],
      String "#533e7d" ]

let cases =
  [ Alcotest.test_case "test-get-page-name" `Quick test_get_page_name
  ; Alcotest.test_case "page-ref-un-brackets!" `Quick page_ref_un_brackets'
  ; Alcotest.test_case "remove-level-spaces" `Quick remove_level_spaces'
  ; Alcotest.test_case "test-parse-property" `Quick test_parse_property ]
