(* 1:1 OCaml translation of deps/publishing/test/logseq/publishing/db_test.cljs —
   covers Publishing_db.clean_export / filter_only_public_pages_and_blocks /
   add_missing_built_in_block_timestamps.

   cljs deftest names are kept as OCaml test names.

   Filesystem export is covered by portable artifact tests here and by
   scripts/test-publishing-cli.mjs against the built LUI application. *)

open Datascript
open Test_shared

let views_page_name = "$$$views"

let kw s = Keyword s

(* cljs {:page page-map :blocks [block-map ...]} as a value *)
let pab (page : value) (blocks : value list) : value =
  Map [ kw "page", page; kw "blocks", Vector blocks ]

let block ?(properties : (value * value) list = []) (title : string) : value =
  Map
    ([ kw "block/title", String title ]
     @ if properties = [] then []
       else [ kw "build/properties", Map properties ])

let page ?(properties : (value * value) list = []) (title : string) : value =
  Map
    ([ kw "block/title", String title ]
     @ if properties = [] then []
       else [ kw "build/properties", Map properties ])

(* cljs (db-test/create-conn-with-blocks [...]) *)
let conn_with_blocks (pabs : value list) : conn =
  let conn = Sqlite_export.create_conn () in
  Sqlite_build.create_blocks conn (Vector pabs);
  conn

let result_strings rows =
  List.concat_map
    (List.filter_map (function Result_value (String s) -> Some s | _ -> None))
    rows

let sorted_unique xs = List.sort_uniq compare xs

let page_names (db : db) : string list =
  sorted_unique
    (result_strings
       (Datascript.q_string db
          "[:find [?n ...] :where [?b :block/name ?n]]"))

let block_page_names (db : db) : string list =
  sorted_unique
    (result_strings
       (Datascript.q_string db
          "[:find [?n ...] :where\n\
          \      [?b :block/title]\n\
          \      [?b :block/page ?p]\n\
          \      [(missing? $ ?p :logseq.property/built-in?)]\n\
          \      [?p :block/name ?n]]"))

let subset xs ys = List.for_all (fun x -> List.mem x ys) xs

(* (deftest clean-export! ...) *)
let test_clean_export () =
  let conn =
    conn_with_blocks
      [ pab
          (page "page1"
             ~properties:
               [ kw "logseq.property/publishing-public?", Bool false ])
          [ block "b11"
          ; block "b12"
          ; block "![awesome.png](../assets/awesome_1648822509908_0.png" ]
      ; pab (page "page2")
          [ block "b21"
          ; block "![thumb-on-fire.PNG](../assets/thumb-on-fire_1648822523866_0.PNG)" ]
      ; pab (page "page3") [ block "b31" ] ]
  in
  let filtered_db, _assets = Publishing_db.clean_export (db_of conn) in
  let exported_pages = page_names filtered_db in
  let exported_blocks = block_page_names filtered_db in
  check "Contains all pages that haven't been marked private"
    (subset [ "page2"; "page3" ] exported_pages);
  check "Doesn't contain private page" (not (List.mem "page1" exported_pages));
  Alcotest.(check (list string))
    "Only exports blocks from public pages" [ "page2"; "page3" ]
    exported_blocks

(* (deftest filter-only-public-pages-and-blocks-adds-missing-built-in-page-timestamps
      ...) *)
