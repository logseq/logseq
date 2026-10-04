(** Port of reference_basic_test.clj — block references. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

let () =
  Fest.Promise.test "self-reference" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "b2" in
    let* () = Block.copy env in
    let* () = Block.paste env in
    let* () = Util.exit_edit env in
    let* _ = E2e_assert.selected_block_text env "b2" in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "self-tag-block-reference" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "b2" in
    let* () = Util.set_tag env "task" in
    let* () = Block.copy env in
    let* () = Block.paste env in
    let* () = Util.exit_edit env in
    let* _ = E2e_assert.selected_block_text env "b2" in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "mutual-reference" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_blocks env [ "b1"; "b2" ] in
    let* () = Util.set_tag env "task" in
    let* () = Block.copy env in
    let* () = Keyboard.arrow_up env in
    let* () = Block.wait_editor_text env "b1" in
    let* () = Block.paste env in
    let* () = Block.copy env in
    let* () = Keyboard.arrow_down env in
    let* () = Block.wait_editor_text env "b2" in
    let* () = Block.paste env in
    let* () = Util.exit_edit env in
    let* () =
      Block.assert_blocks_visible env [ "b1[[b2]]"; "b2[[b1]]" ]
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "parent-reference" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_blocks env [ "b1"; "b2" ] in
    let* () = Util.set_tag env "task" in
    let* () = Block.indent env in
    let* () = Block.copy env in
    let* () = Keyboard.arrow_up env in
    let* () = Block.wait_editor_text env "b1" in
    let* () = Block.paste env in
    let* () = Block.copy env in
    let* () = Keyboard.arrow_down env in
    let* () = Block.wait_editor_text env "b2" in
    let* () = Block.paste env in
    let* () = Util.exit_edit env in
    let* () =
      Block.assert_blocks_visible env [ "b1[[b2]]"; "b2[[b1]]" ]
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "cycle-reference" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_blocks env [ "b1"; "b2"; "b3" ] in
    let* () = Util.set_tag env "task" in
    let* () = Block.jump_to_block env "b1" in
    let* () = E2e_assert.editor_mode env in
    let* () = Block.copy env in
    let* () = Keyboard.arrow_down env in
    let* () = Block.wait_editor_text env "b2" in
    let* () = Block.paste env in
    let* () = Block.copy env in
    let* () = Keyboard.arrow_down env in
    let* () = Block.wait_editor_text env "b3" in
    let* () = Block.paste env in
    let* () = Block.copy env in
    let* () = Block.jump_to_block env "b1" in
    let* () = E2e_assert.editor_mode env in
    let* () = Block.paste env in
    let* () = Util.exit_edit env in
    let* () =
      Block.assert_blocks_visible env
        [ "b1[[b3[[b2]]]]"; "b2[[b1[[b3]]]]"; "b3[[b2[[b1]]]]" ]
    in
    Fixtures.validate_graph env)

let inner_text env sel =
  Pw.eval_js env
    (Printf.sprintf
       "(() => { const el = document.querySelector('%s'); return el ? \
        el.innerText : ''; })()"
       sel)

let no_raw_uuid text =
  let re =
    Js.Re.fromString "\\(\\(|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-"
  in
  not (Js.Re.test ~str:text re)

let () =
  Fest.Promise.test "search-displays-referenced-block-title" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "ref target" in
    let* () = Block.copy env in
    let* () = Block.new_block env "" in
    let* () = Block.paste env in
    let* () = Util.exit_edit env in
    let* () =
      Block.assert_blocks_visible env [ "ref target"; "ref target" ]
    in
    (* cmdk search *)
    let* () = Util.search env "ref target" in
    let* _ =
      E2e_assert.is_visible env ".cp__cmdk :text('ref target')"
    in
    let* cmdk_text = inner_text env ".cp__cmdk" in
    Fest.equal (no_raw_uuid cmdk_text) true Fest.expect;
    (* first esc clears the query, second closes the modal *)
    let* () = Keyboard.esc env in
    let* () = Keyboard.esc env in
    let* () = Pw.wait_for_hidden env ".cp__cmdk" in
    (* [[ node autocomplete *)
    let* () = Block.new_block env "" in
    let* () = Util.press_seq env "[[" in
    let* () = Util.wait_timeout env 300. in
    let* () = Util.press_seq env "ref" in
    let* () = Util.wait_timeout env 800. in
    let* _ = E2e_assert.is_visible env "#ui__ac-inner" in
    let* _ =
      E2e_assert.is_visible env "#ui__ac-inner :text('ref target')"
    in
    let* ac_text = inner_text env "#ui__ac-inner" in
    Fest.equal (no_raw_uuid ac_text) true Fest.expect;
    Fixtures.validate_graph env)
