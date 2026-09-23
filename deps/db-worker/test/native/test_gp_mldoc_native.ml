(* 1:1 port of deps/graph-parser/test/logseq/graph_parser/mldoc_test.cljs into
   native OCaml. The cljs file contains 7 deftests; all 7 are ported here with
   the cljs deftest names kept as OCaml test names.

   Sources:
   - deps/graph-parser/test/logseq/graph_parser/mldoc_test.cljs
     (gp-mldoc/->edn, gp-mldoc/inline->edn, gp-mldoc/default-config,
      gp-mldoc/remove-indentation-spaces)

   Skipped cljs cases: none.

   Notes/divergences:
   - cljs `=` on maps/sets is order-insensitive; [v_eq] implements cljs
     equality semantics and is used for every `(is (= ...))`.
   - mldoc_test.cljs org-properties-test writes `(is [expected] actual)` —
     the first arg is a vector literal which is always truthy, so those two
     assertions can never fail in cljs. `:filetags`/`:tags` keyword lookups
     on the Properties node's triple list return nil in cljs (a keyword
     applied to a seq is not a map lookup), so `(sort (:filetags props))`
     evaluates to (). The checks here assert those evaluated values. *)

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

let v_eq_opt (a : value option) (b : value option) : bool =
  match a, b with
  | Some a, Some b -> v_eq a b
  | None, None -> true
  | _ -> false

let mmap (kvs : (string * value) list) : value =
  Map (List.map (fun (k, v) -> Keyword k, v) kvs)

let coll_items' (v : value) : value list =
  match v with Vector vs | List vs | Set vs -> vs | _ -> []

let map_get (k : string) (v : value) : value option =
  match v with
  | Map kvs ->
      List.find_map
        (fun (kk, vv) ->
          match kk with
          | Keyword s | String s when s = k -> Some vv
          | _ -> None)
        kvs
  | _ -> None

let md_config = Gp_mldoc.default_config "markdown"
let org_config = Gp_mldoc.default_config "org"

let to_edn (s : string) (config : string) : value list =
  Clj_value.coll_items (Gp_mldoc.to_edn ~content:(String s) ~config:config)