let test_adds_missing_built_in_page_timestamps () =
  let conn =
    conn_with_blocks
      [ pab
          (page "page1"
             ~properties:
               [ kw "logseq.property/publishing-public?", Bool true ])
          [ block "b1" ]
      ; pab
          (page views_page_name
             ~properties:
               [ kw "logseq.property/built-in?", Bool true
               ; kw "logseq.property/hide?", Bool true ])
          [] ]
  in
  let views_page =
    match block_by_title (db_of conn) views_page_name with
    | Some e -> e
    | None -> failwith "views page missing"
  in
  (* cljs (d/transact! conn [[:db/retract id :block/created-at v] ...]) *)
  let tx_ops =
    List.filter_map
      (fun attr ->
        match Ldb.value views_page attr with
        | Some v -> Some (Retract (Entity_id views_page.id, attr, Some v))
        | None -> None)
      [ "block/created-at"; "block/updated-at" ]
  in
  ignore (Db_tx.transact conn tx_ops);
  let filtered_db, _assets =
    Publishing_db.filter_only_public_pages_and_blocks (db_of conn)
  in
  let exported_views_page =
    match block_by_title filtered_db views_page_name with
    | Some e -> e
    | None -> failwith "exported views page missing"
  in
  check "Missing created-at is added to exported built-in pages"
    (Option.is_some (Ldb.int_value exported_views_page "block/created-at"));
  check "Missing updated-at is added to exported built-in pages"
    (Option.is_some (Ldb.int_value exported_views_page "block/updated-at"));
  let r = Db_validate.validate_db filtered_db in
  check "Publishing DB remains valid after keeping hidden built-in pages"
    (r.errors = [])

(* (deftest filter-only-public-pages-and-blocks ...) *)
let test_filter_only_public_pages_and_blocks () =
  let conn =
    conn_with_blocks
      [ pab
          (page "page1"
             ~properties:
               [ kw "logseq.property/publishing-public?", Bool false ])
          [ block "b11"
          ; block "b12"
          ; block "![awesome.png](../assets/awesome_1648822509908_0.png" ]
      ; pab
          (page "page2"
             ~properties:
               [ kw "logseq.property/publishing-public?", Bool true
               ; ( kw "block/alias"
                 , Set [ Vector [ kw "build/page"
                                ; Map [ kw "block/title"
                                      , String "page2-alias" ] ] ] ) ])
          [ block "b21"
          ; block "![thumb-on-fire.PNG](../assets/thumb-on-fire_1648822523866_0.PNG)" ]
      ; pab
          (page "page3"
             ~properties:
               [ kw "logseq.property/publishing-public?", Bool true ])
          [ block "b31" ] ]
  in
  let filtered_db, _assets =
    Publishing_db.filter_only_public_pages_and_blocks (db_of conn)
  in
  let exported_pages = page_names filtered_db in
  let exported_block_pages = block_page_names filtered_db in
  let page2 =
    match block_by_title filtered_db "page2" with
    | Some e -> e
    | None -> failwith "page2 missing"
  in
  let exported_page2_children =
    sorted_unique
      (List.filter_map
         (fun c -> Ldb.string_value c "block/title")
         (Ldb.get_children page2))
  in
  check "Contains all pages that have been marked public"
    (subset [ "page2"; "page3" ] exported_pages);
  check "Doesn't contain private page" (not (List.mem "page1" exported_pages));
  check "Alias of public page is exported"
    (Option.is_some (block_by_title filtered_db "page2-alias"));
  Alcotest.(check (list string))
    "Only exports blocks from public pages" [ "page2"; "page3" ]
    exported_block_pages;
  check "Public page children are still available through block parent refs"
    (List.mem "b21" exported_page2_children)

