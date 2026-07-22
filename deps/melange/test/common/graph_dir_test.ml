module Graph_dir = Melange_common.Graph_dir

let fail message =
  Fest.expect |> Fest.equal message "";
  failwith message

let expect_equal label actual expected =
  if actual <> expected then fail (label ^ ": unexpected value")

let () =
  Fest.test "graph directory encoding preserves canonical component behavior"
    (fun () ->
      let page = Js.String.fromCharCode 0x9875 in
      let face =
        Js.String.fromCharCode 0xd83d ^ Js.String.fromCharCode 0xde00
      in
      [|
        (None, "");
        (Some "", "");
        (Some "space name", "space name");
        (Some "foo/bar", "foo~2Fbar");
        (Some "a~b", "a~7Eb");
        (Some "a%b", "a~25b");
        (Some (page ^ "/Graph " ^ face), "~E9~A1~B5~2FGraph ~F0~9F~98~80");
        (Some "!*'()-._", "!*'()-._");
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal expected (Graph_dir.encode_graph_dir_name input) expected));

  Fest.test "canonical and legacy decoding preserve rejection boundaries"
    (fun () ->
      [|
        (None, None);
        (Some "", Some "");
        (Some "space~20name", Some "space name");
        (Some "space%20name", Some "space name");
        (Some "foo~2Fbar", Some "foo/bar");
        (Some "a~7Eb", Some "a~b");
        (Some "a++b", None);
        (Some "a+3A+b", None);
        (Some "bad~ZZ", None);
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal "canonical decode"
            (Graph_dir.decode_graph_dir_name input)
            expected);
      [|
        (None, None);
        (Some "", None);
        (Some "foo++bar", Some "foo/bar");
        (Some "a+3A+b", Some "a:b");
        (Some "space%20name", Some "space name");
        (Some "100%25", Some "100%");
        (Some "foo~2Fbar", None);
        (Some "bad%ZZ", None);
        (Some "++", Some "/");
        (Some "+3A+", Some ":");
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal "legacy decode"
            (Graph_dir.decode_legacy_graph_dir_name input)
            expected));

  Fest.test "repository keys preserve one-prefix identity behavior" (fun () ->
      [|
        (None, None);
        (Some "", None);
        (Some "demo", Some "demo");
        (Some "logseq_db_demo", Some "demo");
        (Some "logseq_db_", Some "");
        (Some "logseq_db_logseq_db_demo", Some "logseq_db_demo");
        (Some "my_logseq_db_notes", Some "my_logseq_db_notes");
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal "repository key"
            (Graph_dir.repo_to_graph_dir_key input)
            expected);
      [|
        (Some "demo", Some "logseq_db_demo", true);
        (Some "Demo", Some "demo", false);
        (None, None, false);
        (Some "", Some "", false);
        (Some "logseq_db_", Some "", false);
        (Some "logseq_db_logseq_db_demo", Some "logseq_db_demo", false);
      |]
      |> Array.iter (fun (left, right, expected) ->
          expect_equal "same repository"
            (Graph_dir.same_repo left right)
            expected));

  Fest.test "repository directory derivation preserves nullable boundaries"
    (fun () ->
      [|
        (None, None);
        (Some "", None);
        (Some "demo", Some "demo");
        (Some "logseq_db_foo/bar", Some "foo~2Fbar");
        (Some "logseq_db_space name", Some "space name");
        (Some "logseq_db_", Some "");
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal "encoded repository"
            (Graph_dir.repo_to_encoded_graph_dir_name input)
            expected);
      expect_equal "nullable directory key"
        (Graph_dir.graph_dir_key_to_encoded_dir_name None)
        None;
      expect_equal "empty directory key"
        (Graph_dir.graph_dir_key_to_encoded_dir_name (Some ""))
        (Some ""))
