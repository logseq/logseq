(** Port of undo_redo_test.clj. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

let block_json ?(children = [||]) content =
  Js.Json.object_
    (Js.Dict.fromList
       [ "content", Js.Json.string content
       ; "children", Js.Json.array children ])

let titles_of tree =
  Array.to_list
    (Array.map
       (fun b -> Option.value ~default:"" (Api.get_string b "content"))
       tree)

let non_blank blocks =
  List.filter (fun b -> String.trim b <> "") blocks

let () =
  Fest.Promise.test "undo-redo-paste" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_blocks env [ "b1"; "b2" ] in
    let* () = Block.select_blocks env 2 in
    let* () = Block.copy env in
    let* () = Block.new_block env "" in
    let* () = Block.paste env in
    let* () = Util.exit_edit env in
    let* contents = Util.settled_page_blocks_contents env in
    Fest.deep_equal (Array.to_list contents) [ "b1"; "b2"; "b1"; "b2" ] Fest.expect;
    let* () = Block.undo env in
    let* () = Util.exit_edit env in
    let* contents = Util.settled_page_blocks_contents env in
    Fest.deep_equal (Array.to_list contents) [ "b1"; "b2"; "" ] Fest.expect;
    let* () = Block.redo env in
    let* () = Util.exit_edit env in
    let* contents = Util.settled_page_blocks_contents env in
    Fest.deep_equal (Array.to_list contents) [ "b1"; "b2"; "b1"; "b2" ] Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "undo-latest-saved-block-content-once" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_blocks env [ "b1" ] in
    let* () = Util.wait_timeout env 2000. in
    let* () = Util.move_cursor_to_end env in
    let* () = Util.press_seq env ~delay:20. " new text" in
    let* () = Util.wait_timeout env 1000. in
    let* () = Block.undo env in
    let* () = Util.exit_edit env in
    let* contents = Util.settled_page_blocks_contents env in
    Fest.deep_equal (Array.to_list contents) [ "b1" ] Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "cut-and-paste-preserves-multiple-block-trees" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* page_name = Ls_page.get_page_name env in
    let* page_block =
      Api.ls_api_call env "editor.getBlock" [| Js.Json.string page_name |]
    in
    let page_uuid =
      match Api.get_string page_block "uuid" with
      | Some u -> u
      | None -> failwith "no page uuid"
    in
    let rec wait_first_block remaining =
      let* tree =
        Api.ls_api_call env "editor.getPageBlocksTree"
          [| Js.Json.string page_name |]
      in
      (* the api returns undefined until the page's initial block lands *)
      if Js.Array.isArray tree && Array.length (tree : 'a array) > 0 then
        Js.Promise.resolve (tree : 'a array)
      else if remaining <= 0 then failwith "no initial block in page tree"
      else
        let* () = Util.wait_timeout env 100. in
        wait_first_block (remaining - 1)
    in
    let* tree0 = wait_first_block 50 in
    let target_uuid =
      match Api.get_string tree0.(0) "uuid" with
      | Some u -> u
      | None -> failwith "no target block uuid"
    in
    let* () = Util.exit_edit env in
    let* _ =
      Api.ls_api_call env "editor.insertBatchBlock"
        [| Js.Json.string page_uuid
         ; Js.Json.array
             [| block_json "parent a"
                  ~children:
                    [| block_json "child a1"; block_json "child a2" |]
              ; block_json "parent b"
                  ~children:
                    [| block_json "child b1"; block_json "child b2" |] |] |]
    in
    let* () = Pw.click_l (Util.get_by_text env "child b2" true) in
    let* () = Block.select_blocks env 6 in
    let* () = Keyboard.press env ~delay:100. "ControlOrMeta+x" in
    let rec wait_cut remaining =
      let* blocks : 'a array =
        Api.ls_api_call env "editor.getPageBlocksTree"
          [| Js.Json.string page_name |]
      in
      let non_blank_present =
        Array.exists
          (fun b ->
            match Api.get_string b "content" with
            | Some c -> String.trim c <> ""
            | None -> false)
          blocks
      in
      if not non_blank_present then Js.Promise.resolve ()
      else if remaining <= 0 then
        failwith "Cut did not remove the selected block trees"
      else
        let* () = Util.wait_timeout env 100. in
        wait_cut (remaining - 1)
    in
    let* () = wait_cut 50 in
    let* () =
      Pw.click env (Printf.sprintf "#ls-block-%s .block-content" target_uuid)
    in
    let* () = Block.paste env in
    let* () = Util.exit_edit env in
    let rec wait_tree remaining =
      let* blocks : 'a array =
        Api.ls_api_call env "editor.getPageBlocksTree"
          [| Js.Json.string page_name |]
      in
      let blocks =
        Array.to_list
          (Array.of_list
             (List.filter
                (fun b ->
                  match Api.get_string b "content" with
                  | Some c -> String.trim c <> ""
                  | None -> false)
                (Array.to_list blocks)))
      in
      if List.length blocks = 2 || remaining <= 0 then
        Js.Promise.resolve (Array.of_list blocks)
      else
        let* () = Util.wait_timeout env 100. in
        wait_tree (remaining - 1)
    in
    let* tree = wait_tree 50 in
    let children b =
      match Api.get_list b "children" with
      | Some kids -> titles_of kids
      | None -> []
    in
    Fest.deep_equal (titles_of tree) [ "parent a"; "parent b" ] Fest.expect;
    Fest.deep_equal (children tree.(0)) [ "child a1"; "child a2" ] Fest.expect;
    Fest.deep_equal (children tree.(1)) [ "child b1"; "child b2" ] Fest.expect;
    let* _ = Util.refresh_until_graph_loaded env in
    let* _ = E2e_assert.is_visible_l (Util.get_by_text env "parent a" true) in
    let* _ = E2e_assert.is_visible_l (Util.get_by_text env "parent b" true) in
    Fixtures.validate_graph env)