let publishing_fixture_conn () =
  let query title match_title =
    Map [ kw "block/title", String title
        ; kw "build/tags", Vector [ kw "logseq.class/Query" ]
        ; kw "build/properties", Map
            [ kw "logseq.property/query", Map
                [ kw "build/property-value", kw "block"
                ; kw "block/title", String (Printf.sprintf
                    "{:query [:find (pull ?b [*]) :where [?b :block/title %S]]}"
                    match_title)
                ; kw "build/properties", Map
                    [ kw "logseq.property.node/display-type", kw "code"
                    ; kw "logseq.property.code/lang", String "clojure" ] ] ] ]
  in
  let conn = conn_with_blocks
    [ pab (page "Home")
        [ block "Published **bold** [[Other]] and $x^2$"
        ; block "Public asset"
        ; query "Published query" "Linked page content"
        ; query "Empty published query" "No published block matches this title"
        ; Map [ kw "block/title", String "Parent"
                ; kw "build/children", Vector [ block "Nested published child" ] ] ]
    ; pab (page "Other") [ block "Linked page content" ]
    ; pab (page "Secret" ~properties:
        [ kw "logseq.property/publishing-public?", Bool false ])
        [ block "Private content must not ship"
        ; block "Private asset" ] ]
  in
  let asset_class = Option.get (Datascript.entity (db_of conn) (Ident "logseq.class/Asset")) in
  List.iter (fun (title, uuid) ->
    let asset = Option.get (block_by_title (db_of conn) title) in
    ignore (Datascript.transact_conn conn
      [ Add (Entity_id asset.id, "block/uuid", Uuid uuid)
      ; Add (Entity_id asset.id, "block/tags", Ref asset_class.id)
      ; Add (Entity_id asset.id, "logseq.property.asset/type", String "png") ]))
    [ "Public asset", "11111111-1111-4111-8111-111111111111"
    ; "Private asset", "22222222-2222-4222-8222-222222222222" ];
  conn

let publishing_fixture () =
  Publishing_html.build_html (db_of (publishing_fixture_conn ()))
    (Map
      [ kw "repo", String "logseq_db_Published"
      ; kw "app-state", Map [ kw "ui/theme", String "dark" ]
      ; kw "repo-config", Map
          [ kw "publishing/all-pages-public?", Bool true
          ; kw "default-home", Map [ kw "page", String "Home" ] ]
      ; kw "html-options", Map [ kw "title", String "Published graph" ] ])

let run_unit task = ignore (await (Db_worker_effect.map (fun () -> Wire.Nil) task))

let write path content =
  run_unit (File_sys.mkdir_p (Filename.dirname path));
  run_unit (File_sys.write_text path content)

let store_fixture graph_dir =
  run_unit (File_sys.mkdir_p graph_dir);
  let conn = publishing_fixture_conn () in
  ignore (Datascript.transact_conn conn
    [ Entity { db_id = Some (Temp_id "config"); attrs =
             [ "file/path", One_value (String "logseq/config.edn")
             ; "file/content", One_value (String
                 "{:publishing/all-pages-public? true :default-home {:page \"Home\"}}") ] } ]);
  let sqlite = Sqlite.open_db ~path:(Filename.concat graph_dir "db.sqlite") in
  Fun.protect ~finally:(fun () -> Sqlite.close sqlite) (fun () ->
    Common_sqlite.create_kvs_table sqlite;
    ignore (Datascript.store ~storage:(Graph_store.storage sqlite) (db_of conn)))

let with_export_dirs f =
  let root = Filename.temp_file "logseq-publishing-export-" "" in
  Sys.remove root;
  run_unit (File_sys.mkdir_p root);
  Fun.protect ~finally:(fun () -> run_unit (File_sys.remove root)) (fun () ->
    let static = Filename.concat root "static" in
    let graph = Filename.concat root "graph" in
    let output = Filename.concat root "output" in
    List.iter (fun part -> run_unit (File_sys.mkdir_p (Filename.concat static part)))
      [ "css"; "icons"; "img"; "js/chunks" ];
    write (Filename.concat static "js/main.js") "import './chunks/lazy.js';";
    write (Filename.concat static "js/chunks/lazy.js") "export const lazy = true;";
    write (Filename.concat static "js/main.js.map") "map";
    write (Filename.concat static "js/chunks/lazy.js.map") "map";
    write (Filename.concat graph "logseq/custom.css") "custom css";
    write (Filename.concat graph "assets/public.png") "public asset";
    write (Filename.concat graph "assets/private.png") "private asset";
    f static graph output)

