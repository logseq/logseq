(* 1:1 translations of deps/common/test cljs unit tests.

   Sources:
   - deps/common/test/logseq/common/path_test.cljs — all deftests
     (filename is also covered under test_db_common_native)
   - deps/common/test/logseq/common/util_test.cljs —
     extract-file-extension?, escape-regex-chars, safe-subs, timestamp-ms
     (url? is covered under test_db_common_native; valid-edn-keyword?
     covered under test_db_frontend_native)
   - deps/common/test/logseq/common/config_test.cljs — all deftests
   - deps/common/test/logseq/common/graph_dir_test.cljs — all deftests
     (repo->encoded-graph-dir-name-encodes-special-characters and
     graph-name-whitespace-boundaries are covered under
     test_db_common_native)
   - deps/common/test/logseq/common/graph_registry_test.cljs — all deftests
   - deps/common/test/logseq/common/graph_test.cljs — all deftests
     (native fs via runtime/native File_sys)

   cljs deftest names are kept as OCaml test names.

   cljs type divergence: safe-subs accepts non-strings in cljs; the OCaml
   signature is string-typed so those cases are covered by construction.

   cljs (map #(str "/" %) files) for remove-hidden-files is inlined as
   List.map. *)

open Datascript
open Test_shared

(* ---------- helpers ---------- *)

(* await for non-Wire effects (File_sys calls). *)
let run_fx (t : 'a Db_worker_effect.t) : 'a =
  let result = ref None in
  Db_worker_effect.on_any t (fun v -> result := Some v) (fun e -> raise e);
  match !result with Some v -> v | None -> failwith "effect not resolved"

let opt_eq name (a : string option) (b : string option) = check name (a = b)

let str_list_eq name a b = check name (a = b)

(* cljs (are [x y] (= (f x) y)) *)
let are_opt name f cases =
  List.iter
    (fun (x, y) -> opt_eq (name ^ " " ^ x) (f x) (Some y))
    cases

let are_bool name f cases =
  List.iter (fun (x, y) -> check (name ^ " " ^ x) (f x = y)) cases

(* ---------- deps/common path_test.cljs ---------- *)

(* deftest filename *)
let test_filename () =
  opt_eq "filename /path/to/dir/" (Common_path.filename "/path/to/dir/") None;
  opt_eq "filename file-name"
    (Common_path.filename "/path/to/dir/file-name")
    (Some "file-name");
  opt_eq "filename dir/file-name"
    (Common_path.filename "dir/file-name")
    (Some "file-name")

(* deftest split-ext *)
let test_split_ext () =
  let cases =
    [ ("some-song.MP3", ("some-song", "mp3")); ("some-song", ("some-song", ""))
    ; ("some-file.edn.txt", ("some-file.edn", "txt")) ]
  in
  List.iter
    (fun (x, y) -> check (Printf.sprintf "split-ext %S" x) (Common_path.split_ext x = y))
    cases

(* deftest path-join *)
let test_path_join () =
  let cases =
    [ ("foo", [ "bar" ], "foo/bar")
    ; ("foo/", [ "bar" ], "foo/bar")
    ; ("", [ "foo"; "bar" ], "foo/bar") (* global dir *)
    ; ("/foo/bar//baz/asdf/quux/..", [], "/foo/bar/baz/asdf")
    ; ("assets:///foo.bar", [ "baz" ], "assets:///foo.bar/baz")
    ; ("assets:///foo.bar/", [ "baz" ], "assets:///foo.bar/baz")
    ; ("file://", [ "D:/a.txt" ], "file:///D:/a.txt")
    ; ("file://", [ "c:/x" ], "file:///c:/x")
    ; ("//NAS/MyGraph", [ "logseq/config.edn" ], "//NAS/MyGraph/logseq/config.edn")
    ]
  in
  List.iter
    (fun (base, segs, y) ->
      check
        (Printf.sprintf "path-join %S %s" base (String.concat " " segs))
        (Common_path.path_join base segs = y))
    cases

(* deftest prepend-protocol *)
let test_prepend_protocol () =
  let cases =
    [ ("/home/logseq/graph", "file:///home/logseq/graph")
    ; ("C:/Graph/pages", "file:///C:/Graph/pages")
    ; ("//NAS/MyGraph", "file://NAS/MyGraph") (* Windows UNC URL *) ]
  in
  List.iter
    (fun (p, y) ->
      check
        (Printf.sprintf "prepend-protocol %S" p)
        (Common_path.prepend_protocol "file:" p = y))
    cases

(* deftest file-url-or-path->path *)
let test_file_url_or_path_to_path () =
  are_opt "file-url-or-path->path"
    (fun s -> Some (Common_path.file_url_or_path_to_path s))
    [ ("file:///D:/a.txt", "D:/a.txt")
    ; ("file:///c:/x", "c:/x")
    ; ("file://NAS/share/x", "//nas/share/x")
    ; ("file:///D%3A/a.txt", "D:/a.txt")
    ; ("file:///home/admin/a.txt", "/home/admin/a.txt")
    ; ("/D:/a.txt", "/D:/a.txt")
    ; ("/D:\\a.txt", "/D:\\a.txt")
    ; ("/home/admin/a.txt", "/home/admin/a.txt") ]

(* deftest path-absolute *)
let test_path_absolute () =
  are_bool "absolute?" Common_path.absolute
    [ ("D:\\sources\\sources.md", true)
    ; ("/home/xxx/logseq/test.md", true)
    ; ("logseq/test.md", false)
    ; ("test.md", false)
    ; ("test", false)
    ; ("D:test.md", false) ]

(* deftest protocol-url *)
let test_protocol_url () =
  are_bool "protocol-url?" Common_path.protocol_url
    [ ("mailto:help@logseq.com", true)
    ; ("https://logseq.com", true)
    ; ("ftp://logseq.com", true)
    ; ("file:///home/xxx/logseq/test.md", true)
    ; ("assets:///home/xxx/logseq/test.md", true)
    ; ("logseq/test.md", false)
    ; ("test.md", false)
    ; ("test", false)
    ; ("D:test.md", false) ]

(* deftest invalid-or-bare-protocol-urls *)
let test_invalid_or_bare_protocol_urls () =
  (* invalid or bare protocol URLs do not crash *)
  check "url-to-path assets:// is a string"
    (String.length (Common_path.url_to_path "assets://") >= 0);
  check "url-to-path file:// is a string"
    (String.length (Common_path.url_to_path "file://") >= 0);
  check "path-join assets:// foo"
    (Common_path.path_join "assets://" [ "foo" ] = "assets:///foo");
  check "path-join file:// assets:// is a string"
    (String.length (Common_path.path_join "file://" [ "assets://" ]) >= 0);
  check "url-normalize assets:// is a string"
    (String.length (Common_path.url_normalize "assets://") >= 0)

(* ---------- deps/common util_test.cljs ---------- *)

(* deftest extract-file-extension? *)
let test_extract_file_extension () =
  let cases =
    [ ("foo.bar", Some "bar"); ("foo", None)
    ; ("foo.bar.baz", Some "baz")
    ; ("../assets/audio.mp3", Some "mp3")
    ; (* From https://www.w3.org/TR/media-frags/ *)
      ("../assets/audio.mp3?t=10,20", Some "mp3")
    ; ("../assets/audio.mp3?t=10,20#t=10", Some "mp3")
    ; ("/root/Documents/audio.mp3", Some "mp3")
    ; ("C:\\Users\\foo\\Documents\\audio.mp3", Some "mp3")
    ; ("/root/Documents/audio", None)
    ; ("/root/Documents/audio.", None)
    ; ("special/characters/aäääöüß.7z", Some "7z")
    ; ("asldk lakls .lsad", Some "lsad")
    ; ("中文asldk lakls .lsad", Some "lsad") ]
  in
  List.iter
    (fun (x, y) ->
      opt_eq (Printf.sprintf "path->file-ext %S" x)
        (Common_util.path_to_file_ext x)
        y)
    cases

(* deftest escape-regex-chars — the escaped output must be a valid regex
   that re-matches the original string. *)
let test_escape_regex_chars () =
  let cases = [ "[[page-name]]"; "end-with-backslash\\"; "\\[]{}().+*?|$^" ] in
  List.iter
    (fun x ->
      let re = Regexp.compile (Common_util.escape_regex_chars x) in
      check (Printf.sprintf "escape-regex-chars %S" x) (Regexp.test re x))
    cases

(* deftest safe-subs *)
let test_safe_subs () =
  (* behaves like subs for in-range indices *)
  are_opt "safe-subs"
    (fun args -> Some args)
    [];
  let check_subs name s start end_ y =
    check name
      (Common_util.safe_subs s start ?end_ () = y)
  in
  check_subs "safe-subs hello 1 3" "hello" 1 (Some 3) "el";
  check_subs "safe-subs hello 2" "hello" 2 None "llo";
  check_subs "safe-subs hello 0 5" "hello" 0 (Some 5) "hello";
  (* clamps out-of-range indices instead of throwing *)
  check_subs "safe-subs hello 0 99" "hello" 0 (Some 99) "hello";
  check_subs "safe-subs hello 99 99" "hello" 99 (Some 99) "";
  check_subs "safe-subs hello 99" "hello" 99 None ""
  (* cljs also exercises nil and 42 — non-string inputs; untestable in
     OCaml since safe_subs is string-typed (no crash path to assert). *)

(* deftest timestamp-ms *)
let test_timestamp_ms () =
  (* keeps positive epoch-ms numbers *)
  check "timestamp-ms epoch" (Common_util.timestamp_ms (Int 1577934245000) = Some 1577934245000L);
  (* reads Date.getTime — 2020-01-02T03:04:05.000Z *)
  check "timestamp-ms Date"
    (Common_util.timestamp_ms (Instant 1577934245000L) = Some 1577934245000L);
  (* treats missing and non-positive values as absent *)
  List.iter
    (fun v -> check "timestamp-ms absent" (Common_util.timestamp_ms v = None))
    [ Nil; Int 0; Int (-1); Instant 0L;
      String "2020-01-02T03:04:05.000Z"; Float Float.nan ]

(* ---------- deps/common config_test.cljs ---------- *)

(* deftest remove-hidden-files *)
let test_remove_hidden_files () =
  let files =
    [ "pages/foo.md"; "pages/bar.md"; "script/README.md"; "script/config.edn"
    ; "dev/README.md"; "dev/config.edn" ]
  in
  let config =
    [ ("hidden", Vector [ String "script"; String "/dev" ]) ]
  in
  (* Removes hidden relative files *)
  str_list_eq "remove-hidden-files relative"
    (Common_config.remove_hidden_files files config Fun.id)
    [ "pages/foo.md"; "pages/bar.md" ];
  (* Removes hidden files if they start with '/' *)
  let slashed = List.map (fun f -> "/" ^ f) files in
  str_list_eq "remove-hidden-files slashed"
    (Common_config.remove_hidden_files slashed config Fun.id)
    [ "/pages/foo.md"; "/pages/bar.md" ]

(* deftest local-relative-asset? *)
let test_local_relative_asset () =
  are_bool "local-relative-asset?" Common_config.local_relative_asset
    [ ("assets/test.png", true)
    ; ("../assets/test.png", true)
    ; ("./assets/test.png", true)
    ; ("assets://", false)
    ; ("assets://test.png", false)
    ; ("http://assets/test.png", false)
    ; ("file://assets/test.png", false)
    ; (* Windows backslash paths *)
      ("assets\\test.png", true) ]

(* deftest graph-repo-names-trim-surrounding-whitespace *)
let test_graph_repo_names_trim () =
  List.iter
    (fun repo ->
      check (Printf.sprintf "strip-leading-db-version-prefix %S" repo)
        (Common_config.strip_leading_db_version_prefix repo = "demo");
      opt_eq (Printf.sprintf "canonicalize-db-version-repo %S" repo)
        (Common_config.canonicalize_db_version_repo repo)
        (Some "logseq_db_demo"))
    [ "  demo  "; "  logseq_db_demo  "; "logseq_db_ demo " ];
  opt_eq "canonicalize-db-version-repo blank"
    (Common_config.canonicalize_db_version_repo "   ") None

(* ---------- deps/common graph_dir_test.cljs ---------- *)

(* deftest repo->graph-dir-key-strips-db-prefix *)
let test_repo_to_graph_dir_key_strips () =
  (* db-prefixed repo is mapped to prefix-free graph dir key *)
  opt_eq "repo->graph-dir-key" (Graph_dir.repo_to_graph_dir_key "logseq_db_demo")
    (Some "demo")

(* deftest repo->graph-dir-key-keeps-prefix-free-name *)
let test_repo_to_graph_dir_key_keeps () =
  (* prefix-free repo remains unchanged *)
  opt_eq "repo->graph-dir-key" (Graph_dir.repo_to_graph_dir_key "demo")
    (Some "demo")

(* deftest decode-graph-dir-name-decodes-only-canonical-encoded-names *)
let test_decode_graph_dir_name () =
  (* encoded graph dirs decode back to the logical graph dir key *)
  opt_eq "decode foo~2Fbar"
    (Graph_dir.decode_graph_dir_name "foo~2Fbar")
    (Some "foo/bar");
  (* legacy graph-dir encodings are not accepted *)
  opt_eq "decode foo++bar" (Graph_dir.decode_graph_dir_name "foo++bar") None;
  opt_eq "decode a+3A+b" (Graph_dir.decode_graph_dir_name "a+3A+b") None

(* deftest decode-legacy-graph-dir-name-derives-only-legacy-compatible-names *)
let test_decode_legacy_graph_dir_name () =
  (* legacy token encoding decodes into graph name *)
  opt_eq "legacy foo++bar"
    (Graph_dir.decode_legacy_graph_dir_name "foo++bar")
    (Some "foo/bar");
  opt_eq "legacy a+3A+b"
    (Graph_dir.decode_legacy_graph_dir_name "a+3A+b")
    (Some "a:b");
  (* legacy uri-encoded names decode when valid *)
  opt_eq "legacy space%20name"
    (Graph_dir.decode_legacy_graph_dir_name "space%20name")
    (Some "space name");
  (* invalid or canonical names are ignored *)
  opt_eq "legacy foo~2Fbar"
    (Graph_dir.decode_legacy_graph_dir_name "foo~2Fbar") None;
  opt_eq "legacy bad%ZZname"
    (Graph_dir.decode_legacy_graph_dir_name "bad%ZZname") None

(* ---------- deps/common graph_registry_test.cljs ---------- *)

(* cljs map literals as Wire.t *)
let wire_map kvs = Wire.Map (List.map (fun (k, v) -> (Wire.Keyword k, v)) kvs)
let wire_get_kw (k : string) (w : Wire.t) : Wire.t option = Wire.get k w

(* deftest registry-normalizes-graph-name-whitespace *)
let test_registry_normalizes_graph_name_whitespace () =
  let entries =
    Graph_registry.upsert_entry []
      (wire_map
         [ ("graph-id", Wire.String "graph-id")
         ; ("repo", Wire.String " logseq_db_space name ")
         ; ("graph-name", Wire.String " space name ") ])
  in
  (match entries with
   | [ entry ] ->
       check "repo trimmed"
         (wire_get_kw "repo" entry = Some (Wire.String "logseq_db_space name"));
       check "graph-name trimmed"
         (wire_get_kw "graph-name" entry = Some (Wire.String "space name"));
       List.iter
         (fun identifier ->
           match
             Graph_registry.resolve_target entries ~graph_id:None
               ~graph_identifier:(Some identifier)
           with
           | Some e ->
               check (Printf.sprintf "resolve-target %S" identifier)
                 (wire_get_kw "graph-id" e = Some (Wire.String "graph-id"))
           | None ->
               check (Printf.sprintf "resolve-target %S" identifier) false)
         [ " space name "; " logseq_db_space name "; "logseq_db_ space name " ]
   | _ -> check "upsert-entry returns one entry" false)

(* ---------- deps/common graph_test.cljs ----------

   The cljs tests write a fixture under tmp/ via fs; the OCaml port uses
   the same layout under a per-run directory in cwd. *)

let test_tmp_root = "tmp/test-common-graph"

let rec mkdir_p_dir path =
  if not (Sys.file_exists path) then begin
    (match Filename.dirname path with
     | "." -> ()
     | parent when parent <> path -> mkdir_p_dir parent
     | _ -> ());
    Unix.mkdir path 0o755
  end

let write_file path contents =
  mkdir_p_dir (Filename.dirname path);
  let oc = open_out_bin path in
  output_string oc contents;
  close_out oc

let create_logseq_graph dir =
  mkdir_p_dir (Filename.concat dir "logseq");
  mkdir_p_dir (Filename.concat dir "journals");
  mkdir_p_dir (Filename.concat dir "pages")

let reset_tmp_root () =
  if Sys.file_exists test_tmp_root then
    ignore (run_fx (File_sys.remove test_tmp_root));
  mkdir_p_dir test_tmp_root

(* deftest get-files *)
let test_get_files () =
  reset_tmp_root ();
  let dir = test_tmp_root ^ "/test-graph" in
  create_logseq_graph dir;
  (* Create files that are recognized *)
  write_file (dir ^ "/pages/foo.md") "";
  write_file (dir ^ "/journals/2023_05_09.md") "";
  mkdir_p_dir (dir ^ "/mirror/markdown-notes");
  mkdir_p_dir (dir ^ "/mirror/markdown2");
  write_file (dir ^ "/mirror/markdown-notes/foo.md") "";
  write_file (dir ^ "/mirror/markdown2/foo.md") "";
  (* Create files that are ignored *)
  mkdir_p_dir (dir ^ "/logseq/bak");
  mkdir_p_dir (dir ^ "/mirror/markdown/pages");
  write_file (dir ^ "/logseq/bak/baz.md") "";
  write_file (dir ^ "/logseq/.gitignore") "";
  write_file (dir ^ "/mirror/markdown/pages/foo.md") "";
  let files = run_fx (Common_graph.get_files dir) in
  (* cljs asserts a fixed vector, but the order is readdir order, not
     sorted — compare as sorted lists so the assertion stays the full
     file set without depending on filesystem entry order. *)
  str_list_eq "get-files"
    (List.sort String.compare files)
    (List.sort String.compare
       [ dir ^ "/journals/2023_05_09.md"
       ; dir ^ "/mirror/markdown-notes/foo.md"
       ; dir ^ "/mirror/markdown2/foo.md"
       ; dir ^ "/pages/foo.md" ])

(* deftest ignored-markdown-mirror-path-honors-directory-boundary-test *)
let test_ignored_markdown_mirror_path () =
  let dir = test_tmp_root ^ "/test-graph" in
  check "ignored mirror/markdown"
    (Common_graph.ignored_path dir (dir ^ "/mirror/markdown"));
  check "ignored mirror/markdown/pages/foo.md"
    (Common_graph.ignored_path dir (dir ^ "/mirror/markdown/pages/foo.md"));
  check "not ignored mirror/markdown-notes/foo.md"
    (not
       (Common_graph.ignored_path dir
          (dir ^ "/mirror/markdown-notes/foo.md")));
  check "not ignored mirror/markdown2/foo.md"
    (not (Common_graph.ignored_path dir (dir ^ "/mirror/markdown2/foo.md")))

(* ---------- suite ---------- *)

let () =
  Alcotest.run "common"
    [ ( "path_test"
      , [ Alcotest.test_case "filename" `Quick test_filename
        ; Alcotest.test_case "split-ext" `Quick test_split_ext
        ; Alcotest.test_case "path-join" `Quick test_path_join
        ; Alcotest.test_case "prepend-protocol" `Quick test_prepend_protocol
        ; Alcotest.test_case "file-url-or-path->path" `Quick
            test_file_url_or_path_to_path
        ; Alcotest.test_case "path-absolute" `Quick test_path_absolute
        ; Alcotest.test_case "protocol-url" `Quick test_protocol_url
        ; Alcotest.test_case "invalid-or-bare-protocol-urls" `Quick
            test_invalid_or_bare_protocol_urls ] )
    ; ( "util_test"
      , [ Alcotest.test_case "extract-file-extension?" `Quick
            test_extract_file_extension
        ; Alcotest.test_case "escape-regex-chars" `Quick
            test_escape_regex_chars
        ; Alcotest.test_case "safe-subs" `Quick test_safe_subs
        ; Alcotest.test_case "timestamp-ms" `Quick test_timestamp_ms ] )
    ; ( "config_test"
      , [ Alcotest.test_case "remove-hidden-files" `Quick
            test_remove_hidden_files
        ; Alcotest.test_case "local-relative-asset?" `Quick
            test_local_relative_asset
        ; Alcotest.test_case "graph-repo-names-trim-surrounding-whitespace"
            `Quick test_graph_repo_names_trim ] )
    ; ( "graph_dir_test"
      , [ Alcotest.test_case "repo->graph-dir-key-strips-db-prefix" `Quick
            test_repo_to_graph_dir_key_strips
        ; Alcotest.test_case "repo->graph-dir-key-keeps-prefix-free-name"
            `Quick test_repo_to_graph_dir_key_keeps
        ; Alcotest.test_case
            "decode-graph-dir-name-decodes-only-canonical-encoded-names"
            `Quick test_decode_graph_dir_name
        ; Alcotest.test_case
            "decode-legacy-graph-dir-name-derives-only-legacy-compatible-names"
            `Quick test_decode_legacy_graph_dir_name ] )
    ; ( "graph_registry_test"
      , [ Alcotest.test_case "registry-normalizes-graph-name-whitespace"
            `Quick test_registry_normalizes_graph_name_whitespace ] )
    ; ( "graph_test"
      , [ Alcotest.test_case "get-files" `Quick test_get_files
        ; Alcotest.test_case
            "ignored-markdown-mirror-path-honors-directory-boundary-test"
            `Quick test_ignored_markdown_mirror_path ] ) ]
