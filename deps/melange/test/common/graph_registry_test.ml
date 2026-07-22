module Graph_registry = Melange_common.Graph_registry

let fail message =
  Fest.expect |> Fest.equal message "";
  failwith message

let expect_equal label actual expected =
  if actual <> expected then fail (label ^ ": unexpected value")

let expect_raises label f =
  match f () with
  | _ -> fail (label ^ ": expected an exception")
  | exception _ -> ()

let entry ?graph_id ?local_graph_id ?repo ?graph_id_text ?repo_text
    ?graph_name_text () =
  Graph_registry.make_entry ?graph_id ?local_graph_id ?repo ?graph_id_text
    ?repo_text ?graph_name_text ()

let () =
  Fest.test "registry normalization prefers graph identity and fails fast"
    (fun () ->
      let remote =
        entry ~graph_id:"remote" ~local_graph_id:"local" ~repo:"logseq_db_work"
          ()
      in
      let local = entry ~local_graph_id:"local" () in
      let remote_normalization = Graph_registry.normalize_entry remote in
      let local_normalization = Graph_registry.normalize_entry local in
      expect_equal "remote graph id"
        (Graph_registry.normalized_graph_id remote_normalization)
        "remote";
      expect_equal "local graph id"
        (Graph_registry.normalized_graph_id local_normalization)
        "local";
      expect_equal "remove legacy RTC graph id"
        (Graph_registry.remove_rtc_graph_id remote_normalization)
        true;
      expect_equal "valid normalization error"
        (Graph_registry.normalization_error remote)
        None;
      expect_raises "missing identity" (fun () ->
          Graph_registry.normalize_entry (entry ~repo:"logseq_db_broken" ()));
      let blank = entry ~graph_id:"  \t" ~local_graph_id:"\n" () in
      expect_equal "blank normalization error"
        (Graph_registry.normalization_error blank)
        (Some "Missing graph identity");
      expect_raises "blank identity" (fun () ->
          Graph_registry.normalize_entry blank));

  Fest.test
    "registry upsert removes every matching identity and preserves order"
    (fun () ->
      let registry =
        [|
          entry ~graph_id:"old-remote" ~local_graph_id:"local"
            ~repo:"logseq_db_work" ();
          entry ~graph_id:"same-id" ~repo:"logseq_db_id" ();
          entry ~graph_id:"keep-1" ~repo:"logseq_db_keep_1" ();
          entry ~graph_id:"keep-2" ~repo:"logseq_db_keep_2" ();
        |]
        |> Rrbvec.of_array
      in
      let incoming =
        entry ~graph_id:"same-id" ~local_graph_id:"local" ~repo:"logseq_db_work"
          ()
      in
      let result = Graph_registry.upsert_entry registry incoming in
      expect_equal "normalized graph id"
        (result |> Graph_registry.upsert_normalization
       |> Graph_registry.normalized_graph_id)
        "same-id";
      expect_equal "retained indices"
        (result |> Graph_registry.upsert_retained_indices |> Rrbvec.to_array)
        [| 2; 3 |]);

  Fest.test "registry upsert only uses present incoming repo and local id"
    (fun () ->
      let registry =
        [|
          entry ~graph_id:"first" ~repo:"" ~local_graph_id:"" ();
          entry ~graph_id:"second" ~repo:"logseq_db_second" ();
        |]
        |> Rrbvec.of_array
      in
      let result =
        Graph_registry.upsert_entry registry
          (entry ~graph_id:"new" ~repo:"  " ~local_graph_id:"\t" ())
      in
      expect_equal "blank fields do not deduplicate"
        (result |> Graph_registry.upsert_retained_indices |> Rrbvec.to_array)
        [| 0; 1 |]);

  Fest.test "registry resolution preserves precedence and first-match behavior"
    (fun () ->
      let registry =
        [|
          entry ~graph_id:"remote" ~graph_id_text:"remote"
            ~repo:"logseq_db_work" ~repo_text:"logseq_db_work"
            ~graph_name_text:"Work" ();
          entry ~graph_id:"other" ~graph_id_text:"other" ~repo:"logseq_db_other"
            ~repo_text:"logseq_db_other" ~graph_name_text:"work" ();
        |]
        |> Rrbvec.of_array
      in
      expect_equal "graph id wins over identifier"
        (Graph_registry.resolve_target_index registry ~graph_id:(Some "other")
           ~graph_identifier:(Some "work"))
        (Some 1);
      expect_equal "first matching name"
        (Graph_registry.resolve_target_index registry ~graph_id:None
           ~graph_identifier:(Some "WORK"))
        (Some 0);
      expect_equal "canonical repeated prefix"
        (Graph_registry.resolve_target_index registry ~graph_id:None
           ~graph_identifier:(Some "logseq_db_logseq_db_work"))
        (Some 0);
      expect_equal "blank graph id falls through"
        (Graph_registry.resolve_target_index registry ~graph_id:(Some " \t")
           ~graph_identifier:(Some "work"))
        (Some 0);
      expect_equal "missing graph id does not fall through"
        (Graph_registry.resolve_target_index registry ~graph_id:(Some "missing")
           ~graph_identifier:(Some "work"))
        None);

  Fest.test "registry identifier resolution compares stringified entry values"
    (fun () ->
      let registry =
        [|
          entry ~graph_id_text:"42" ~repo_text:":repo/value"
            ~graph_name_text:":Mixed" ();
        |]
        |> Rrbvec.of_array
      in
      expect_equal "numeric graph id text"
        (Graph_registry.resolve_target_index registry ~graph_id:None
           ~graph_identifier:(Some "42"))
        (Some 0);
      expect_equal "keyword graph name text"
        (Graph_registry.resolve_target_index registry ~graph_id:None
           ~graph_identifier:(Some ":mixed"))
        (Some 0);
      expect_equal "keyword repository text"
        (Graph_registry.resolve_target_index registry ~graph_id:None
           ~graph_identifier:(Some ":REPO/VALUE"))
        (Some 0);
      expect_equal "blank request"
        (Graph_registry.resolve_target_index registry ~graph_id:None
           ~graph_identifier:(Some "  "))
        None)
