(* 1:1 port of src/test/frontend/db/query_dsl_test.cljs — the seeded-DB
   matrix of query-dsl tests.  The cljs-only pre-transform-test and
   simplify-query are already covered by ../test_query_native.ml. *)

open Datascript
open Db_test_util

let check = Test_shared.check
let sort = Test_shared.sort_uniq

(* like check but prints the actual diff on failure *)
let expect (label : string) (expected : string list) (got : string list) =
  if expected <> got then
    Printf.printf "FAIL %s\n  expected: %s\n  got:      %s\n" label
      (String.concat " | " expected) (String.concat " | " got);
  check label (expected = got)

let expect_len (label : string) (n : int) (got : 'a list) =
  if List.length got <> n then
    Printf.printf "FAIL %s: expected %d, got %d\n" label n (List.length got);
  check label (List.length got = n)

(* cljs db-block-attrs — '*' needed to pull user properties *)
let db_block_attrs =
  "[* {:block/page [:db/id :block/name :block/title :block/journal-day]} \
   {:block/_parent ...}]"

let exec_opts ?(cards = false) ?current_page_title ?today_day () :
    Db_query_dsl.exec_opts =
  { opt_cards = cards
  ; opt_block_attrs = Some db_block_attrs
  ; opt_current_page_title = current_page_title
  ; opt_today_day = today_day }

(* cljs dsl-query — (map first (execute-query s db {:block-attrs …})) *)
let dsl_rows ?(opts = exec_opts ()) (db : db) (s : string) : query_result list =
  match Db_query_dsl.execute_query db s opts with
  | Some rows -> List.filter_map (function [ r ] -> Some r | _ -> None) rows
  | None -> []

let pulled_str (key : string) (r : query_result) : string option =
  match r with
  | Result_pull p -> (
      match List.assoc_opt (Keyword key) p.pulled_attrs with
      | Some (Pulled_scalar (String s)) -> Some s
      | _ -> None)
  | _ -> None

let titles (rs : query_result list) : string list =
  List.filter_map (pulled_str "block/title") rs

let names (rs : query_result list) : string list =
  List.filter_map (pulled_str "block/name") rs

(* (comp first string/split-lines :block/title) *)
let first_lines (rs : query_result list) : string list =
  List.filter_map
    (fun r ->
      match pulled_str "block/title" r with
      | Some t -> (
          match String.index_opt t '\n' with
          | Some i -> Some (String.sub t 0 i)
          | None -> Some t)
      | None -> None)
    rs

(* cljs testable-content — first [^\[]+ run of :block/title, trimmed *)
let testable (rs : query_result list) : string list =
  List.filter_map
    (fun r ->
      match pulled_str "block/title" r with
      | None -> None
      | Some t ->
          let n = String.length t in
          let i = ref 0 in
          while !i < n && t.[!i] = '[' do
            incr i
          done;
          if !i = n then None
          else
            let j =
              match String.index_from_opt t !i '[' with
              | Some j -> j
              | None -> n
            in
            Some (String.trim (String.sub t !i (j - !i))))
    rs

(* (:block/name (:block/page result)) — :block/page pulled as nested entity *)
let page_names (rs : query_result list) : string list =
  List.filter_map
    (function
      | Result_pull p -> (
          match List.assoc_opt (Keyword "block/page") p.pulled_attrs with
          | Some (Pulled_entity e) -> (
              match List.assoc_opt (Keyword "block/name") e.pulled_attrs with
              | Some (Pulled_scalar (String s)) -> Some s
              | _ -> None)
          | _ -> None)
      | _ -> None)
    rs

(* cljs test-helper/file-to-db-statuses *)
let status_ident = function
  | "TODO" -> "logseq.property/status.todo"
  | "DOING" -> "logseq.property/status.doing"
  | "DONE" -> "logseq.property/status.done"
  | "CANCELED" | "CANCELLED" -> "logseq.property/status.canceled"
  | m -> failwith ("unmapped marker " ^ m)

(* cljs build-query-test-block — a ":build.test/title DONE b1" block becomes
   {:block/title "b1" :block/tags [Task] :build/properties {:status done}};
   like the cljs transform, the other keys (e.g. :block/created-at) are
   dropped. *)
let task_block (marker : string) (title : string) : block_decl =
  { default_block with
    b_title = Some title
  ; b_tags = [ "logseq.class/Task" ]
  ; b_properties = [ "logseq.property/status", Kw (status_ident marker) ] }

(* cljs load-test-files — transacts init-index (bare :block/uuid maps), then
   init-tx, then block-props-tx *)
let seed_test_files (conn : conn)
    (pages_and_blocks : (page_decl * block_decl list) list)
    ?(properties = []) ?(classes = []) ?(pre_txs = []) () : unit =
  let pbs =
    List.map (fun (page, blocks) -> { page; blocks }) pages_and_blocks
  in
  let options =
    { default_options with properties; classes; pages_and_blocks = pbs }
  in
  let init_tx, block_props_tx = build_blocks_tx options in
  if pre_txs <> [] then transact_maps conn pre_txs;
  let init_index =
    List.map
      (fun m -> List.filter (fun (k, _) -> k = "block/uuid") m)
      init_tx
  in
  transact_maps conn init_index;
  transact_maps conn init_tx;
  if block_props_tx <> [] then transact_maps conn block_props_tx

let load_test_files ?(properties = []) ?(classes = []) ?(pre_txs = [])
    (pages_and_blocks : (page_decl * block_decl list) list) : conn =
  let conn = create_conn () in
  seed_test_files conn pages_and_blocks ~properties ~classes ~pre_txs ();
  conn

(* cljs builtin-data priority closed values — the native fixture seeds
   logseq.property/priority itself but not its closed values *)
let priority_closed_values_txs : (string * edn) list list =
  List.map
    (fun (ident, title) ->
      [ "db/ident", Kw ident
      ; "block/uuid", Uuid (gen_uuid ())
      ; "block/title", Str title
      ; "block/closed-value-property",
        Map [ "db/ident", Kw "logseq.property/priority" ] ])
    [ "logseq.property/priority.low", "Low"
    ; "logseq.property/priority.medium", "Medium"
    ; "logseq.property/priority.high", "High"
    ; "logseq.property/priority.urgent", "Urgent" ]

(* ============ block-property-queries ============ *)

let test_block_property_queries () =
  let conn =
    load_test_files
      [ ( { default_page with
            pg_journal = Some 20220228
          ; pg_properties = [ "a", Str "b" ] }
        , [ { default_block with
              b_title = Some "b1"
            ; b_properties = [ "prop-a", Str "val-a"; "prop-num", Int64 2000 ] }
          ; { default_block with
              b_title = Some "b2"
            ; b_properties = [ "prop-a", Str "val-a"; "prop-b", Str "val-b" ] }
          ; { default_block with
              b_title = Some "b3"
            ; b_properties =
                [ "prop-d", Set_ [ build_page_ref ~title:"no-space-link" () ]
                ; ( "prop-c"
                  , Set_
                      [ build_page_ref ~title:"page a" ()
                      ; build_page_ref ~title:"page b" ()
                      ; build_page_ref ~title:"page c" () ] )
                ; ( "prop-linked-title"
                  , Set_
                      [ build_page_ref
                          ~title:"2 [[6a8ead3b-a450-4916-a7e2-d16d0d2b59fd]]"
                          () ] )
                ; "prop-linked-num",
                  Set_ [ build_page_ref ~title:"3000" () ] ] }
          ; { default_block with
              b_title = Some "b4"
            ; b_properties =
                [ "prop-d", Set_ [ build_page_ref ~title:"nada" () ] ] } ] ) ]
  in
  let db = Datascript.db conn in
  let q s = first_lines (dsl_rows db s) in
  expect "prop value" [ "b1"; "b2" ] (sort (q "(property prop-a val-a)") |> List.sort compare);
  expect "prop-b" [ "b2" ] (q "(property prop-b val-b)");
  expect "empty AND" [ "b2" ] (q "(and (property prop-b val-b))");
  expect "value from set" [ "b3" ] (q "(and (property prop-c \"page c\"))");
  expect "ANDed values" [ "b3" ]
    (q "(and (property prop-c \"page c\") (property prop-c \"page b\"))");
  expect "ORed values" [ "b2"; "b3" ]
    (sort (q "(or (property prop-c \"page c\") (property prop-b val-b))"));
  expect "int value" [ "b1" ] (q "(property prop-num 2000)");
  expect "int page value" [ "b3" ] (q "(property prop-linked-num 3000)");
  expect "page-ref literal" [ "b3" ]
    (q
       "(and (property prop-linked-title \"2 \
        [[6a8ead3b-a450-4916-a7e2-d16d0d2b59fd]]\"))");
  expect "no-space value" [ "b3" ] (q "(property prop-d no-space-link)");
  expect "has property" [ "b3"; "b4" ] (sort (q "(property prop-d)"))

(* ============ db-only-block-property-queries ============ *)

let test_db_only_block_property_queries () =
  let conn =
    load_test_files
      ~properties:
        [ ( "zzz"
          , { default_property with
              p_type = "default"; p_title = Some "zzz name!" } ) ]
      [ ( { default_page with pg_title = Some "page1" }
        , [ { default_block with
              b_title = Some "b1"; b_properties = [ "Foo", Str "bar" ] }
          ; { default_block with
              b_title = Some "b2"; b_properties = [ "foo", Str "bar" ] }
          ; { default_block with
              b_title = Some "b3"; b_properties = [ "zzz", Str "bar" ] } ] ) ]
  in
  let db = Datascript.db conn in
  expect "case sensitive" [ "b1" ] (titles (dsl_rows db "(property Foo)"));
  expect "qualified keyword" [ "b2" ]
    (titles (dsl_rows db "(property :user.property/foo)"));
  expect "property name" [ "b3" ]
    (titles (dsl_rows db "(property \"zzz name!\")"))

(* ============ property-default-type-default-value-queries ============ *)

let test_property_default_type_default_value_queries () =
  (* cljs seeds :logseq.property/default-value as an entity-typed pvalue
     (properties-ref-types {:entity :number}) — the property's default-value
     refs an entity titled "foo", which ref->val matches *)
  let pv_uuid = "00000000-0000-4000-8000-00000000df01" in
  let conn =
    load_test_files
      ~properties:
        [ ( "default"
          , { default_property with
              p_type = "default"
            ; p_properties =
                [ ( "logseq.property/default-value"
                  , Vec [ Kw "block/uuid"; Uuid pv_uuid ] ) ] } )
        ]
      ~classes:
        [ "Class1", { default_class with c_class_properties = [ "default" ] } ]
      ~pre_txs:
        [ [ "block/uuid", Uuid pv_uuid; "block/title", Str "foo" ] ]
      [ ( { default_page with pg_title = Some "page1" }
        , [ { default_block with
              b_title = Some "b1"; b_properties = [ "default", Str "foo" ] }
          ; { default_block with
              b_title = Some "b2"; b_properties = [ "default", Str "bar" ] }
          ; { default_block with b_title = Some "b3"; b_tags = [ "Class1" ] } ]
        ) ]
  in
  let db = Datascript.db conn in
  expect "any :default or tagged" [ "b1"; "b2"; "b3" ]
    (sort (titles (dsl_rows db "(property :user.property/default)")));
  expect ":default foo" [ "b1"; "b3" ]
    (titles (dsl_rows db "(property :user.property/default \"foo\")"));
  expect ":default bar" [ "b2" ]
    (titles (dsl_rows db "(property :user.property/default \"bar\")"))

(* ============ property-checkbox-type-default-value-queries ============ *)

let test_property_checkbox_type_default_value_queries () =
  let conn =
    load_test_files
      ~properties:
        [ ( "checkbox"
          , { default_property with
              p_type = "checkbox"
            ; p_properties =
                [ "logseq.property/scalar-default-value", Bool true ] } ) ]
      ~classes:
        [ "Class1", { default_class with c_class_properties = [ "checkbox" ] } ]
      [ ( { default_page with pg_title = Some "page1" }
        , [ { default_block with
              b_title = Some "b1"; b_properties = [ "checkbox", Bool true ] }
          ; { default_block with
              b_title = Some "b2"; b_properties = [ "checkbox", Bool false ] }
          ; { default_block with b_title = Some "b3"; b_tags = [ "Class1" ] } ]
        ) ]
  in
  let db = Datascript.db conn in
  expect "any :checkbox or tagged" [ "b1"; "b2"; "b3" ]
    (sort (titles (dsl_rows db "(property :user.property/checkbox)")));
  expect ":checkbox true" [ "b1"; "b3" ]
    (titles (dsl_rows db "(property :user.property/checkbox true)"));
  expect ":checkbox false" [ "b2" ]
    (titles (dsl_rows db "(property :user.property/checkbox false)"))

(* ============ closed-property-default-value-queries ============ *)

let test_closed_property_default_value_queries () =
  let status_todo_uuid = "00000000-0000-4000-8000-00000000c701" in
  let status_doing_uuid = "00000000-0000-4000-8000-00000000c702" in
  let conn =
    load_test_files
      ~properties:
        [ ( "status"
          , { default_property with
              p_type = "default"
            ; p_closed_values =
                [ { cv_value = "Todo"
                  ; cv_uuid = Some status_todo_uuid
                  ; cv_ident = None
                  ; cv_icon = None
                  ; cv_properties = [] }
                ; { cv_value = "Doing"
                  ; cv_uuid = Some status_doing_uuid
                  ; cv_ident = None
                  ; cv_icon = None
                  ; cv_properties = [] } ]
            ; p_properties =
                [ ( "logseq.property/default-value"
                  , Vec [ Kw "block/uuid"; Uuid status_todo_uuid ] ) ] } )
        ]
      ~classes:
        [ "Mytask", { default_class with c_class_properties = [ "status" ] }
        ; "Bug", { default_class with c_extends = [ "Mytask" ] } ]
      [ ( { default_page with pg_title = Some "page1" }
        , [ { default_block with
              b_title = Some "task1"
            ; b_properties =
                [ ( "status"
                  , Vec [ Kw "block/uuid"; Uuid status_doing_uuid ] ) ]
            ; b_tags = [ "Mytask" ] }
          ; { default_block with b_title = Some "task2"; b_tags = [ "Mytask" ] }
          ; { default_block with
              b_title = Some "bug1"
            ; b_properties =
                [ ( "status"
                  , Vec [ Kw "block/uuid"; Uuid status_doing_uuid ] ) ]
            ; b_tags = [ "Bug" ] }
          ; { default_block with b_title = Some "bug2"; b_tags = [ "Bug" ] } ]
        ) ]
  in
  let db = Datascript.db conn in
  expect "closed default value" [ "bug2"; "task2" ]
    (sort (titles (dsl_rows db "(property status \"Todo\")")));
  expect "closed other value" [ "bug1"; "task1" ]
    (sort (titles (dsl_rows db "(property status \"Doing\")")))

(* ============ cards-query-includes-classes-extending-card ============ *)

let test_cards_query_includes_classes_extending_card () =
  let conn =
    load_test_files
      ~classes:
        [ "Milestone", { default_class with c_extends = [ "logseq.class/Card" ] }
        ; "Project", { default_class with c_extends = [ "Milestone" ] } ]
      [ ( { default_page with pg_title = Some "page1" }
        , [ { default_block with
              b_title = Some "direct card"; b_tags = [ "logseq.class/Card" ] }
          ; { default_block with
              b_title = Some "milestone card"; b_tags = [ "Milestone" ] }
          ; { default_block with
              b_title = Some "project card"; b_tags = [ "Project" ] }
          ; { default_block with b_title = Some "plain" } ] ) ]
  in
  let db = Datascript.db conn in
  let rs = dsl_rows ~opts:(exec_opts ~cards:true ()) db "(page page1)" in
  expect "cards? includes extending classes"
    [ "direct card"; "milestone card"; "project card" ]
    (sort (titles rs))

(* ============ block-property-query-performance ============ *)

let test_block_property_query_performance () =
  let pages =
    List.init 10 (fun idx ->
        ( { default_page with
            pg_title = Some (Printf.sprintf "page%d" idx)
          ; pg_properties = [ "page-prop", Str "b" ] }
        , [ { default_block with
              b_title = Some (Printf.sprintf "block for page%d" idx)
            ; b_properties =
                [ ( "tagz"
                  , Set_
                      [ build_page_ref ~title:"tag1" ()
                      ; build_page_ref ~title:"tag2" () ] ) ] } ] ))
  in
  let conn = load_test_files pages in
  let db = Datascript.db conn in
  let t0 = Unix.gettimeofday () in
  let rs = dsl_rows db "(and (property tagz tag1) (property tagz tag2))" in
  let elapsed = Unix.gettimeofday () -. t0 in
  check "multi property query perf is reasonable" (elapsed < 40.0);
  expect_len "10 results" 10 rs

(* ============ page-property-queries ============ *)

let test_page_property_queries () =
  let conn =
    load_test_files
      [ ( { default_page with
            pg_title = Some "page1"
          ; pg_properties =
              [ ( "parent"
                , Set_
                    [ build_page_ref ~title:"child page 1" ()
                    ; build_page_ref ~title:"child-no-space" () ] )
              ; "interesting", Bool true
              ; "foo", Str "baz" ] }
        , [] )
      ; ( { default_page with
            pg_title = Some "page2"
          ; pg_properties = [ "foo", Str "bar"; "interesting", Bool false ] }
        , [] )
      ; ( { default_page with
            pg_title = Some "page3"
          ; pg_properties =
              [ ( "parent"
                , Set_
                    [ build_page_ref ~title:"child page 1" ()
                    ; build_page_ref ~title:"child page 2" () ] )
              ; "foo", Str "bar"
              ; "interesting", Bool false ] }
        , [] )
      ; ( { default_page with
            pg_title = Some "page4"
          ; pg_properties =
              [ "parent", Set_ [ build_page_ref ~title:"child page 2" () ]
              ; "foo", Str "baz" ] }
        , [] ) ]
  in
  let db = Datascript.db conn in
  let q s = names (dsl_rows db s) in
  expect "has property" [ "page1"; "page3"; "page4" ] (q "(property parent)");
  expect "page value" [ "page1"; "page3" ]
    (sort (q "(property parent [[child page 1]])"));
  expect "string value" [ "page1"; "page3" ]
    (sort (q "(property parent \"child page 1\")"));
  expect "no-space page value" [ "page1" ]
    (q "(property parent [[child-no-space]])");
  expect "ANDed" [ "page3" ]
    (q
       "(and (property parent [[child page 1]]) (property parent [[child \
        page 2]]))");
  expect "ORed" [ "page1"; "page3"; "page4" ]
    (sort
       (q
          "(or (property parent [[child page 1]]) (property parent [[child \
           page 2]]))"));
  expect "nested and-or" [ "page1"; "page3" ]
    (sort
       (q
          "(and (property parent [[child page 1]]) (or (property foo baz) \
           (property parent [[child page 2]])))"));
  expect "nested NOT second" [ "page4" ]
    (q "(and (property parent [[child page 2]]) (not (property foo bar)))");
  expect "nested NOT first" [ "page4" ]
    (q "(and (not (property foo bar)) (property parent [[child page 2]]))");
  expect "boolean true" [ "page1" ] (q "(property interesting true)");
  expect "boolean false" [ "page2"; "page3" ]
    (sort (q "(property interesting false)"))

(* ============ task-queries ============ *)

let test_task_queries () =
  let conn =
    load_test_files
      [ ( { default_page with pg_title = Some "page1" }
        , [ task_block "DONE" "b1"
          ; task_block "TODO" "b2"
          ; task_block "DOING" "b3"
          ; task_block "DOING" "b4 [[A]]"
          ; task_block "DOING" "b5 [[B]]" ] ) ]
  in
  let db = Datascript.db conn in
  let q s = testable (dsl_rows db s) in
  expect "task done" [ "b1" ] (q "(task done)");
  expect "task doing" [ "b3"; "b4"; "b5" ] (sort (q "(task doing)"));
  expect "task DOING upper" [ "b3"; "b4"; "b5" ] (sort (q "(task DOING)"));
  expect "multi args ORed" [ "b1"; "b3"; "b4"; "b5" ]
    (sort (q "(task done doing)"));
  expect "vector args" [ "b1"; "b3"; "b4"; "b5" ]
    (sort (q "(task [done doing])"));
  expect "or + and" [ "b1"; "b4" ] (q "(or (task done) (and (task doing) [[A]]))");
  expect "and + or" [ "b4"; "b5" ] (sort (q "(and (task doing) (or [[A]] [[B]]))"))

(* ============ task-queries-with-multi-word-and-custom-statuses ============ *)

let test_task_queries_multi_word () =
  let conn =
    load_test_files
      [ ( { default_page with pg_title = Some "page1" }
        , [ { default_block with
              b_title = Some "review task"
            ; b_properties =
                [ ( "logseq.property/status"
                  , Kw "logseq.property/status.in-review" ) ] }
          ; { default_block with
              b_title = Some "waiting task"
            ; b_properties =
                [ ( "logseq.property/status"
                  , build_page_ref ~title:"QA Ready" () ) ] } ] ) ]
  in
  let db = Datascript.db conn in
  let q s = testable (dsl_rows db s) in
  expect "In Review" [ "review task" ] (q "(task \"In Review\")");
  expect "in review" [ "review task" ] (q "(task \"in review\")");
  expect "QA Ready" [ "waiting task" ] (q "(task \"QA Ready\")");
  expect "qa ready" [ "waiting task" ] (q "(task \"qa ready\")")

(* ============ queries-with-no-data ============ *)

let test_queries_with_no_data () =
  let conn = load_test_files [] in
  let db = Datascript.db conn in
  expect_len "task todo empty" 0 (dsl_rows db "(task todo)");
  expect_len "priority high empty" 0 (dsl_rows db "(priority high)")

(* ============ sample-queries ============ *)

let test_sample_queries () =
  let conn =
    load_test_files
      [ ( { default_page with
            pg_title = Some "page1"; pg_properties = [ "foo", Str "bar" ] }
        , [ task_block "TODO" "b1"; task_block "TODO" "b2" ] ) ]
  in
  let db = Datascript.db conn in
  expect_len "block sample" 1 (dsl_rows db "(and (task todo) (sample 1))");
  expect_len "page sample" 1 (dsl_rows db "(and (property foo) (sample 1))")

(* ============ priority-queries ============ *)

let test_priority_queries () =
  let conn =
    load_test_files ~pre_txs:priority_closed_values_txs
      [ ( { default_page with pg_title = Some "page1" }
        , [ { default_block with
              b_title = Some "[#A] b1"
            ; b_properties =
                [ ( "logseq.property/priority"
                  , Kw "logseq.property/priority.high" ) ] }
          ; { default_block with
              b_title = Some "[#B] b2"
            ; b_properties =
                [ ( "logseq.property/priority"
                  , Kw "logseq.property/priority.medium" ) ] }
          ; { default_block with
              b_title = Some "[#A] b3"
            ; b_properties =
                [ ( "logseq.property/priority"
                  , Kw "logseq.property/priority.high" ) ] } ] ) ]
  in
  let db = Datascript.db conn in
  let q s = titles (dsl_rows db s) in
  expect "priority high" [ "[#A] b1"; "[#A] b3" ] (sort (q "(priority high)"));
  expect "priority high medium" [ "[#A] b1"; "[#A] b3"; "[#B] b2" ]
    (sort (q "(priority high medium)"));
  expect "priority vector" [ "[#A] b1"; "[#A] b3"; "[#B] b2" ]
    (sort (q "(priority [high medium])"));
  expect "priority three args" [ "[#A] b1"; "[#A] b3"; "[#B] b2" ]
    (sort (q "(priority high medium low)"))

(* ============ priority-queries-with-multi-word-and-custom-values ============ *)

let test_priority_queries_multi_word () =
  let conn =
    load_test_files ~pre_txs:priority_closed_values_txs
      [ ( { default_page with pg_title = Some "page1" }
        , [ { default_block with
              b_title = Some "urgent b"
            ; b_properties =
                [ ( "logseq.property/priority"
                  , build_page_ref ~title:"Very High" () ) ] } ] ) ]
  in
  let db = Datascript.db conn in
  let q s = titles (dsl_rows db s) in
  expect "Very High" [ "urgent b" ] (q "(priority \"Very High\")");
  expect "very high" [ "urgent b" ] (q "(priority \"very high\")")

(* ============ nested-boolean-queries ============ *)

let test_nested_boolean_queries () =
  let conn =
    load_test_files
      [ ( { default_page with
            pg_title = Some "page1"
          ; pg_properties = [ "foo", Str "bar" ] }
        , [ task_block "DONE" "b1 [[page 1]] [[page 3]]"
          ; task_block "DONE" "b2Z [[page 1]]" ] )
      ; ( { default_page with
            pg_title = Some "page2"
          ; pg_properties = [ "foo", Str "bar" ] }
        , [ task_block "DOING" "b3 [[page 1]]"
          ; task_block "TODO" "b4Z [[page 2]]" ] ) ]
  in
  let db = Datascript.db conn in
  let q s = testable (dsl_rows db s) in
  let task_filter = "(task doing todo)" in
  (* cljs uses sorted/set comparisons below *)
  expect_len "not page" 0 (dsl_rows db "(and (task done) (not [[page 1]]))");
  expect "nested not" [ "b1" ]
    (q "(and [[page 1]] (and [[page 3]] (not (task todo))))");
  expect "and-or" [ "b3"; "b4Z" ]
    (sort (q ("(and " ^ task_filter ^ " (or [[page 1]] [[page 2]]))")));
  (* cljs compares as a set — sorted order here *)
  expect "or not" [ "b1"; "b2Z"; "b3"; "b4Z" ]
    (sort
       (q "(and (task doing todo done) (or [[page 1]] (not [[page 1]])))"));
  (* (keep testable-content) (remove page?) *)
  let not_task_or =
    dsl_rows db ("(not (and " ^ task_filter ^ " (or [[page 1]] [[page 2]])))")
    |> testable
    |> List.filter (fun s -> Ldb.get_page db (String s) = None)
  in
  expect "not-and-or" [ "b1"; "b2Z"; "bar" ] (sort not_task_or);
  expect "full-text and-or" [ "b2Z"; "b4Z" ]
    (sort (q "(and \"Z\" (or \"b2\" \"b4\"))"))

(* ============ tags-queries ============ *)

let test_tags_queries () =
  let conn =
    load_test_files
      [ ( { default_page with
            pg_title = Some "page1"; pg_tags = [ "page-tag-1"; "page-tag-2" ] }
        , [] )
      ; ( { default_page with
            pg_title = Some "page2"; pg_tags = [ "page-tag-2"; "page-tag-3" ] }
        , [] )
      ; ( { default_page with pg_title = Some "page3"; pg_tags = [ "other" ] }
        , [] ) ]
  in
  let db = Datascript.db conn in
  let q s = names (dsl_rows db s) in
  expect "tags page-ref" [ "page1" ] (q "(tags [[page-tag-1]])");
  expect "tags symbol" [ "page1"; "page2" ] (sort (q "(tags page-tag-2)"));
  expect "tags two symbols" [ "page1"; "page2" ]
    (sort (q "(tags page-tag-1 page-tag-2)"));
  expect "tags case" [ "page1"; "page2" ]
    (sort (q "(tags page-TAG-1 page-tag-2)"));
  expect "tags vector" [ "page1"; "page2" ]
    (sort (q "(tags [page-tag-1 page-tag-2])"))

(* ============ block-content-query ============ *)

let test_block_content_query () =
  let conn =
    load_test_files
      [ ( { default_page with pg_title = Some "page1" }
        , [ { default_block with b_title = Some "b1 Hit" }
          ; { default_block with b_title = Some "b2 Another" } ] ) ]
  in
  let db = Datascript.db conn in
  expect "content Hit" [ "b1 Hit" ] (titles (dsl_rows db "\"Hit\""));
  expect "content miss" [] (titles (dsl_rows db "\"miss\""))

(* ============ page-queries ============ *)

let test_page_queries () =
  let conn =
    load_test_files
      [ ( { default_page with pg_title = Some "page1" }
        , [ { default_block with b_title = Some "foo" } ] )
      ; ( { default_page with pg_title = Some "page2" }
        , [ { default_block with b_title = Some "bar" } ] ) ]
  in
  let db = Datascript.db conn in
  expect "page1" [ "page1" ] (page_names (dsl_rows db "(page page1)"));
  expect "page nope" [] (page_names (dsl_rows db "(page nope)"))

(* ============ empty-queries ============ *)

let test_empty_queries () =
  let conn = create_conn () in
  let db = Datascript.db conn in
  check "empty string" (Db_query_dsl.execute_query db "" (exec_opts ()) = None);
  check "blank string"
    (Db_query_dsl.execute_query db " " (exec_opts ()) = None);
  check "literal quotes"
    (Db_query_dsl.execute_query db "\"\"" (exec_opts ()) = None)

(* ============ page-ref-and-boolean-queries ============ *)

let test_page_ref_and_boolean_queries () =
  let conn =
    load_test_files
      [ ( { default_page with
            pg_title = Some "page1"
          ; pg_properties = [ "foo", Str "bar" ] }
        , [ { default_block with b_title = Some "b1 [[page 1]] [[tag2]]" }
          ; { default_block with b_title = Some "b2 [[page 2]] [[tag1]]" }
          ; { default_block with b_title = Some "b3" } ] ) ]
  in
  let db = Datascript.db conn in
  let q s = testable (dsl_rows db s) in
  expect "page ref" [ "b2" ] (q "[[page 2]]");
  let uuid =
    match Ldb.get_page db (String "page 2") with
    | Some e -> Test_shared.uuid_of e
    | None -> failwith "page 2 not found"
  in
  expect "uuid page ref" [ "b2" ] (q ("[[" ^ uuid ^ "]]"));
  expect "tag ref" [ "b2" ] (q "#tag1");
  expect_len "nonexistent page" 0 (dsl_rows db "[[blarg]]");
  (* dynamic page variables — cljs re-seeds the same db *)
  let today_title = Ldb.journal_title_of_day 20240704 "MMM do, yyyy" in
  seed_test_files conn
    [ ( { default_page with pg_title = Some "context page" }
      , [ { default_block with b_title = Some "current [[context page]]" }
        ; { default_block with
            b_title = Some ("today [[" ^ today_title ^ "]]") } ] ) ]
    ();
  let db = Datascript.db conn in
  let exec s opts = testable (dsl_rows ~opts db s) in
  expect "current page var" [ "current" ]
    (exec "<% current page %>"
       (exec_opts ~current_page_title:"context page" ()));
  expect "today var" [ "today" ]
    (exec "<% today %>"
       (exec_opts
          ~today_day:
            (match Time.local_date_of_journal_day Time.utc 20240704 with
             | Some d -> d
             | None -> failwith "bad journal day")
          ()));
  (* basic boolean queries *)
  expect "AND" [ "b2" ] (q "(and [[tag1]] [[page 2]])");
  expect "OR" [ "b1"; "b2" ] (q "(or [[tag2]] [[page 2]])");
  expect "OR nonexistent" [ "b1" ] (q "(or [[tag2]] [[page not exists]])");
  (* NOT query filtered to page1 *)
  let not_page2 =
    dsl_rows db "(not [[page 2]])"
    |> List.filter (fun r -> page_names [ r ] = [ "page1" ])
    |> testable
  in
  expect "NOT" [ "b1"; "b3"; "bar" ] (sort not_page2)

(* ============ nested-page-ref-queries ============ *)

let test_nested_page_ref_queries () =
  let conn =
    load_test_files
      [ ( { default_page with pg_title = Some "page1" }
        , [ { default_block with
              b_title = Some "p1 [[Parent page]]"
            ; b_children =
                [ { default_block with b_title = Some "[[Child page]]" } ] }
          ; { default_block with
              b_title = Some "p2 [[Parent page]]"
            ; b_children =
                [ { default_block with b_title = Some "Non linked content" } ]
            } ] ) ]
  in
  let db = Datascript.db conn in
  expect "nested page ref not" [ "Non linked content"; "p1"; "p2" ]
    (sort (testable (dsl_rows db "(and [[Parent page]] (not [[Child page]]))")))

(* ============ between-queries ============ *)

let test_between_queries () =
  let conn =
    load_test_files
      [ ( { default_page with pg_journal = Some 20201226 }
        , [ task_block "DONE" "26-b1"
          ; task_block "TODO" "26-b2-modified-later"
          ; task_block "DONE" "26-b3"
          ; { default_block with
              b_title = Some "26-b4"
            ; b_extra = [ "block/created-at", Int64 1608968448116 ] } ] ) ]
  in
  let db = Datascript.db conn in
  let task_filter = "(task todo done)" in
  expect_len "between tomorrow" 3
    (dsl_rows db
       ("(and " ^ task_filter ^ " (between [[Dec 26th, 2020]] tomorrow))"));
  expect_len "between journal pages" 3
    (dsl_rows db
       ("(and " ^ task_filter
       ^ " (between [[Dec 26th, 2020]] [[Dec 27th, 2020]]))"));
  expect_len "between created-at open" 3
    (dsl_rows db
       "(and (task todo done) (between created-at [[Dec 26th, 2020]]))");
  expect_len "between created-at +1d" 3
    (dsl_rows db
       "(and (task todo done) (between created-at [[Dec 26th, 2020]] +1d))")

(* ============ custom-query-test ============ *)

let custom_query_titles (db : db) (form : string) : string list =
  match Db_query_dsl.execute_custom_query db form (exec_opts ()) with
  | Some rows ->
      List.filter_map
        (function [ r ] -> pulled_str "block/title" r | _ -> None)
        rows
  | None -> []

let test_custom_query () =
  let conn =
    load_test_files
      [ ( { default_page with
            pg_title = Some "page1"
          ; pg_properties = [ "foo", Str "bar" ] }
        , [ task_block "DOING" "b1"
          ; task_block "TODO" "b2"
          ; task_block "TODO" "b3"
          ; { default_block with b_title = Some "b3" } ] ) ]
  in
  let db = Datascript.db conn in
  expect "task doing" [ "b1" ] (custom_query_titles db "(task doing)");
  expect "and + text" [ "b1" ]
    (custom_query_titles db "(and (task doing) \"b\")")

let cases =
  [ Alcotest.test_case "block-property-queries" `Quick
      test_block_property_queries
  ; Alcotest.test_case "db-only-block-property-queries" `Quick
      test_db_only_block_property_queries
  ; Alcotest.test_case "property-default-type-default-value-queries" `Quick
      test_property_default_type_default_value_queries
  ; Alcotest.test_case "property-checkbox-type-default-value-queries" `Quick
      test_property_checkbox_type_default_value_queries
  ; Alcotest.test_case "closed-property-default-value-queries" `Quick
      test_closed_property_default_value_queries
  ; Alcotest.test_case "cards-query-includes-classes-extending-card" `Quick
      test_cards_query_includes_classes_extending_card
  ; Alcotest.test_case "block-property-query-performance" `Quick
      test_block_property_query_performance
  ; Alcotest.test_case "page-property-queries" `Quick
      test_page_property_queries
  ; Alcotest.test_case "task-queries" `Quick test_task_queries
  ; Alcotest.test_case
      "task-queries-with-multi-word-and-custom-statuses" `Quick
      test_task_queries_multi_word
  ; Alcotest.test_case "queries-with-no-data" `Quick test_queries_with_no_data
  ; Alcotest.test_case "sample-queries" `Quick test_sample_queries
  ; Alcotest.test_case "priority-queries" `Quick test_priority_queries
  ; Alcotest.test_case
      "priority-queries-with-multi-word-and-custom-values" `Quick
      test_priority_queries_multi_word
  ; Alcotest.test_case "nested-boolean-queries" `Quick
      test_nested_boolean_queries
  ; Alcotest.test_case "tags-queries" `Quick test_tags_queries
  ; Alcotest.test_case "block-content-query" `Quick test_block_content_query
  ; Alcotest.test_case "page-queries" `Quick test_page_queries
  ; Alcotest.test_case "empty-queries" `Quick test_empty_queries
  ; Alcotest.test_case "page-ref-and-boolean-queries" `Quick
      test_page_ref_and_boolean_queries
  ; Alcotest.test_case "nested-page-ref-queries" `Quick
      test_nested_page_ref_queries
  ; Alcotest.test_case "between-queries" `Quick test_between_queries
  ; Alcotest.test_case "custom-query-test" `Quick test_custom_query ]
