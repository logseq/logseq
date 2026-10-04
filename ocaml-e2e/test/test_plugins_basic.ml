(** Port of plugins_basic_test.clj. *)

open Fest.Promise

module Page = Ls_page
module K = Keyboard
module Assert = E2e_assert
module Json = Js.Json

let env = Fixtures.shared_open_page ()

let plugin_ident property_name =
  ":plugin.property._test_plugin/" ^ property_name

let property_idx = ref 0

let new_property () =
  incr property_idx;
  "test-property-" ^ string_of_int !property_idx

let get o k = Js.Nullable.toOption (Api.get o k)
let get_s o k = Api.get_string o k
let get_i o k = Api.get_int o k
let get_b o k = Api.get_bool o k

let get_list o k =
  match get o k with
  | Some v -> Js.Json.decodeArray v
  | None -> None

let get_json o k = get o k

let first arr = arr.(0)

let call env name args = Api.ls_api_call env name args
let s = Json.string
let n = Json.number
let b = Json.boolean
let o = Api.obj
let a = Json.array

let uuid_of v = Option.get (get_s v "uuid")
let id_of v = Option.get (get_i v "id")

(** clj: (assert-api-ls-block! ret-or-uuid & [count]) *)
let assert_api_ls_block env ?(count = 1) ret_or_uuid =
  let uuid =
    match get_s ret_or_uuid "uuid" with
    | Some u -> u
    | None -> Js.Json.decodeString ret_or_uuid
  in
  match uuid with
  | Some uuid ->
      let* () = Assert.have_count env ("#ls-block-" ^ uuid) count in
      Js.Promise.resolve uuid
  | None -> Js.Promise.reject (Failure "assert_api_ls_block: no uuid")

