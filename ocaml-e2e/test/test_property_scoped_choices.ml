(** Port of property_scoped_choices_test.clj. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

let add_property env property_name =
  let* () = Block.new_blocks env [ "setup" ] in
  let* () = Pw.click_l (Util.get_by_text env "setup" true) in
  let* () = Keyboard.press env "Control+e" in
  let* () = Util.input_command env "Add property" in
  let* () = Pw.click env "input[placeholder]" in
  let* () = Util.input env property_name in
  let* () = Pw.click_l (Util.get_by_text env "New option:" false) in
  let* () =
    Pw.click_l
      (Ls_locator.and_l (Pw.q env "span") (Util.get_by_text env "Text" true))
  in
  let* () = Keyboard.esc env in
  let* _v =
    E2e_assert.is_visible env
      (Printf.sprintf ".property-k:text('%s')" property_name)
  in
  Js.Promise.resolve ()

let add_tag_property env property_name =
  let* () = Pw.click env "button:has-text('Add tag property')" in
  let* () = Pw.click env "input[placeholder='Add or change property']" in
  let* () = Util.input env property_name in
  let* () =
    Pw.click_l
      (Ls_locator.filter env ~has_text:property_name
         "a.menu-link")
  in
  let* _v =
    E2e_assert.is_visible env
      (Printf.sprintf ".property-k:text('%s')" property_name)
  in
  Js.Promise.resolve ()

let open_choices_pane env property_name =
  (* the .property-k click can be eaten by a remount — the context menu
     then never opens. Re-click until the "Available choices" menuitem
     is actually visible, then click it. *)
  let choices_item =
    Ls_locator.filter env ~has_text:"Available choices"
      "div[role='menuitem']"
  in
  let rec go tries =
    let* () =
      Js.Promise.catch
        (fun _ -> Js.Promise.resolve ())
        (Pw.click_l
           (Ls_locator.filter env ~has_text:property_name ".property-k"))
    in
    let* opened =
      Js.Promise.catch
        (fun _ -> Js.Promise.resolve false)
        (Js.Promise.then_
           (fun _ -> Js.Promise.resolve true)
           (E2e_assert.is_visible_l ~timeout:5000. choices_item))
    in
    if opened then Pw.click_l choices_item
    else if tries <= 1 then
      Js.Promise.reject
        (Failure
           ("context menu never opened for property " ^ property_name))
    else go (tries - 1)
  in
  go 4

let add_choice env property_name choice =
  let* () = open_choices_pane env property_name in
  let* () =
    Pw.click_l
      (Ls_locator.filter env ~has_text:"Add choice"
         "div[role='menuitem']")
  in
  let* () = Pw.fill env "input[placeholder='title']" choice in
  let* () = Pw.click env "button:has-text('Save')" in
  Keyboard.esc env

let hide_choice_for_tag env property_name choice tag =
  let* () = open_choices_pane env property_name in
  let* () = Util.wait_timeout env 100. in
  let* () =
    Pw.click env
      (Printf.sprintf
         ".choices-list li:has-text('%s') button[title='More settings']"
         choice)
  in
  let* () = Util.wait_timeout env 100. in
  let* () =
    Pw.click_l
      (Ls_locator.filter env
         ~has_text:("Hide for #" ^ tag)
         "div[role='menuitem']")
  in
  Keyboard.esc env

let open_property_value_select env property_name =
  let* () =
    Pw.click env
      (Printf.sprintf
         ".bottom-property-pill:has(.property-k:has-text('%s')) \
          .property-value-container .jtrigger"
         property_name)
  in
  let* _ =
    E2e_assert.is_visible env
      (Printf.sprintf "input[placeholder='Set %s']" property_name)
  in
  let* () =
    Pw.click env
      (Printf.sprintf "input[placeholder='Set %s']" property_name)
  in
  let* _v = E2e_assert.is_visible env ".cp__select-results" in
  Js.Promise.resolve ()

let () =
  Fest.Promise.test "tag-scoped-property-choices-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* setup_page = Ls_page.get_page_name env in
    let tag = "Device" in
    let property_name = "device-type" in
    let scoped_choice = "wired" in
    let global_choice = "wireless" in
    let* () = add_property env property_name in
    let* () = Ls_page.new_page env tag in
    let* () = Ls_page.convert_to_tag env tag in
    let* _ = add_tag_property env property_name in
    let* () = add_choice env property_name scoped_choice in
    let* () = Util.wait_timeout env 100. in
    let* () = Keyboard.esc env in
    let* () = Ls_page.goto_page env setup_page in
    let* () = add_choice env property_name global_choice in
    let* () = Util.wait_timeout env 100. in
    let* () = Keyboard.esc env in
    let* () = Ls_page.goto_page env tag in
    let* () = Pw.click_l (Playwright.locator_first (Pw.q env "a.block-control")) in
    let* () = hide_choice_for_tag env property_name global_choice tag in
    let* () = Util.wait_timeout env 100. in
    let* () = Keyboard.esc env in
    let* () = Ls_page.new_page env "scoped-choices-test" in
    let* () = Block.new_block env "Device item" in
    let* _ = Util.set_tag env tag in
    let* _ = open_property_value_select env property_name in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env
           ~has_text:scoped_choice
           ".cp__select-results")
    in
    let* () =
      E2e_assert.have_count_l
        (Ls_locator.filter env
           ~has_text:global_choice
           ".cp__select-results")
        0
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "tag-scoped-property-choices-isolated-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let tag_a = "Device2" in
    let tag_b = "Vehicle" in
    let property_name = "device2-type" in
    let choice_a = "wired2" in
    let choice_b = "gas" in
    let* () = add_property env property_name in
    let* () = Ls_page.new_page env tag_a in
    let* () = Ls_page.convert_to_tag env tag_a in
    let* _ = add_tag_property env property_name in
    let* () = add_choice env property_name choice_a in
    let* () = Util.wait_timeout env 100. in
    let* () = Keyboard.esc env in
    let* () = Ls_page.new_page env tag_b in
    let* () = Ls_page.convert_to_tag env tag_b in
    let* _ = add_tag_property env property_name in
    let* () = add_choice env property_name choice_b in
    let* () = Util.wait_timeout env 100. in
    let* () = Keyboard.esc env in
    let* () = Ls_page.new_page env "scoped-choices-device2" in
    let* () = Block.new_block env "Device2 item" in
    let* _ = Util.set_tag env tag_a in
    let* _ = open_property_value_select env property_name in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env ~has_text:choice_a
           ".cp__select-results")
    in
    let* () =
      E2e_assert.have_count_l
        (Ls_locator.filter env ~has_text:choice_b
           ".cp__select-results")
        0
    in
    let* () = Keyboard.esc env in
    let* () = Ls_page.new_page env "scoped-choices-vehicle" in
    let* () = Block.new_block env "Vehicle item" in
    let* _ = Util.set_tag env tag_b in
    let* _ = open_property_value_select env property_name in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env ~has_text:choice_b
           ".cp__select-results")
    in
    let* () =
      E2e_assert.have_count_l
        (Ls_locator.filter env ~has_text:choice_a
           ".cp__select-results")
        0
    in
    Fixtures.validate_graph env)