let test_export_artifact () = with_export_dirs (fun static graph output ->
  run_unit (Publishing_export.create_export "published html" static graph output
    ~notification_fn:(fun _ -> ()) ~asset_filenames:[ "public.png" ] ());
  check "Module entry remains at its original relative path"
    (Sys.file_exists (Filename.concat output "static/js/main.js"));
  check "Lazy chunk is included"
    (Sys.file_exists (Filename.concat output "static/js/chunks/lazy.js"));
  check "Release export strips nested source maps"
    (not (Sys.file_exists (Filename.concat output "static/js/chunks/lazy.js.map")));
  check "Only referenced public assets are copied"
    (Sys.file_exists (Filename.concat output "assets/public.png")
     && not (Sys.file_exists (Filename.concat output "assets/private.png")));
  Alcotest.(check string) "Custom styling is retained" "custom css"
    (await (Db_worker_effect.map (fun s -> Wire.String s)
       (File_sys.read_text (Filename.concat output "static/css/custom.css")))
     |> Wire.as_string |> Option.get);
  let dev_output = output ^ "-dev" in
  run_unit (Publishing_export.create_export "dev html" static graph dev_output
    ~notification_fn:(fun _ -> ()) ~dev:true ());
  check "Development export retains nested source maps"
    (Sys.file_exists (Filename.concat dev_output "static/js/chunks/lazy.js.map")))

let test_export_failure () = with_export_dirs (fun static graph output ->
  write output "occupied by a file";
  let error = ref None in
  Db_worker_effect.on_any
    (Publishing_export.create_export "html" static graph output
       ~notification_fn:(fun _ -> ()) ())
    (fun () -> ()) (fun exn -> error := Some exn);
  check "Export failure is returned to its caller" (!error <> None))

let test_publishing_frontend () =
  (match Sys.getenv_opt "LOGSEQ_PUBLISHING_GRAPH" with
   | Some graph -> store_fixture graph
   | None -> ());
  let result = publishing_fixture () in
  let html = match result with
    | Map fields -> (match List.assoc_opt (kw "html") fields with
        | Some (String s) -> s | _ -> failwith "HTML missing")
    | _ -> failwith "export result missing"
  in
  (match Sys.getenv_opt "LOGSEQ_PUBLISHING_FIXTURE" with
   | Some path -> let out = open_out path in output_string out html; close_out out
   | None -> ());
  check "Publishing loads the LUI module entry"
    (Str.string_match (Str.regexp ".*<script type=\"module\" src=\"static/js/main.js\".*")
       (String.concat " " (String.split_on_char '\n' html)) 0);
  check "Publishing never includes private content"
    (not ((let needle = "Private content must not ship" in
      let rec contains i = i + String.length needle <= String.length html
        && (String.sub html i (String.length needle) = needle || contains (i + 1)) in
      contains 0)))