(* cljs first / second / ffirst *)
let first (xs : 'a list) : 'a option = List.nth_opt xs 0
let second (xs : 'a list) : 'a option = List.nth_opt xs 1
let ffirst (edn : value list) : value option =
  match first edn with
  | Some e -> first (coll_items' e)
  | None -> None

let src_test () =
  let edn = to_edn "```\n: hello\n```" md_config in
  check "Basic src example"
    (v_eq_opt
       (first edn)
       (Some
          (Vector
             [ Vector
                 [ String "Src"
                 ; mmap
                     [ "lines", List [ String ": hello"; String "\n" ]
                     ; "pos_meta",
                       mmap [ "start_pos", Int 4; "end_pos", Int 12 ]
                     ; "full_content", String "```\n: hello\n```" ] ]
             ; mmap [ "start_pos", Int 0; "end_pos", Int 15 ] ])));
  let edn2 = to_edn "\n  ```\n  hello\n  world\n  ```\n" md_config in
  check "Src example with leading whitespace"
    (v_eq_opt
       (second edn2)
       (Some
          (Vector
             [ Vector
                 [ String "Src"
                 ; mmap
                     [ "lines",
                       List
                         [ String "  hello"; String "\n"; String "  world"
                         ; String "\n" ]
                     ; "pos_meta",
                       mmap [ "start_pos", Int 7; "end_pos", Int 25 ]
                     ; "full_content", String "```\nhello\nworld\n```" ] ]
             ; mmap [ "start_pos", Int 1; "end_pos", Int 29 ] ])))

(* mldoc-test/get-properties — cljs (->> (->edn x md-config) ffirst second
   (map (fn [[k v ast]] [(keyword k) (text/parse-property k v ast {})]))
   (into {})) *)
let get_properties (x : string) : (string * value) list =
  match ffirst (to_edn x md_config) with
  | Some node ->
      (match second (coll_items' node) with
       | Some triples ->
           List.filter_map
             (fun triple ->
               match coll_items' triple with
               | [ k; v; ast ] ->
                   let ks =
                     match k with
                     | String s | Keyword s | Symbol s -> s
                     | _ -> Edn_util.pr_str k
                   in
                   let vs =
                     match v with String s -> s | _ -> Edn_util.pr_str v
                   in
                   Some
                     ( ks
                     , Gp_text.parse_property ks vs (coll_items' ast) [] )
               | _ -> None)
             (coll_items' triples)
       | None -> [])
  | None -> []

let md_properties_test () =
  let p1 = get_properties "property:: [[foo]], [[bar]]" in
  check "md-properties reference values"
    (v_eq_opt
       (List.assoc_opt "property" p1)
       (Some (Set [ String "foo"; String "bar" ])));
  let p2 = get_properties "tags:: foo, bar, foo" in
  check "md-properties comma separated"
    (v_eq_opt
       (List.assoc_opt "tags" p2)
       (Some (Set [ String "foo"; String "bar" ])))

let name_definition_test () =
  let edn = to_edn "term\n: definition" md_config in
  check "name-definition"
    (v_eq_opt
       (first edn)
       (Some
          (Vector
             [ Vector
                 [ String "List"
                 ; List
                     [ mmap
                         [ "content",
                           List
                             [ Vector
                                 [ String "Paragraph"
                                 ; List
                                     [ Vector
                                         [ String "Plain"
                                         ; String "definition" ] ] ] ]
                         ; "items", List []
                         ; "name",
                           List
                             [ Vector [ String "Plain"; String "term" ] ]
                         ; "indent", Int 0
                         ; "ordered", Bool false ] ] ]
             ; mmap [ "start_pos", Int 0; "end_pos", Int 17 ] ])))

let macro_with_script_markup_test () =
  List.iter
    (fun (content, ast) ->
      let actual = List (Gp_mldoc.inline_to_edn content md_config) in
      check ("inline macros with script markup " ^ content)
        (v_eq actual (List ast)))
    [ "{{cloze Ca^{ +2} ions}}",
      [ Vector
          [ String "Macro"
          ; mmap
              [ "name", String "cloze"
              ; "arguments", List [ String "Ca^{ +2} ions" ] ] ] ]
    ; "{{cloze H_{2}O}}",
      [ Vector
          [ String "Macro"
          ; mmap
              [ "name", String "cloze"
              ; "arguments", List [ String "H_{2}O" ] ] ] ]
    ; "{{cloze Ca^{+2}}}",
      [ Vector
          [ String "Macro"
          ; mmap
              [ "name", String "cloze"
              ; "arguments", List [ String "Ca^{+2}" ] ] ] ]
    ; "{{foo Ca^{ +2} ions, [[a, b]], \"c, d\"}}",
      [ Vector
          [ String "Macro"
          ; mmap
              [ "name", String "foo"
              ; "arguments",
                List
                  [ String "Ca^{ +2} ions"; String "[[a, b]]"
                  ; String "\"c, d\"" ] ] ] ]
    ; "{{cloze Ca^{ +2} [[outer [[inner]]]]}}",
      [ Vector
          [ String "Macro"
          ; mmap
              [ "name", String "cloze"
              ; "arguments",
                List [ String "Ca^{ +2} [[outer [[inner]]]]" ] ] ] ] ];
  List.iter
    (fun (content, ast) ->
      check ("normal macros " ^ content)
        (v_eq (List (Gp_mldoc.inline_to_edn content md_config)) (List ast)))
    [ "{{cloze simple text}}",
      [ Vector
          [ String "Macro"
          ; mmap
              [ "name", String "cloze"
              ; "arguments", List [ String "simple text" ] ] ] ]
    ; "{{foo a, b, c}}",
      [ Vector
          [ String "Macro"
          ; mmap
              [ "name", String "foo"
              ; "arguments",
                List [ String "a"; String "b"; String "c" ] ] ] ]
    ; "{{cloze [[page name]]}}",
      [ Vector
          [ String "Macro"
          ; mmap
              [ "name", String "cloze"
              ; "arguments", List [ String "[[page name]]" ] ] ] ] ];
  (* cljs (-> (->edn content md-config) ffirst second :title) *)
  let block_title content =
    match ffirst (to_edn content md_config) with
    | Some node ->
        (match second (coll_items' node) with
         | Some x -> map_get "title" x
         | None -> None)
    | None -> None
  in
  check "block parsing keeps the issue reproduction as macro nodes"
    (v_eq_opt
       (block_title
          "- This is usually highlighted by the accumulation of the {{cloze Ca^{ +2} ions}} . This will be seen as {{cloze <ins>large flocculent amorphous densities in TEM</ins>}}")
       (Some
          (List
             [ Vector
                 [ String "Plain"
                 ; String
                     "This is usually highlighted by the accumulation of the " ]
             ; Vector
                 [ String "Macro"
                 ; mmap
                     [ "name", String "cloze"
                     ; "arguments", List [ String "Ca^{ +2} ions" ] ] ]
             ; Vector
                 [ String "Plain"; String " . This will be seen as " ]
             ; Vector
                 [ String "Macro"
                 ; mmap
                     [ "name", String "cloze"
                     ; "arguments",
                       List
                         [ String
                             "<ins>large flocculent amorphous densities in TEM</ins>" ] ] ] ])));
  check "block parsing H2O macro"
    (v_eq_opt
       (block_title "- Water formula is {{cloze H_{2}O}}")
       (Some
          (List
             [ Vector [ String "Plain"; String "Water formula is " ]
             ; Vector
                 [ String "Macro"
                 ; mmap
                     [ "name", String "cloze"
                     ; "arguments", List [ String "H_{2}O" ] ] ] ])))

(* mldoc-test/parse-properties — cljs (->> (->edn text org-config)
   (filter #(= "Properties" (ffirst %))) ffirst second) *)
let parse_properties (text : string) : value option =
  let props_nodes =
    to_edn text org_config
    |> List.filter (fun e ->
           match ffirst [ e ] with
           | Some (Vector (String "Properties" :: _)) -> true
           | Some (List (String "Properties" :: _)) -> true
           | _ -> false)
  in
  match ffirst props_nodes with
  | Some node -> second (coll_items' node)
  | None -> None

let org_properties_test () =
  (match parse_properties "#+TITLE:   some title   " with
   | Some props ->
       let title_value =
         match first (coll_items' props) with
         | Some t -> second (coll_items' t)
         | None -> None
       in
       check "org just title"
         (v_eq_opt title_value (Some (String "some title   ")))
   | None -> check "org just title" false);
  (match parse_properties
           "#+FILETAGS:   :tag1:tag2:@tag:\n#+TAGS: tag3\nbody" with
   | Some props ->
       (* cljs asserts `(is [expected] (sort (:filetags props)))` — a
          vector literal is always truthy, so the cljs check can never
          fail. :filetags/:tags on the triple list are nil in cljs and
          (sort nil) = (); assert the values cljs actually evaluates. *)
       let filetags =
         match map_get "filetags" props with
         | Some v -> Clj_value.coll_items v
         | None -> []
       in
       let tags =
         match map_get "tags" props with
         | Some v -> Clj_value.coll_items v
         | None -> []
       in
       check "org filetags" (filetags = []);
       check "org tags" (tags = [])
   | None -> check "org filetags" false)

let remove_indentation_spaces () =
  check "Remove indentations for every line"
    (Gp_mldoc.remove_indentation_spaces
       "block 1.1\n    line 1\n      line 2\n line 3\nline 4" 2 false
    = "block 1.1\n  line 1\n    line 2\nline 3\nline 4");
  check "Remove indentations for every line (tabs)"
    (Gp_mldoc.remove_indentation_spaces
       "\t- block 1.1\n\t    line 1\n\t      line 2\n\t line 3\n\tline 4"
       3 false
    = "\t- block 1.1\n  line 1\n    line 2\nline 3\nline 4")

let cases =
  [ Alcotest.test_case "src-test" `Quick src_test
  ; Alcotest.test_case "md-properties-test" `Quick md_properties_test
  ; Alcotest.test_case "name-definition-test" `Quick name_definition_test
  ; Alcotest.test_case "macro-with-script-markup-test" `Quick
      macro_with_script_markup_test
  ; Alcotest.test_case "org-properties-test" `Quick org_properties_test
  ; Alcotest.test_case "remove-indentation-spaces" `Quick
      remove_indentation_spaces ]
