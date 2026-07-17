module Path = Melange_common.Path

let fail message =
  Fest.expect |> Fest.equal message "";
  failwith message

let expect_equal label actual expected =
  if actual <> expected then fail (label ^ ": unexpected value")

let segments values = Array.map Option.some values

let () =
  Fest.test "file URL detection and filenames preserve decoding behavior"
    (fun () ->
      [|
        ("", false);
        ("FILE:///a", false);
        ("file:///a", true);
        ("memory://a", true);
        ("assets://a", true);
        ("https://a", false);
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Path.is_file_url input) expected);
      let composed_e = "cafe%CC%81.md" in
      let normalized_e = "caf" ^ Js.String.fromCharCode 0x00e9 ^ ".md" in
      [|
        ("/path/to/dir/", None);
        ("dir/file-name", Some "file-name");
        ("file:///tmp/a%20b.md", Some "a b.md");
        ("assets:///" ^ composed_e, Some normalized_e);
        ("memory:///bad%ZZ.md", Some "bad%ZZ.md");
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Path.filename input) expected));

  Fest.test "extension functions preserve hidden trailing and URL names"
    (fun () ->
      [|
        ("some-song.MP3", ("some-song", "mp3"));
        ("some-song", ("some-song", ""));
        ("some-file.edn.txt", ("some-file.edn", "txt"));
        (".gitignore", (".gitignore", ""));
        ("foo.", ("foo", ""));
        ("file:///tmp/a%20b.MD", ("a b", "md"));
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Path.split_ext input) expected);
      expect_equal "file stem" (Path.file_stem "a.tar.gz") "a.tar";
      expect_equal "file extension" (Path.file_ext "a.tar.GZ") "gz");

  Fest.test "path joins preserve relative root UNC and dot normalization"
    (fun () ->
      [|
        (None, [||], ".");
        (Some "", [||], ".");
        (Some "/", [||], "/");
        (Some "foo/", segments [| "bar" |], "foo/bar");
        (None, [| None; Some "foo"; Some "bar" |], "foo/bar");
        (Some "/foo/bar//baz/asdf/quux/..", [||], "/foo/bar/baz/asdf");
        (Some "a", segments [| ".." |], ".");
        (Some "..", segments [| ".."; "a" |], "../../a");
        (Some "/", segments [| ".."; "a" |], "/a");
        (Some "a\\b", segments [| "c" |], "a/b/c");
        ( Some "//NAS/MyGraph",
          segments [| "logseq/config.edn" |],
          "//NAS/MyGraph/logseq/config.edn" );
        (Some "//NAS/MyGraph", segments [| ".."; "Other" |], "//NAS/Other");
      |]
      |> Array.iter (fun (base, path_segments, expected) ->
          expect_equal expected (Path.path_join base path_segments) expected));

  Fest.test "URL joins preserve schemes encoding hosts and fallback behavior"
    (fun () ->
      [|
        ("assets:///foo.bar", segments [| "baz" |], "assets:///foo.bar/baz");
        ("file://", segments [| "D:/a.txt" |], "file:///D:/a.txt");
        ("file://", segments [| "c:/x" |], "file:///c:/x");
        ( "https://example.com/a?x=1#h",
          segments [| "../b" |],
          "https://example.com/b" );
        ("custom://Host/a", segments [| "b c" |], "custom://host/a/b%20c");
        ("memory:///a b", segments [| "c d" |], "memory:///a%2520b/c%20d");
        ("assets://host/a", segments [| "../b" |], "assets://host/b");
        ("file:///tmp/a%20b", segments [| "c d" |], "file:///tmp/a%2520b/c%20d");
        ("file://NAS/share", segments [| "a" |], "file://nas/share/a");
        ("assets://", segments [| "foo" |], "assets:///foo");
        ("file://", segments [| "assets://" |], "file:///assets%3A");
        ("not-url", segments [| "a" |], "file:///a");
      |]
      |> Array.iter (fun (base, path_segments, expected) ->
          expect_equal expected (Path.url_join base path_segments) expected));

  Fest.test "protocol prepending and normalization preserve platform paths"
    (fun () ->
      [|
        ("file:", "/home/logseq/graph", "file:///home/logseq/graph");
        ("file:", "C:/Graph/pages", "file:///C:/Graph/pages");
        ("file:", "//NAS/MyGraph", "file://NAS/MyGraph");
        ("file:", "file:///a", "file:///a");
        ("file:", "relative/a", "file:///relative/a");
      |]
      |> Array.iter (fun (protocol, input, expected) ->
          expect_equal input (Path.prepend_protocol protocol input) expected);
      [|
        ("a//b/../c", "a/c");
        ("./a", "a");
        ("../a", "../a");
        ("/a/../../b", "/b");
        ("file:///tmp/a%20b/../c d", "file:////tmp/c%2520d");
        ("assets:///D%3A/a", "assets:////D%3A/a");
        ("memory:///a\\b", "memory:////a/b");
        ("assets://", "assets:///.");
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Path.path_normalize input) expected));

  Fest.test "URL conversion preserves encoded paths UNC and Windows drives"
    (fun () ->
      [|
        ("file:///D:/a.txt", "D:/a.txt");
        ("file:///D%3A/a.txt", "D:/a.txt");
        ("file://NAS/share/x", "//nas/share/x");
        ("assets:///tmp/a%20b", "/tmp/a%20b");
        ("memory:///tmp/a%20b", "/tmp/a%20b");
        ("assets://NAS/share/a", "//nas/share/a");
        ("file://localhost/C:/a", "C:/a");
        ("file:///bad%ZZ", "/bad%ZZ");
        ("https://x/a", "https://x/a");
        ("/D:\\a.txt", "/D:\\a.txt");
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Path.url_to_path input) expected;
          expect_equal input (Path.file_url_or_path_to_path input) expected));

  Fest.test "prefix parent and basename helpers preserve current edge behavior"
    (fun () ->
      [|
        ("/a/b", "/a/b/c d", Some "c d");
        ("file:///a%20b", "file:///a%20b/c%20d", Some "c%20d");
        ("/a/b", "/a/bc", Some "c");
        ("/a/b", "/x", None);
      |]
      |> Array.iter (fun (base, sub, expected) ->
          expect_equal sub (Path.trim_dir_prefix base sub) expected);
      [|
        ("a/b", Some "a");
        ("a", None);
        ("/", Some "//");
        ("/a", Some "/");
        ("file:///a/b", Some "file:////a");
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Path.parent input) expected);
      [| ("a/b/", "b"); ("/", ""); ("file:///a%20b/", "a b") |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Path.basename input) expected));

  Fest.test "absolute and protocol predicates preserve loose classification"
    (fun () ->
      [|
        ("D:\\sources\\sources.md", true);
        ("c:/a", true);
        ("/home/test.md", true);
        ("//NAS/a", true);
        ("file:///a", true);
        ("assets:///a", true);
        ("memory:///a", true);
        ("https://x/a", false);
        ("D:test.md", false);
        ("relative/a", false);
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Path.is_absolute input) expected);
      [|
        ("a:b", false);
        ("ab:c", true);
        ("mailto:help@logseq.com", true);
        ("https://logseq.com", true);
        ("x_y://z", true);
        ("C:/a", false);
        ("D:test", false);
        ("http://a b", false);
        ("http://a%20b", true);
        ("1x://a", true);
        ("+x://a", true);
        ("test", false);
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Path.is_protocol_url input) expected))