let test_memory_api () =
  let conn = conn_with_blocks
      [ pab (page "Home") [ block "Visible block" ]
      ; pab (page "Other") [ block "Reference [[Home]]" ] ] in
  let transit = Transit_codec.to_string
      (Ds_wire.transit_of_serializable_db (Datascript.serializable (db_of conn))) in
  let repo = "logseq_db_MemoryPublished" in
  Publishing_memory.open_db repo transit;
  check "Publishing uses memory DataScript"
    (Datascript.storage (db_of (Endpoint_db.require_conn repo)) = None);
  let call name args =
    let result = ref None and error = ref None in
    Publishing_memory.invoke_transit name
      (Transit_codec.to_string (Wire.Array args))
      (fun value -> result := Some (Transit_codec.of_string value))
      (fun exn -> error := Some exn);
    !result, !error
  in
  let result, error = call "thread-api/get-page-blocks-tree"
      [ Wire.String repo; Wire.String "Home"; Wire.Nil ] in
  check "Existing page tree API runs directly" (error = None && result <> Some Wire.Nil);
  let uuid = Option.get (Ldb.uuid_value
      (Option.get (block_by_title (db_of conn) "Visible block")) "block/uuid") in
  let result, error = call "thread-api/get-blocks"
      [ Wire.String repo; Wire.Array [ Wire.kw_map
          [ "id", Wire.Uuid uuid
          ; "opts", Wire.kw_map [ "block-metadata?", Wire.Bool true ] ] ] ] in
  check "Block metadata reads do not require a sync database"
    (error = None && result <> None && not (Sync_state.has_client_ops_conn repo));
  let result, error = call "thread-api/search-blocks"
      [ Wire.String repo; Wire.String "Visible"; Wire.kw_map
          [ "include-matched-count?", Wire.Bool true
          ; "enable-snippet?", Wire.Bool false ] ] in
  check "Search operates without SQLite" (error = None);
  (match result with
   | Some w -> (match Wire.get "items" w with
       | Some (Wire.Array (first :: _)) ->
           Alcotest.(check (option string)) "Best search match" (Some "Visible block")
             (Option.bind (Wire.get "block/title" first) Wire.as_string) | _ -> failwith ("Missing memory search result: " ^ Transit_codec.to_string w))
   | _ -> failwith "Memory search failed");
  let result, error = call "thread-api/get-view-data"
      [ Wire.String repo; Wire.Nil; Wire.Map
          [ Wire.keyword "view-feature-type", Wire.keyword "all-pages"
          ; Wire.keyword "render?", Wire.Bool true ] ] in
  check "Read-only default view loads without creating a view" (error = None);
  (match result with
   | Some w -> check "View contains published page rows"
       (match Wire.get "rows" w with Some (Wire.Array (_ :: _)) -> true | _ -> false)
   | None -> failwith "View data missing");
  let home = Option.get (block_by_title (db_of conn) "Home") in
  let result, error = call "thread-api/get-view-data"
      [ Wire.String repo; Wire.Nil; Wire.kw_map
          [ "view-feature-type", Wire.keyword "linked-references"
          ; "view-for-id", Wire.Int home.id
          ; "render?", Wire.Bool true ] ] in
  check "Default linked references do not require a persisted view" (error = None);
  (match result with
   | Some w -> Alcotest.(check (option int)) "Default backlinks contain the reference"
       (Some 1) (match Wire.get "count" w with Some (Wire.Int n) -> Some n | _ -> None)
   | None -> failwith "Default backlinks missing");
  let fixture = publishing_fixture_conn () in
  let fixture_repo = "logseq_db_DefaultPublishedViews" in
  Publishing_memory.open_db fixture_repo
    (Transit_codec.to_string
       (Ds_wire.transit_of_serializable_db (Datascript.serializable (db_of fixture))));
  List.iter (fun (feature, owner, count, extra) ->
    let owner = Option.get (Datascript.entity (db_of fixture) (Ident owner)) in
    let result, error = call "thread-api/get-view-data"
      [ Wire.String fixture_repo; Wire.Nil; Wire.kw_map
          ([ "view-feature-type", Wire.Keyword feature
           ; "view-for-id", Wire.Int owner.id
           ; "render?", Wire.Bool true ] @ extra) ] in
    check ("Default " ^ feature ^ " succeeds") (error = None);
    match result with
    | Some w -> Alcotest.(check (option int)) ("Default " ^ feature ^ " rows")
        (Some count) (Option.bind (Wire.get "count" w) Wire.as_int)
    | None -> failwith ("Missing " ^ feature))
    [ "property-objects", "logseq.property.asset/type", 2, []
    ; "class-objects", "logseq.class/Asset", 2,
        [ "group-by-property-ident", Wire.Keyword "block/page" ] ];
  let _, error = call "thread-api/apply-outliner-ops" [ Wire.String repo; Wire.Array [] ] in
  check "Publishing rejects graph mutations" (error <> None);
  check "Publishing never opens a SQLite graph" (Worker_state.sqlite_conn repo = None)

