(** Port of library_basic_test.clj. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

let () =
  Fest.Promise.test
    "library-hides-normal-blocks-and-collapses-child-pages" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Ls_page.goto_page env "Library" in
    let* () = Block.new_blocks env [ "Outline Parent"; "Outline Child" ] in
    let* () = Block.indent env in
    let* () = Ls_page.goto_page env "Outline Child" in
    let* () = Block.new_blocks env [ "hello"; "world" ] in
    let* () = Ls_page.goto_page env "Library" in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env
           ~has_text:"Outline Parent"
           ".ls-page-blocks .block-title-wrap")
    in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env
           ~has_text:"Outline Child"
           ".ls-page-blocks .block-title-wrap")
    in
    let* contents = Util.get_page_blocks_contents env in
    Fest.equal
      (List.mem "Outline Parent" (Array.to_list contents))
      true Fest.expect;
    Fest.equal
      (List.mem "Outline Child" (Array.to_list contents))
      true Fest.expect;
    Fest.equal
      (List.mem "hello" (Array.to_list contents))
      false Fest.expect;
    Fest.equal
      (List.mem "world" (Array.to_list contents))
      false Fest.expect;
    let* () = Ls_page.goto_page env "Outline Parent" in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env
           ~has_text:"Outline Child"
           ".ls-page-blocks .block-title-wrap")
    in
    let* contents = Util.get_page_blocks_contents env in
    Fest.equal
      (List.mem "Outline Child" (Array.to_list contents))
      true Fest.expect;
    Fest.equal
      (List.mem "hello" (Array.to_list contents))
      false Fest.expect;
    Fest.equal
      (List.mem "world" (Array.to_list contents))
      false Fest.expect;
    let* () =
      E2e_assert.have_count_l
        (Ls_locator.filter env
           ~has_text:"Add property"
           ".ls-page-blocks .page-blocks-inner .ls-new-property")
        0
    in
    let* () = Ls_page.goto_page env "Outline Child" in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env
           ~has_text:"hello"
           ".ls-page-blocks .block-title-wrap")
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "library-enter-on-page-creates-sibling" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Ls_page.goto_page env "Library" in
    let* () = Block.new_blocks env [ "Enter Parent"; "Enter Nested" ] in
    let* () = Block.indent env in
    let* () = Keyboard.arrow_up env in
    let* () = E2e_assert.editor_mode env in
    let* content = Util.get_edit_content env in
    Fest.equal content (Some "Enter Parent") Fest.expect;
    let* () = Util.move_cursor_to_end env in
    let* () = Keyboard.enter env in
    let* () = Util.press_seq env "Enter Sibling" in
    let* () = Util.exit_edit env in
    let* () = Ls_page.goto_page env "Library" in
    let title sel =
      Ls_locator.filter env ~has_text:sel
        ".ls-page-blocks .block-title-wrap"
    in
    let* _ = E2e_assert.is_visible_l (title "Enter Parent") in
    let* _ = E2e_assert.is_visible_l (title "Enter Nested") in
    let* _ = E2e_assert.is_visible_l (title "Enter Sibling") in
    let* layout =
      Pw.eval_js env
        "(() => {\n\
        \           const title = (t) => \
         [...document.querySelectorAll('.ls-page-blocks .block-title-wrap')]\n\
        \             .find(el => el.textContent.trim() === t);\n\
        \           const x = (t) => title(t).getBoundingClientRect().x;\n\
        \           return {\n\
        \             parent: x('Enter Parent'),\n\
        \             nested: x('Enter Nested'),\n\
        \             sibling: x('Enter Sibling')\n\
        \           };\n\
        \         })()"
    in
    let parent = Option.get (Api.get_float layout "parent") in
    let nested = Option.get (Api.get_float layout "nested") in
    let sibling = Option.get (Api.get_float layout "sibling") in
    Fest.equal (nested > parent) true Fest.expect;
    Fest.equal (Float.abs (sibling -. parent) < 8.) true Fest.expect;
    Fixtures.validate_graph env)