let () =
  Fest.Promise.test "editor-apis-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Page.new_page env "test-block-apis" in
    let* _ =
      call env "ui.showMsg" [| s "hello world"; s "info" |]
    in
    let* ret =
      call env "editor.appendBlockInPage"
        [| s "test-block-apis"; s "append-block-in-page-0" |]
    in
    let* ret1 =
      call env "editor.appendBlockInPage"
        [| s "append-block-in-current-page-0" |]
    in
    let* uuid = assert_api_ls_block env ret in
    let* _ = assert_api_ls_block env ret1 in
    let* inserted =
      call env "editor.insertBlock" [| s uuid; s "insert-0" |]
    in
    let* _ = assert_api_ls_block env inserted in
    let* _ =
      call env "editor.updateBlock"
        [| s uuid; s "append-but-updated-0" |]
    in
    let* () = K.esc env in
    let* _ =
      Pw.wait_for env ".block-title-wrap:text('append-but-updated-0')"
    in
    let* _ = call env "editor.removeBlock" [| s uuid |] in
    let* _ = assert_api_ls_block env ~count:0 (s uuid) in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "append-block-in-page-stays-at-page-root-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Page.new_page env "test-append-block-root" in
    let* page = call env "editor.getPage" [| s "test-append-block-root" |] in
    let* root =
      call env "editor.appendBlockInPage"
        [| s "test-append-block-root"; s "root" |]
    in
    let* nested =
      call env "editor.insertBlock"
        [| s (uuid_of root); s "nested-1";
           o [ ("sibling", b false) ] |]
    in
    let* _ =
      call env "editor.insertBlock"
        [| s (uuid_of nested); s "nested-2";
           o [ ("sibling", b true) ] |]
    in
    let* appended =
      call env "editor.appendBlockInPage"
        [| s "test-append-block-root"; s "appended" |]
    in
    let* appended_block =
      call env "editor.getBlock" [| s (uuid_of appended) |]
    in
    let parent_id =
      match get appended_block "parent" with
      | Some p -> get_i p "id"
      | None -> None
    in
    Fest.deep_equal parent_id (get_i page "id") Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "block-properties-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Page.new_page env "test-block-properties-apis" in
    let* ret =
      call env "editor.appendBlockInPage"
        [| s "test-block-properties-apis";
           s "block-in-page-0";
           o [ ("properties", o [ ("new-p1", n 1.) ]) ] |]
    in
    let* uuid = assert_api_ls_block env ret in
    let* prop1 =
      call env "editor.getBlockProperty" [| s uuid; s "new-p1" |]
    in
    let* props1 =
      call env "editor.getBlockProperties" [| s uuid; s "new-p1" |]
    in
    let* props2 =
      call env "editor.getPageProperties"
        [| s "test-block-properties-apis" |]
    in
    let* _ = Pw.wait_for env ".property-k:text('new-p1')" in
    Fest.deep_equal (get_i prop1 "value") (Some 1) Fest.expect;
    Fest.deep_equal
      (get_s prop1 "ident")
      (Some ":plugin.property._test_plugin/new-p1")
      Fest.expect;
    Fest.deep_equal
      (Option.map (fun v -> Js.Json.decodeNumber v)
         (get props1 ":plugin.property._test_plugin/new-p1"))
      (Some (Some 1.))
      Fest.expect;
    let tags =
      match get props2 ":block/tags" with
      | Some v -> (
          match Js.Json.decodeArray v with
          | Some arr ->
              Array.map
                (fun x ->
                  Js.Json.decodeString x |> Option.value ~default:"?")
                arr
              |> Array.to_list
          | None -> [])
      | None -> []
    in
    Fest.deep_equal tags [ "Page" ] Fest.expect;
    let* _ =
      call env "editor.upsertBlockProperty"
        [| s uuid; s "p2"; s "p2" |]
    in
    let* _ =
      call env "editor.upsertBlockProperty"
        [| s uuid; s "p3"; b true |]
    in
    let* _ =
      call env "editor.upsertBlockProperty"
        [| s uuid; s "p4";
           o [ ("a", n 1.); ("b", a [| n 2.; n 3. |]) ] |]
    in
    let* prop2 =
      call env "editor.getBlockProperty" [| s uuid; s "p2" |]
    in
    let* prop3 =
      call env "editor.getBlockProperty" [| s uuid; s "p3" |]
    in
    let* prop4 =
      call env "editor.getBlockProperty" [| s uuid; s "p4" |]
    in
    let* _ = Pw.wait_for env ".property-k:text('p2')" in
    Fest.deep_equal (get_s prop2 "value") (Some "p2") Fest.expect;
    Fest.deep_equal
      (Js.Json.decodeBoolean
         (Js.Nullable.toOption prop3
          |> Option.value ~default:Json.null))
      (Some true) Fest.expect;
    let expected_p4 =
      o [ ("a", n 1.); ("b", a [| n 2.; n 3. |]) ]
    in
    let* _ =
      (* deep-compare p4 via JSON.stringify inside the page *)
      Pw.eval_js env
        (Printf.sprintf
           "(() => JSON.stringify(%s) === JSON.stringify(%s))()"
           (Pw.json_stringify prop4)
           (Pw.json_stringify expected_p4))
      |> Js.Promise.then_ (fun (v : bool) ->
             Fest.deep_equal v true Fest.expect;
             Js.Promise.resolve ())
    in
    let* _ =
      call env "editor.removeBlockProperty" [| s uuid; s "p4" |]
    in
    let* () = Util.wait_timeout env 16. in
    let* p4_el = Pw.find_one_by_text env ".property-k" "p4" in
    Fest.deep_equal (Option.is_none p4_el) true Fest.expect;
    let* _ =
      call env "editor.upsertBlockProperty"
        [| s uuid; s "p3"; b false |]
    in
    let* _ =
      call env "editor.upsertBlockProperty"
        [| s uuid; s "p2"; s "p2-updated" |]
    in
    let* _ =
      Pw.wait_for env ".block-title-wrap:text('p2-updated')"
    in
    let* props = call env "editor.getBlockProperties" [| s uuid |] in
    Fest.deep_equal
      (Option.map Js.Json.decodeBoolean
         (get props ":plugin.property._test_plugin/p3"))
      (Some (Some false)) Fest.expect;
    Fest.deep_equal
      (Option.map Js.Json.decodeString
         (get props ":plugin.property._test_plugin/p2"))
      (Some (Some "p2-updated")) Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "property-upsert-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let p = new_property () in
    let* _ = call env "editor.upsertProperty" [| s p |] in
    let* property = call env "editor.getProperty" [| s p |] in
    Fest.deep_equal (get_s property "type") (Some "default") Fest.expect;
    Fest.deep_equal
      (get_s property "cardinality")
      (Some ":db.cardinality/one") Fest.expect;
    let p = new_property () in
    let* _ =
      call env "editor.upsertProperty"
        [| s p;
           o [ ("type", s "number"); ("cardinality", s "one") ] |]
    in
    let* property = call env "editor.getProperty" [| s p |] in
    Fest.deep_equal (get_s property "type") (Some "number") Fest.expect;
    Fest.deep_equal
      (get_s property "cardinality")
      (Some ":db.cardinality/one") Fest.expect;
    let p = new_property () in
    let* _ =
      call env "editor.upsertProperty"
        [| s p;
           o [ ("type", s "number"); ("cardinality", s "many") ] |]
    in
    let* property = call env "editor.getProperty" [| s p |] in
    Fest.deep_equal (get_s property "type") (Some "number") Fest.expect;
    Fest.deep_equal
      (get_s property "cardinality")
      (Some ":db.cardinality/many") Fest.expect;
    let* _ =
      call env "editor.upsertProperty"
        [| s p; o [ ("type", s "default") ] |]
    in
    let* property = call env "editor.getProperty" [| s p |] in
    Fest.deep_equal (get_s property "type") (Some "default") Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "property-related-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let rec go = function
      | [] -> Js.Promise.resolve ()
      | property_type :: rest ->
          let property_name = new_property () in
          let* _ =
            call env "editor.upsertProperty"
              [| s property_name;
                 o [ ("type", s property_type) ] |]
          in
          let* property =
            call env "editor.getProperty" [| s property_name |]
          in
          Fest.deep_equal
            (get_s property "ident")
            (Some (plugin_ident property_name))
            Fest.expect;
          Fest.deep_equal
            (get_s property "type")
            (Some property_type) Fest.expect;
          let* _ =
            call env "editor.removeProperty" [| s property_name |]
          in
          let* gone =
            call env "editor.getProperty" [| s property_name |]
          in
          Fest.deep_equal (Js.Nullable.toOption gone) None Fest.expect;
          go rest
    in
    let* () =
      go
        [ "default"; "number"; "date"; "datetime"; "checkbox"; "url";
          "node"; "json"; "string" ]
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "insert-block-with-properties" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let page = "insert-block-properties-test" in
    let* () = Page.new_page env page in
    let* b1 =
      call env "editor.insertBlock"
        [| s page;
           s "b1";
           o
             [ ( "properties",
                 o
                   [ ("x1", b true);
                     ("x2", s "https://logseq.com");
                     ("x3", n 1.);
                     ("x4", a [| n 1. |]);
                     ("x5", o [ ("foo", s "bar") ]);
                     ("x6", s "Page x");
                     ("x7", a [| s "Page y"; s "Page z" |]);
                     ("x8", s "some content") ] );
               ( "schema",
                 o
                   [ ("x6", o [ ("type", s "page") ]);
                     ("x7", o [ ("type", s "page") ]) ] ) ] |]
    in
    Fest.deep_equal
      (Option.map Js.Json.decodeBoolean (get b1 (plugin_ident "x1")))
      (Some (Some true)) Fest.expect;
    let prop_ref key = get b1 (plugin_ident key) in
    let get_block_of v = call env "editor.getBlock" [| v |] in
    let* x2_block = get_block_of (Option.get (prop_ref "x2")) in
    Fest.deep_equal
      (get_s x2_block "title")
      (Some "https://logseq.com") Fest.expect;
    let* x3_block = get_block_of (Option.get (prop_ref "x3")) in
    Fest.deep_equal
      (get_i x3_block ":logseq.property/value")
      (Some 1) Fest.expect;
    let* x4_block =
      get_block_of (Option.get (get_list b1 (plugin_ident "x4"))).(0)
    in
    Fest.deep_equal
      (get_i x4_block ":logseq.property/value")
      (Some 1) Fest.expect;
    Fest.deep_equal
      (Option.map Js.Json.decodeString (get b1 (plugin_ident "x5")))
      (Some (Some {|{"foo":"bar"}|}))
      Fest.expect;
    let* page_x = get_block_of (Option.get (prop_ref "x6")) in
    Fest.deep_equal (get_s page_x "name") (Some "page x") Fest.expect;
    let x7_names =
      match get_list b1 (plugin_ident "x7") with
      | Some arr -> Array.to_list arr
      | None -> []
    in
    let* names =
      Js.Promise.all
        (Array.of_list
           (List.map
              (fun r ->
                get_block_of r
                |> Js.Promise.then_ (fun blk ->
                       Js.Promise.resolve
                         (Option.get (get_s blk "name"))))
              x7_names))
    in
    Fest.deep_equal (Array.to_list names) [ "page y"; "page z" ] Fest.expect;
    let* x8_block = get_block_of (Option.get (prop_ref "x8")) in
    Fest.deep_equal
      (get_s x8_block "title") (Some "some content") Fest.expect;
    Fest.deep_equal
      (Option.is_some (get x8_block "page"))
      true Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "update-block-with-properties" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let page = "update-block-properties-test" in
    let* () = Page.new_page env page in
    let* block =
      call env "editor.insertBlock" [| s page; s "b1" |]
    in
    let block_uuid = uuid_of block in
    let* _ =
      call env "editor.updateBlock"
        [| s block_uuid;
           s "b1-new-content";
           o
             [ ( "properties",
                 o
                   [ ("y1", b true);
                     ("y2", s "https://logseq.com");
                     ("y3", n 1.);
                     ("y4", a [| n 1. |]);
                     ("y5", o [ ("foo", s "bar") ]);
                     ("y6", s "Page x");
                     ("y7", a [| s "Page y"; s "Page z" |]);
                     ("y8", s "some content") ] );
               ( "schema",
                 o
                   [ ("y6", o [ ("type", s "page") ]);
                     ("y7", o [ ("type", s "page") ]) ] ) ] |]
    in
    let* b1 = call env "editor.getBlock" [| s block_uuid |] in
    let in_id key =
      match get b1 (plugin_ident key) with
      | Some v -> get_i v "id"
      | None -> None
    in
    Fest.deep_equal
      (Option.map Js.Json.decodeBoolean (get b1 (plugin_ident "y1")))
      (Some (Some true)) Fest.expect;
    let* y2_block =
      call env "editor.getBlock"
        [| n (float_of_int (Option.get (in_id "y2"))) |]
    in
    Fest.deep_equal
      (get_s y2_block "title")
      (Some "https://logseq.com") Fest.expect;
    let* y3_block =
      call env "editor.getBlock"
        [| n (float_of_int (Option.get (in_id "y3"))) |]
    in
    Fest.deep_equal
      (get_i y3_block ":logseq.property/value")
      (Some 1) Fest.expect;
    let y4_id =
      match get_list b1 (plugin_ident "y4") with
      | Some arr -> Option.value ~default:(-1) (get_i arr.(0) "id")
      | None -> -1
    in
    let* y4_block =
      call env "editor.getBlock" [| n (float_of_int y4_id) |]
    in
    Fest.deep_equal
      (get_i y4_block ":logseq.property/value")
      (Some 1) Fest.expect;
    Fest.deep_equal
      (Option.map Js.Json.decodeString (get b1 (plugin_ident "y5")))
      (Some (Some {|{"foo":"bar"}|}))
      Fest.expect;
    let* page_x =
      call env "editor.getBlock"
        [| n (float_of_int (Option.get (in_id "y6"))) |]
    in
    Fest.deep_equal (get_s page_x "name") (Some "page x") Fest.expect;
    let y7_ids =
      match get_list b1 (plugin_ident "y7") with
      | Some arr -> Array.to_list arr
      | None -> []
    in
    let* names =
      Js.Promise.all
        (Array.of_list
           (List.map
              (fun r ->
                let id =
                  match get_i r "id" with
                  | Some i -> i
                  | None -> (
                      match Js.Json.decodeNumber r with
                      | Some n -> int_of_float n
                      | None -> -1)
                in
                call env "editor.getBlock" [| n (float_of_int id) |]
                |> Js.Promise.then_ (fun blk ->
                       Js.Promise.resolve
                         (Option.get (get_s blk "name"))))
              y7_ids))
    in
    Fest.deep_equal (Array.to_list names) [ "page y"; "page z" ] Fest.expect;
    let* y8_block =
      call env "editor.getBlock"
        [| n (float_of_int (Option.get (in_id "y8"))) |]
    in
    Fest.deep_equal
      (get_s y8_block "title") (Some "some content") Fest.expect;
    Fest.deep_equal
      (Option.is_some (get y8_block "page"))
      true Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "insert-batch-blocks-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let page = "insert batch blocks" in
    let* () = Page.new_page env page in
    let* page_obj = call env "editor.getBlock" [| s page |] in
    let page_uuid = uuid_of page_obj in
    let b111 = o [ ("content", s "b1.1.1") ] in
    let b112 = o [ ("content", s "b1.1.2") ] in
    let b11 =
      o [ ("content", s "b1.1");
          ("children", a [| b111; b112 |]) ]
    in
    let b12 = o [ ("content", s "b1.2") ] in
    let b1 =
      o [ ("content", s "b1"); ("children", a [| b11; b12 |]) ]
    in
    let b2 = o [ ("content", s "b2") ] in
    let* result =
      call env "editor.insertBatchBlock"
        [| s page_uuid; a [| b1; b2 |] |]
    in
    let* contents = Util.get_page_blocks_contents env in
    Fest.deep_equal
      (Array.to_list contents)
      [ "b1"; "b1.1"; "b1.1.1"; "b1.1.2"; "b1.2"; "b2" ]
      Fest.expect;
    let titles =
      match Js.Json.decodeArray result with
      | Some arr ->
          Array.map
            (fun x -> Option.get (get_s x "title"))
            arr
          |> Array.to_list
      | None -> []
    in
    Fest.deep_equal
      titles
      [ "b1"; "b1.1"; "b1.1.1"; "b1.1.2"; "b1.2"; "b2" ]
      Fest.expect;
    (* insert batch blocks with properties *)
    let page2 = "insert batch blocks with properties" in
    let* () = Page.new_page env page2 in
    let* page_obj = call env "editor.getBlock" [| s page2 |] in
    let page_uuid = uuid_of page_obj in
    let b111 =
      o [ ("content", s "b1.1.1");
          ( "properties",
            o
              [ ("z3", s "Page 1");
                ("z4", a [| s "Page 2"; s "Page 3" |]) ] ) ]
    in
    let b112 = o [ ("content", s "b1.1.2") ] in
    let b11 =
      o [ ("content", s "b1.1");
          ("children", a [| b111; b112 |]) ]
    in
    let b12 = o [ ("content", s "b1.2") ] in
    let b1 =
      o [ ("content", s "b1");
          ("children", a [| b11; b12 |]);
          ("properties", o [ ("z1", s "test"); ("z2", b true) ]) ]
    in
    let b2 = o [ ("content", s "b2") ] in
    let* result =
      call env "editor.insertBatchBlock"
        [| s page_uuid;
           a [| b1; b2 |];
           o [ ( "schema",
                 o [ ("z3", s "page"); ("z4", s "page") ] ) ] |]
    in
    let* _ =
      Assert.is_visible env ".block-title-wrap:text('Page 3')"
    in
    let* contents = Util.get_page_blocks_contents env in
    Fest.deep_equal
      (Array.to_list contents)
      [ "b1"; "test"; "b1.1"; "b1.1.1"; "Page 1"; "Page 2"; "Page 3";
        "b1.1.2"; "b1.2"; "b2" ]
      Fest.expect;
    let first_block =
      (Js.Json.decodeArray result |> Option.get).(0)
    in
    Fest.deep_equal
      (Option.map Js.Json.decodeBoolean
         (get first_block (plugin_ident "z2")))
      (Some (Some true)) Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "create-page-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* result = call env "editor.createPage" [| s "Test page 1" |] in
    Fest.deep_equal (get_s result "title") (Some "Test page 1") Fest.expect;
    let first_tag =
      match get_list result "tags" with
      | Some arr -> arr.(0)
      | None -> Json.null
    in
    let* tag = call env "editor.getBlock" [| first_tag |] in
    Fest.deep_equal
      (get_s tag "ident") (Some ":logseq.class/Page") Fest.expect;
    (* create page with properties *)
    let* result =
      call env "editor.createPage"
        [| s "Test page 2";
           o
             [ ("px1", s "test");
               ("px2", n 1.);
               ("px3", s "Page 1");
               ("px4", a [| s "Page 2"; s "Page 3" |]) ];
           o
             [ ( "schema",
                 o
                   [ ("px3", o [ ("type", s "page") ]);
                     ("px4", o [ ("type", s "page") ]) ] ) ] |]
    in
    let* page = call env "editor.getBlock" [| s "Test page 2" |] in
    Fest.deep_equal (get_s result "title") (Some "Test page 2") Fest.expect;
    let first_tag =
      match get_list result "tags" with
      | Some arr -> arr.(0)
      | None -> Json.null
    in
    let* tag = call env "editor.getBlock" [| first_tag |] in
    Fest.deep_equal
      (get_s tag "ident") (Some ":logseq.class/Page") Fest.expect;
    let in_id key =
      match get page (plugin_ident key) with
      | Some v -> (
          match get_i v "id" with
          | Some i -> i
          | None -> (
              match Js.Json.decodeNumber v with
              | Some n -> int_of_float n
              | None -> -1))
      | None -> -1
    in
    let* px1 =
      call env "editor.getBlock"
        [| n (float_of_int (in_id "px1")) |]
    in
    Fest.deep_equal (get_s px1 "title") (Some "test") Fest.expect;
    let* px2 =
      call env "editor.getBlock"
        [| n (float_of_int (in_id "px2")) |]
    in
    Fest.deep_equal
      (get_i px2 ":logseq.property/value") (Some 1) Fest.expect;
    let* page_1 =
      call env "editor.getBlock"
        [| n (float_of_int (in_id "px3")) |]
    in
    Fest.deep_equal (get_s page_1 "name") (Some "page 1") Fest.expect;
    let px4_ids =
      match get_list page (plugin_ident "px4") with
      | Some arr -> Array.to_list arr
      | None -> []
    in
    let* names =
      Js.Promise.all
        (Array.of_list
           (List.map
              (fun r ->
                let id =
                  match get_i r "id" with
                  | Some i -> i
                  | None -> (
                      match Js.Json.decodeNumber r with
                      | Some n -> int_of_float n
                      | None -> -1)
                in
                call env "editor.getBlock" [| n (float_of_int id) |]
                |> Js.Promise.then_ (fun blk ->
                       Js.Promise.resolve
                         (Option.get (get_s blk "name"))))
              px4_ids))
    in
    Fest.deep_equal (Array.to_list names) [ "page 2"; "page 3" ] Fest.expect;
    (* create tag page *)
    let* result =
      call env "editor.createPage"
        [| s "Tag new"; o []; o [ ("class", b true) ] |]
    in
    let first_tag =
      match get_list result "tags" with
      | Some arr -> arr.(0)
      | None -> Json.null
    in
    let* tag = call env "editor.getBlock" [| first_tag |] in
    Fest.deep_equal
      (get_s tag "ident") (Some ":logseq.class/Tag") Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "get-all-tags-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* result = call env "editor.get_all_tags" [||] in
    let built_in =
      [ ":logseq.class/Template"; ":logseq.class/Query";
        ":logseq.class/Math-block"; ":logseq.class/Task";
        ":logseq.class/Code-block"; ":logseq.class/Card";
        ":logseq.class/Quote-block"; ":logseq.class/Cards" ]
    in
    let idents =
      match Js.Json.decodeArray result with
      | Some arr ->
          Array.map
            (fun x -> Option.value ~default:"" (get_s x "ident"))
            arr
          |> Array.to_list
      | None -> []
    in
    Fest.deep_equal
      (List.for_all (fun t -> List.mem t idents) built_in)
      true Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "get-all-properties-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* result = call env "editor.get_all_properties" [||] in
    let count =
      match Js.Json.decodeArray result with
      | Some arr -> Array.length arr
      | None -> 0
    in
    Fest.deep_equal (count >= 20) true Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "get-tag-objects-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let page = "tag objects test" in
    let* () = Page.new_page env page in
    let* _ =
      call env "editor.insertBlock"
        [| s page;
           s "task 1";
           o
             [ ( "properties",
                 o
                   [ ("logseq.property/status", s "Doing") ] ) ] |]
    in
    let* result =
      call env "editor.get_tag_objects" [| s "logseq.class/Task" |]
    in
    let arr = Js.Json.decodeArray result |> Option.value ~default:[||] in
    Fest.deep_equal (Array.length arr) 1 Fest.expect;
    Fest.deep_equal
      (get_s arr.(0) "title") (Some "task 1") Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "create-and-get-tag-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let title = "book1" in
    let title_ident = ":plugin.class._test_plugin/book1" in
    let* tag1 = call env "editor.createTag" [| s title |] in
    let* tag2 = call env "editor.getTag" [| s title |] in
    let* tag3 = call env "editor.getTag" [| s title_ident |] in
    let* tag4 =
      call env "editor.getTag" [| s (uuid_of tag1) |]
    in
    Fest.deep_equal (get_s tag1 "ident") (Some title_ident) Fest.expect;
    Fest.deep_equal (get_s tag2 "ident") (Some title_ident) Fest.expect;
    Fest.deep_equal (get_s tag3 "title") (Some title) Fest.expect;
    Fest.deep_equal (get_s tag4 "title") (Some title) Fest.expect;
    (* create tag with tagProperties *)
    let tag_props =
      a
        [| o [ ("name", s "prop1") ];
           o [ ("name", s "prop2");
               ("schema", o [ ("type", s "number") ]) ];
           o [ ("name", s "prop3");
               ("schema", o [ ("type", s "checkbox") ]) ] |]
    in
    let* tag =
      call env "editor.createTag"
        [| s "tag-with-props"; o [ ("tagProperties", tag_props) ] |]
    in
    let props_count =
      match get tag ":logseq.property.class/properties" with
      | Some v -> (
          match Js.Json.decodeArray v with
          | Some arr -> Array.length arr
          | None -> 0)
      | None -> 0
    in
    Fest.deep_equal props_count 3 Fest.expect;
    (* add and remove tag extends *)
    let* tag1 = call env "editor.createTag" [| s "tag1" |] in
    let* tag2 = call env "editor.createTag" [| s "tag2" |] in
    let* tag3 = call env "editor.createTag" [| s "tag3" |] in
    let id1 = id_of tag1 in
    let id2 = id_of tag2 in
    let id3 = id_of tag3 in
    let* _ =
      call env "editor.addTagExtends"
        [| n (float_of_int id1); n (float_of_int id2) |]
    in
    let* tag1 =
      call env "editor.getTag" [| n (float_of_int id1) |]
    in
    let extends_ids () =
      match get tag1 ":logseq.property.class/extends" with
      | Some v -> (
          match Js.Json.decodeArray v with
          | Some arr ->
              Array.map
                (fun x ->
                  int_of_float (Option.get (Js.Json.decodeNumber x)))
                arr
              |> Array.to_list
          | None -> [])
      | None -> []
    in
    Fest.deep_equal (extends_ids ()) [ id2 ] Fest.expect;
    let* _ =
      call env "editor.addTagExtends"
        [| n (float_of_int id1); n (float_of_int id3) |]
    in
    let* tag1 =
      call env "editor.getTag" [| n (float_of_int id1) |]
    in
    let extends_ids () =
      match get tag1 ":logseq.property.class/extends" with
      | Some v -> (
          match Js.Json.decodeArray v with
          | Some arr ->
              Array.map
                (fun x ->
                  int_of_float (Option.get (Js.Json.decodeNumber x)))
                arr
              |> Array.to_list
          | None -> [])
      | None -> []
    in
    Fest.deep_equal (extends_ids ()) [ id2; id3 ] Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "get-tags-by-name-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* tag1 = call env "editor.createTag" [| s "product" |] in
    let* result = call env "editor.getTagsByName" [| s "product" |] in
    let arr = Js.Json.decodeArray result |> Option.value ~default:[||] in
    Fest.deep_equal (Array.length arr) 1 Fest.expect;
    Fest.deep_equal
      (get_s arr.(0) "uuid")
      (get_s tag1 "uuid") Fest.expect;
    Fest.deep_equal
      (get_s arr.(0) "title")
      (get_s tag1 "title") Fest.expect;
    (* case-insensitive *)
    let tag_name = "TestTag123" in
    let* _ = call env "editor.createTag" [| s tag_name |] in
    let* lower = call env "editor.getTagsByName" [| s "testtag123" |] in
    let* upper = call env "editor.getTagsByName" [| s "TESTTAG123" |] in
    let* mixed = call env "editor.getTagsByName" [| s "TeStTaG123" |] in
    let len r =
      Js.Json.decodeArray r |> Option.value ~default:[||] |> Array.length
    in
    Fest.deep_equal (len lower) 1 Fest.expect;
    Fest.deep_equal (len upper) 1 Fest.expect;
    Fest.deep_equal (len mixed) 1 Fest.expect;
    let first_uuid r =
      Js.Json.decodeArray r
      |> Option.map (fun a -> Option.get (get_s a.(0) "uuid"))
    in
    Fest.deep_equal (first_uuid lower) (first_uuid upper) Fest.expect;
    Fest.deep_equal (first_uuid lower) (first_uuid mixed) Fest.expect;
    (* non-existent tag *)
    let* result =
      call env "editor.getTagsByName" [| s "NonExistentTag12345" |]
    in
    Fest.deep_equal (len result) 0 Fest.expect;
    (* filters out non-tag pages *)
    let* () = Page.new_page env "regular-page" in
    let* result =
      call env "editor.getTagsByName" [| s "regular-page" |]
    in
    Fest.deep_equal (len result) 0 Fest.expect;
    (* similar names *)
    let* _ = call env "editor.createTag" [| s "category" |] in
    let* _ = call env "editor.createTag" [| s "Category" |] in
    let* result = call env "editor.getTagsByName" [| s "category" |] in
    let arr = Js.Json.decodeArray result |> Option.value ~default:[||] in
    Fest.deep_equal (Array.length arr >= 1) true Fest.expect;
    Fest.deep_equal
      (Option.is_some (get_s arr.(0) "uuid"))
      true Fest.expect;
    Fest.deep_equal
      (Option.is_some (get_s arr.(0) "title"))
      true Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "set-property-node-tags" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let property_name = new_property () in
    let* _ =
      call env "editor.upsertProperty"
        [| s property_name; o [ ("type", s "node") ] |]
    in
    let* tag1 = call env "editor.createTag" [| s "Tag A" |] in
    let* tag2 = call env "editor.createTag" [| s "Tag B" |] in
    let ids =
      a [| n (float_of_int (id_of tag1)); n (float_of_int (id_of tag2)) |]
    in
    let* _ =
      call env "editor.setPropertyNodeTags"
        [| s property_name; ids |]
    in
    let* property =
      call env "editor.getProperty" [| s property_name |]
    in
    let node_tags =
      match get property ":logseq.property/classes" with
      | Some v -> (
          match Js.Json.decodeArray v with
          | Some arr ->
              Array.map
                (fun x ->
                  int_of_float (Option.get (Js.Json.decodeNumber x)))
                arr
              |> Array.to_list
          | None -> [])
      | None -> []
    in
    Fest.deep_equal
      (List.sort compare node_tags)
      (List.sort compare [ id_of tag1; id_of tag2 ])
      Fest.expect;
    Fixtures.validate_graph env)