let test_memory_search () =
  let conn = conn_with_blocks
      [ pab (page "Published search")
          [ block "Published search alpha"
          ; block "Published search beta"
          ; block "Café 搜索"
          ; block "Published search hidden" ~properties:
              [ kw "logseq.property/hide?", Bool true ] ]
      ; pab (page "Other")
          [ block "Published search code" ~properties:
              [ kw "logseq.property.node/display-type", kw "code" ] ] ] in
  let repo = "logseq_db_PublishedSearch" in
  Publishing_memory.open_db repo
    (Transit_codec.to_string
       (Ds_wire.transit_of_serializable_db (Datascript.serializable (db_of conn))));
  let search query opts =
    let result = ref None in
    Publishing_memory.invoke_transit "thread-api/search-blocks"
      (Transit_codec.to_string (Wire.Array
         [ Wire.String repo; Wire.String query; Wire.kw_map opts ]))
      (fun value -> result := Some (Transit_codec.of_string value)) raise;
    match !result with Some value -> value | None -> failwith "Search did not complete" in
  let rows = function Wire.Array rows -> rows | _ -> failwith "Expected search rows" in
  let titles rows = List.filter_map
      (fun row -> Option.bind (Wire.get "block.temp/original-title" row) Wire.as_string) rows in
  let result = search "Published search" [ "enable-snippet?", Wire.Bool false ] in
  Alcotest.(check (list string)) "Ranked public titles from memory datoms"
    [ "Published search"; "Published search beta"; "Published search code"
    ; "Published search alpha" ] (titles (rows result));
  let result = search "Published search"
      [ "limit", Wire.Int 1; "include-matched-count?", Wire.Bool true
      ; "include-breadcrumb?", Wire.Bool true ] in
  Alcotest.(check int) "Limit applies to result rows" 1
    (List.length (rows (Option.get (Wire.get "items" result))));
  Alcotest.(check (option int)) "Count is computed before limit" (Some 4)
    (Option.bind (Wire.get "matched-count" result) Wire.as_int);
  let result = search "Published search"
      [ "page-only?", Wire.Bool true ] in
  Alcotest.(check (list string)) "Page-only search" [ "Published search" ]
    (titles (rows result));
  let result = search "Published search"
      [ "code-only?", Wire.Bool true; "include-breadcrumb?", Wire.Bool true ] in
  Alcotest.(check (list string)) "Code-only search" [ "Published search code" ]
    (titles (rows result));
  check "Block search retains breadcrumbs"
    (match rows result with
     | [ row ] -> Wire.get "block.temp/breadcrumb" row <> None
     | _ -> false);
  let page_uuid = Ldb.uuid_value
      (Option.get (block_by_title (db_of conn) "Published search")) "block/uuid" in
  let result = search "Published search"
      [ "page", Wire.String (Option.get page_uuid) ] in
  Alcotest.(check (list string)) "Page-scoped search"
    [ "Published search beta"; "Published search alpha" ] (titles (rows result));
  Alcotest.(check (list string)) "Unicode and accent-normalized search" [ "Café 搜索" ]
    (titles (rows (search "cafe 搜索" [])));
  Alcotest.(check int) "Blank search" 0 (List.length (rows (search "  " [])));
  Alcotest.(check int) "No matching title" 0
    (List.length (rows (search "unmatch987654321" [])));
  Alcotest.(check int) "Zero limit" 0
    (List.length (rows (search "Published search" [ "limit", Wire.Int 0 ])));
  check "Search does not open a SQLite graph" (Worker_state.sqlite_conn repo = None)

let () =
  Alcotest.run "publishing"
    [ ( "publishing"
      , [ Alcotest.test_case "memory publishing API" `Quick test_memory_api
        ; Alcotest.test_case "memory publishing search" `Quick test_memory_search
        ; Alcotest.test_case "LUI publishing frontend" `Quick test_publishing_frontend
        ; Alcotest.test_case "portable export artifact" `Quick test_export_artifact
        ; Alcotest.test_case "export failure" `Quick test_export_failure
        ; Alcotest.test_case "clean-export!" `Quick test_clean_export
        ; Alcotest.test_case
            "filter-only-public-pages-and-blocks-adds-missing-built-in-page-timestamps"
            `Quick test_adds_missing_built_in_page_timestamps
        ; Alcotest.test_case "filter-only-public-pages-and-blocks" `Quick
            test_filter_only_public_pages_and_blocks ] ) ]
