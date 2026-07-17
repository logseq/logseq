module Graph = Melange_common.Graph

let fail message =
  Fest.expect |> Fest.equal message "";
  failwith message

let expect_equal label actual expected =
  if actual <> expected then fail (label ^ ": unexpected value")

let expect_raises label f =
  try
    ignore (f ());
    fail (label ^ ": expected exception")
  with _ -> ()

let () =
  Fest.test "graph path policy preserves ignored directory boundaries"
    (fun () ->
      [|
        ("mirror exact", "tmp/test-graph/mirror/markdown", true);
        ("mirror child", "tmp/test-graph/mirror/markdown/pages/foo.md", true);
        ("mirror prefix", "tmp/test-graph/mirror/markdown-notes/foo.md", false);
        ("recycle exact", "tmp/test-graph/logseq/.recycle", true);
        ("recycle child", "tmp/test-graph/logseq/.recycle/foo.md", true);
        ("backup", "tmp/test-graph/logseq/bak", true);
        ("version files", "tmp/test-graph/logseq/version-files/x", true);
        ("case sensitive", "tmp/test-graph/Logseq/bak/x", false);
      |]
      |> Array.iter (fun (label, path, expected) ->
          expect_equal label
            (Graph.is_ignored_path ~dir:"tmp/test-graph" ~path)
            expected));

  Fest.test "graph path policy preserves metadata and module matching"
    (fun () ->
      [|
        ("transaction metadata", "tmp/test-graph/logseq/graphs-txid.edn", true);
        ("page metadata", "tmp/test-graph/logseq/pages-metadata.edn", true);
        ("nested metadata", "tmp/test-graph/foo/logseq/graphs-txid.edn", false);
        ("nested node modules", "tmp/test-graph/foo/node_modules/bar.js", true);
        ("root node modules", "tmp/test-graph/node_modules/bar.js", false);
        ("node modules directory", "tmp/test-graph/foo/node_modules", false);
      |]
      |> Array.iter (fun (label, path, expected) ->
          expect_equal label
            (Graph.is_ignored_path ~dir:"tmp/test-graph" ~path)
            expected));

  Fest.test "graph path policy preserves hidden and normalized path behavior"
    (fun () ->
      [|
        ("root hidden", "tmp/test-graph/.hidden", true);
        ("nested hidden", "tmp/test-graph/foo/.hidden/bar.md", true);
        ("double dot name", "tmp/test-graph/pages/foo..md", false);
        ("DS Store suffix", "tmp/test-graph/pages/not.DS_Store", true);
        ("root itself", "tmp/test-graph", false);
        ("normalized parent", "tmp/test-graph/pages/../logseq/bak/x", true);
        ("repeated separators", "tmp/test-graph//mirror///markdown/x", true);
      |]
      |> Array.iter (fun (label, path, expected) ->
          expect_equal label
            (Graph.is_ignored_path ~dir:"tmp/test-graph/" ~path)
            expected);
      expect_equal "backslashes"
        (Graph.is_ignored_path ~dir:"tmp\\test-graph"
           ~path:"tmp\\test-graph\\mirror\\markdown\\x")
        true;
      expect_equal "prefix collision hidden path"
        (Graph.is_ignored_path ~dir:"/graph" ~path:"/graph-other/.hidden")
        true);

  Fest.test "graph path policy fails fast outside the graph root" (fun () ->
      expect_raises "relative outside root" (fun () ->
          Graph.is_ignored_path ~dir:"tmp/test-graph" ~path:"tmp/other/.hidden");
      expect_raises "absolute outside root" (fun () ->
          Graph.is_ignored_path ~dir:"/graph" ~path:"/other/foo.md"));

  Fest.test "graph file policy preserves recognized extension behavior"
    (fun () ->
      [|
        ("org", "a.org", true);
        ("markdown", "a.markdown", true);
        ("md", "a.md", true);
        ("edn", "a.edn", true);
        ("json", "a.json", true);
        ("JavaScript", "a.js", true);
        ("CSS", "a.css", true);
        ("text", "a.txt", false);
        ("uppercase", "a.MD", false);
        ("hidden extension only", ".md", false);
        ("trailing dot", "a.", false);
        ("missing extension", "a", false);
        ("multiple dots", "archive.tar.md", true);
        ("directory dot", "dir.with.dot/a", false);
        ("directory and file dots", "dir.with.dot/a.md", true);
        ("Windows path", "C:\\graph\\pages\\a.md", true);
        ("query text", "foo/bar.md?x=1", false);
        ("Unicode basename", "页面.md", true);
      |]
      |> Array.iter (fun (label, path, expected) ->
          expect_equal label (Graph.is_allowed_file_path path) expected));

  Fest.test "graph filesystem entry policy excludes hidden names and symlinks"
    (fun () ->
      [|
        ("file", "page.md", false, true);
        ("directory", "pages", false, true);
        ("hidden file", ".page.md", false, false);
        ("hidden directory", ".git", false, false);
        ("dot", ".", false, false);
        ("double dot", "..", false, false);
        ("symlink", "linked", true, false);
        ("Unicode", "页面", false, true);
      |]
      |> Array.iter (fun (label, name, is_symbolic_link, expected) ->
          expect_equal label
            (Graph.is_visible_filesystem_entry ~name ~is_symbolic_link)
            expected));

  Fest.test
    "graph filesystem environment and home decisions preserve edge cases"
    (fun () ->
      expect_equal "missing environment"
        (Graph.default_graphs_dir ~environment_value:None)
        "~/logseq/graphs";
      expect_equal "configured environment"
        (Graph.default_graphs_dir ~environment_value:(Some "/tmp/graphs"))
        "/tmp/graphs";
      expect_equal "empty configured environment"
        (Graph.default_graphs_dir ~environment_value:(Some ""))
        "";
      [|
        ("empty", "", None);
        ("plain", "/tmp/graphs", None);
        ("tilde", "~", Some "");
        ("tilde slash", "~/graphs", Some "/graphs");
        ("tilde user-like", "~other/graphs", Some "other/graphs");
        ("Unicode", "~页面", Some "页面");
      |]
      |> Array.iter (fun (label, path, expected) ->
          expect_equal label (Graph.home_relative_suffix path) expected));

  Fest.test "graph filesystem path normalization preserves platform behavior"
    (fun () ->
      expect_equal "Windows separators"
        (Graph.normalize_filesystem_path ~win32:true "C:\\Graph\\pages\\a.md")
        "C:/Graph/pages/a.md";
      expect_equal "POSIX leaves backslashes"
        (Graph.normalize_filesystem_path ~win32:false "C:\\Graph\\pages\\a.md")
        "C:\\Graph\\pages\\a.md";
      expect_equal "Unicode"
        (Graph.normalize_filesystem_path ~win32:true "C:\\页面\\a.md")
        "C:/页面/a.md";
      expect_equal "empty" (Graph.normalize_filesystem_path ~win32:true "") "");

  Fest.test "graph directory names become stable distinct canonical repos"
    (fun () ->
      let actual =
        [|
          "demo";
          "logseq_db_demo";
          "logseq_db_logseq_db_demo";
          "logseq_local_file-graph";
          "Unlinked graphs";
          "foo~2Fbar";
          "a~3Ab";
          "space name";
          "space~20name";
          "space%20name";
          "foo++bar";
          "a+3A+b";
        |]
        |> Rrbvec.of_array |> Graph.canonical_db_graph_repos |> Rrbvec.to_array
      in
      expect_equal "canonical repos" actual
        [|
          "logseq_db_demo";
          "logseq_db_foo/bar";
          "logseq_db_a:b";
          "logseq_db_space name";
        |])
