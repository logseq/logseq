(* 1:1 port of deps/graph-parser/test/logseq/graph_parser/extract_test.cljs
   into native OCaml. The cljs file contains 9 deftests; all 9 are ported
   here with the cljs deftest names kept as OCaml test names.

   Sources:
   - deps/graph-parser/test/logseq/graph_parser/extract_test.cljs
     (extract/tri-lb-title-parsing, extract/safe-url-decode,
      extract/path->file-body, extract/extract)

   Skipped cljs cases: none.

   Notes/divergences:
   - cljs (d/empty-db file-schema) uses the bare-minimum
     {:block/uuid, :block/name unique-identity} schema, ported verbatim as
     an EDN schema string.
   - cljs extract options merge {:block-pattern "-" :db db :verbose false}
     with user options; the OCaml extract_options record carries additional
     export/db-graph flags, all disabled here since the cljs tests exercise
     the pure file-graph extract path.
   - cljs `(->> (:blocks result) (mapcat #(->> % :block/refs (map
     :block/name))) set)` collects ref names unordered; the OCaml check
     sorts the name lists before comparing.
   - cljs (string? (tri-lb-title-parsing x)) checks the fn returns a string
     without crashing; OCaml returns string so the checks assert that no
     exception is raised. *)

open Datascript
open Test_shared

(* extract-test/multiplatform-reserved-chars *)
let multiplatform_reserved_chars = ":\\*\\?\"<>|\\#\\\\"

let page_name_parsing_tests () =
  List.iter
    (fun s ->
      check ("tri-lb-title-parsing " ^ s)
        (let _r = Gp_extract.tri_lb_title_parsing s in
         true))
    [ "___-_-_-_---___----"
    ; "_____///____---___----"
    ; "/_/////---/_----"
    ; "/\\#*%lasdf\\//__--dsll_____----....-._0x2B"
    ; "/\\#*%l;;&&;&\\//__--dsll_____----....-._0x2B"
    ; multiplatform_reserved_chars
    ; "dsa&amp&semi;l dsalfjk jkl" ]

let uri_decoding_tests () =
  List.iter
    (fun (x, y) ->
      check ("safe-url-decode " ^ x) (Gp_extract.safe_url_decode x = y))
    [ "%*-sd%%%saf%=lks", "%*-sd%%%saf%=lks"
    ; "%2FDownloads%2FCNN%3AIs%5CAll%3AYou%20Need.pdf",
      "/Downloads/CNN:Is\\All:You Need.pdf"
    ; "asldkflksdaf啦放假啦睡觉啦啊啥的都撒娇浪费；dla",
      "asldkflksdaf啦放假啦睡觉啦啊啥的都撒娇浪费；dla" ]

let page_name_sanitization_backward_tests () =
  List.iter
    (fun (x, y) ->
      check ("tri-lb-title-parsing " ^ x)
        (Gp_extract.tri_lb_title_parsing x = y))
    [ "abc.def.ghi.jkl", "abc.def.ghi.jkl"
    ; "abc%2Fdef%2Fghi%2Fjkl", "abc/def/ghi/jkl"
    ; "abc%25%2Fdef%2Fghi%2Fjkl", "abc%/def/ghi/jkl"
    ; "abc%2——ef%2Fghi%2Fjkl", "abc%2——ef/ghi/jkl"
    ; "abc&amp;2Fghi%2Fjkl", "abc&amp;2Fghi/jkl"
    ; "abc&lt;2Fghi%2Fjkl", "abc&lt;2Fghi/jkl"
    ; "abc&percnt;2Fghi%2Fjkl", "abc&percnt;2Fghi/jkl"
    ; "abc&semi;&;2Fghi%2Fjkl", "abc&semi;&;2Fghi/jkl"
    ; multiplatform_reserved_chars, multiplatform_reserved_chars ]

let path_utils_tests () =
  List.iter
    (fun (x, y) ->
      check ("path->file-body " ^ x)
        (Gp_extract.path_to_file_body x = y))
    [ "/data/app/asldk lakls .lsad", "asldk lakls "
    ; "asldk lakls .lsad", "asldk lakls "
    ; "asldk lakls", "asldk lakls"
    ; "/data/app/asldk lakls", "asldk lakls"
    ; "file://data/app/asldk lakls.as", "asldk lakls"
    ; "file://中文data/app/中文asldk lakls.as", "中文asldk lakls" ]

(* extract-test/file-schema *)
let file_schema () =
  Datascript.schema_of_edn_string
    "{:block/uuid {:db/unique :db.unique/identity} :block/name {:db/unique :db.unique/identity}}"

(* extract-test/extract — cljs (extract/extract file content
   (merge {:block-pattern "-" :db (d/empty-db file-schema) :verbose false}
          options)) *)
let extract ?(options : (attr * value) list = []) (file : string)
    (content : string) : Block_map.t list * Block_map.t list =
  let db = Datascript.empty_db ~schema:(file_schema ()) () in
  let opts : Gp_block.extract_options =
    { user_config = options
    ; block_pattern = "-"
    ; date_formatter = None
    ; db
    ; db_graph_mode = false
    ; export_to_db_graph_flag = false
    ; remove_properties = false
    ; remove_logbook = false
    ; remove_deadline_scheduled = false
    ; page_name = None
    ; filename_format = None
    ; resolve_uuid_fn = (fun _ _ _ _ -> None)
    ; skip_journal = false }
  in
  let pages, blocks, _ast =
    Gp_extract.extract ~file_path:file ~content ~user_config:options
      ~verbose:false opts
  in
  (pages, blocks)

