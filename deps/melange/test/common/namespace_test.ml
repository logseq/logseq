module Namespace = Melange_common.Namespace

let fail message =
  Fest.expect |> Fest.equal message "";
  failwith message

let expect_equal label actual expected =
  if actual <> expected then fail (label ^ ": unexpected value")

let () =
  Fest.test "namespace pages preserve current path and URL classification"
    (fun () ->
      [|
        ("foo/bar", true);
        ("foo/bar/baz", true);
        ("页面/子页", true);
        (" 页面/子页 ", true);
        ("/foo", true);
        ("foo/", true);
        ("foo//bar", true);
        ("//", true);
        ("///", true);
        ("foo/../bar", true);
        ("C:/Users/alice", true);
        ("C:\\Users\\alice", false);
        ("file:///tmp/graph", true);
        ("zotero://library/item", true);
        ("mailto:user/example", true);
        ("//host/path", true);
        ("/", false);
        (" / ", false);
        ("../foo/bar", false);
        ("..//foo", false);
        ("./foo/bar", false);
        (".//foo", false);
        ("https://example.com/a", false);
        ("HTTPS://EXAMPLE.COM/A", false);
        ("http://example.com/a", false);
        ("ftp://example.com/a", false);
        ("ws://example.com/a", false);
        ("wss://example.com/a", false);
        ("", false);
        ("plain page", false);
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Namespace.namespace_page input) expected));

  Fest.test "namespace last parts preserve repeated and trailing separators"
    (fun () ->
      [|
        ("foo/bar", Some "bar");
        ("foo/bar/baz", Some "baz");
        ("页面/子页", Some "子页");
        (" 页面/子页 ", Some "子页 ");
        ("/foo", Some "foo");
        ("foo/", Some "foo");
        ("/foo/", Some "foo");
        ("foo//bar", Some "bar");
        ("a//b//", Some "b");
        ("//", None);
        ("///", None);
        ("../foo/bar", Some "../foo/bar");
        ("https://example.com/a", Some "https://example.com/a");
        ("plain page", Some "plain page");
        ("", Some "");
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Namespace.get_last_part input) expected))
