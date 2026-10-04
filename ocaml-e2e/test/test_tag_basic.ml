(** Port of tag_basic_test.clj. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

let uuid_re =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"

let add_new_tags env title_prefix =
  let* () = Block.new_block env (title_prefix ^ "1 #" ^ title_prefix ^ "1") in
  let* () = Util.double_esc env in
  let* () = Block.new_block env (title_prefix ^ "2") in
  Util.set_tag env (title_prefix ^ "2")

let () =
  Fest.Promise.test "new-tag-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = add_new_tags env "tag-test-" in
    let* () = Util.exit_edit env in
    let* _ =
      E2e_assert.is_visible env
        ".ls-block .block-title-wrap a.tag:has-text('#tag-test-1')"
    in
    let* () =
      E2e_assert.have_count_l
        (Ls_locator.filter env
           ~has_text:uuid_re
           ".ls-block .block-title-wrap")
        0
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "page-title-tag-autocomplete-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let tag_name = "page-title-autocomplete-tag" in
    let rec go = function
      | [] -> Js.Promise.resolve ()
      | page_name :: rest ->
          let* () = Ls_page.new_page env page_name in
          let* () =
            Pw.click env "div[data-testid='page title'] .block-title-wrap"
          in
          let* () = Util.move_cursor_to_end env in
          let* () = Util.press_seq env (" #" ^ tag_name) in
          let* _ =
            E2e_assert.is_visible_l
              (Ls_locator.filter env ~has_text:tag_name
                 ".ui__popover-content a.menu-link.chosen")
          in
          let* () = Keyboard.enter env in
          let* _ =
            E2e_assert.is_visible_l
              (Ls_locator.filter env ~has_text:tag_name
                 "div[data-testid='page title'] .block-tag")
          in
          let* () = Util.exit_edit env in
          let* name = Ls_page.get_page_name env in
          Fest.equal name page_name Fest.expect;
          let* () =
            Pw.click env "div[data-testid='page title'] .block-title-wrap"
          in
          let* () = Keyboard.enter env in
          let* _ = E2e_assert.is_hidden env Util.editor_q in
          let* name = Ls_page.get_page_name env in
          Fest.equal name page_name Fest.expect;
          go rest
    in
    let* () = go [ "new-tag-page-title"; "existing-tag-page-title" ] in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test
    "page-tag-conversion-persists-and-removes-tag-from-objects-test"
    (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let tag_name = "page-tag-conversion" in
    let object_page = "page-tag-object" in
    let* () = Ls_page.new_page env tag_name in
    let* () = Keyboard.esc env in
    let* () = Ls_page.convert_to_tag env tag_name in
    let* _ =
      E2e_assert.is_visible env "div[data-testid='page title'] :text('Tag')"
    in
    let* () = Ls_page.new_page env object_page in
    let* () = Block.save_block env "Tagged object" in
    let* () = Util.set_tag env tag_name in
    let* () = Keyboard.esc env in
    let* () = Ls_page.goto_page env tag_name in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env
           ~has_text:"Tagged object"
           ".ls-view-body")
    in
    let* _ = Util.refresh_until_graph_loaded env in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env
           ~has_text:"Tagged object"
           ".ls-view-body")
    in
    let* () = Pw.click env ".toolbar-dots-btn" in
    let* () =
      Pw.click_l
        (Ls_locator.filter env
           ~has_text:"Convert Tag to Page"
           "[role='menuitem']")
    in
    let* () =
      Pw.click env "div[role='alertdialog'] button:text('Confirm')"
    in
    let* () =
      E2e_assert.have_count env "button:text('Add tag property')" 0
    in
    let* () = E2e_assert.have_count env ".ls-view-body" 0 in
    let* () = Ls_page.goto_page env object_page in
    let* () =
      E2e_assert.have_count env
        (Printf.sprintf ".block-tag :text('%s')" tag_name)
        0
    in
    Fixtures.validate_graph env)