(* extract-test/extract-block-content *)
let extract_block_content (text : string) : string list =
  let _pages, blocks = extract "a.md" text in
  List.filter_map
    (fun b ->
      match Block_map.attr_value b "block/title" with
      | Some (String s) -> Some s
      | _ -> None)
    blocks

(* cljs (:block/properties page) key lookup *)
let props_get (k : string) (v : value) : value option =
  match v with
  | Map kvs ->
      List.find_map
        (fun (kk, vv) ->
          match kk with
          | Keyword s | String s when s = k -> Some vv
          | _ -> None)
        kvs
  | _ -> None

(* extract-test/extract-title *)
let extract_title (file : string) (text : string) : string option =
  let pages, _blocks = extract file text in
  match pages with
  | [] -> None
  | page :: _ ->
      (match Block_map.attr_value page "block/properties" with
       | Some props ->
           (match props_get "title" props with
            | Some (String s) -> Some s
            | _ -> None)
       | None -> None)

(* cljs (->> % :block/refs (map :block/name)) *)
let block_ref_names (b : Block_map.t) : string list =
  match Block_map.attr_value b "block/refs" with
  | Some v ->
      Clj_value.coll_items v
      |> List.filter_map (fun m -> Clj_value.map_get_str m "block/name")
  | None -> []

let extract_blocks_for_headings () =
  check "headings nested"
    (extract_block_content "- a\n  - b\n    - c" = [ "a"; "b"; "c" ]);
  check "headings with ## hello"
    (extract_block_content
       "## hello\n    - world\n      - nice\n        - nice\n      - bingo\n      - world"
    = [ "## hello"; "world"; "nice"; "nice"; "bingo"; "world" ]);
  check "headings mixed"
    (extract_block_content
       "# a\n## b\n### c\n#### d\n### e\n- f\n  - g\n    - h\n  - i\n- j"
    = [ "# a"; "## b"; "### c"; "#### d"; "### e"; "f"; "g"; "h"; "i"
      ; "j" ])

let parse_page_title () =
  check "empty org" (extract_title "foo.org" "" = None);
  check "org title lowercase"
    (extract_title "foo.org" "#+title: Howdy" = Some "Howdy");
  check "org title uppercase"
    (extract_title "foo.org" "#+TITLE: Howdy" = Some "Howdy");
  check "org title mixedcase"
    (extract_title "foo.org" "#+TiTlE: Howdy" = Some "Howdy");
  check "org title with properties drawer uppercase"
    (extract_title "foo.org"
       ":PROPERTIES:\n:ID:       72289d9a-eb2f-427b-ad97-b605a4b8c59b\n:END:\n#+TITLE: diagram/abcdef"
    = Some "diagram/abcdef");
  check "org title with properties drawer lowercase"
    (extract_title "foo.org"
       ":PROPERTIES:\n:ID:       72289d9a-eb2f-427b-ad97-b605a4b8c59b\n:END:\n#+title: diagram/abcdef"
    = Some "diagram/abcdef")

let extract_blocks_with_property_pages_config () =
  let ref_names_of ~options =
    let _pages, blocks =
      extract ~options "a.md" "foo:: #bar\nbaz:: #bing"
    in
    List.concat_map block_ref_names blocks |> List.sort String.compare
  in
  check "property-pages enabled"
    (ref_names_of ~options:[ "property-pages/enabled?", Bool true ]
    = [ "bar"; "baz"; "bing"; "foo" ]);
  check "property-pages disabled"
    (ref_names_of ~options:[ "property-pages/enabled?", Bool false ]
    = [ "bar"; "bing" ])

let test_regression_1902 () =
  check "regression-1902"
    (extract_block_content
       "- line1\n    - line2\n      - line3\n     - line4"
    = [ "line1"; "line2"; "line3"; "line4" ])

let extract_file_links_with_formatted_labels () =
  List.iter
    (fun content ->
      let pages, blocks = extract "note.md" content in
      check ("imports block for " ^ content) (blocks <> []);
      check ("imports pages for " ^ content) (pages <> []);
      let ref_names = List.concat_map block_ref_names blocks in
      check ("plain page-ref for " ^ content) (ref_names = [ "k" ]))
    [ "- [k](a.md)"
    ; "- [~~k~~](a.md)"
    ; "- [**k**](a.md)"
    ; "- [*k*](a.md)" ]

let cases =
  [ Alcotest.test_case "page-name-parsing-tests" `Quick
      page_name_parsing_tests
  ; Alcotest.test_case "uri-decoding-tests" `Quick uri_decoding_tests
  ; Alcotest.test_case "page-name-sanitization-backward-tests" `Quick
      page_name_sanitization_backward_tests
  ; Alcotest.test_case "path-utils-tests" `Quick path_utils_tests
  ; Alcotest.test_case "extract-blocks-for-headings" `Quick
      extract_blocks_for_headings
  ; Alcotest.test_case "parse-page-title" `Quick parse_page_title
  ; Alcotest.test_case "extract-blocks-with-property-pages-config" `Quick
      extract_blocks_with_property_pages_config
  ; Alcotest.test_case "test-regression-1902" `Quick test_regression_1902
  ; Alcotest.test_case "extract-file-links-with-formatted-labels" `Quick
      extract_file_links_with_formatted_labels ]
