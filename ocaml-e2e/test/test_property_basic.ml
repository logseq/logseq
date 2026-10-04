(** Port of property_basic_test.clj. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

let property_types =
  [ "Text"; "Number"; "Date"; "DateTime"; "Checkbox"; "URL"; "Node" ]

let text_l env text =
  Ls_locator.filter env ~has_text:text "span"

let add_new_properties env title_prefix =
  let* () =
    Block.new_blocks env
      (List.map (fun t -> title_prefix ^ "-" ^ t) property_types)
  in
  let rec go = function
    | [] -> Js.Promise.resolve ()
    | property_type :: rest ->
        let property_name =
          "p-" ^ title_prefix ^ "-" ^ property_type
        in
        let* () =
          Pw.click_l
            (Util.get_by_text env (title_prefix ^ "-" ^ property_type) true)
        in
        let* () = Keyboard.press env "Control+e" in
        let* () = Util.input_command env "Add property" in
        let* () = Pw.click env "input[placeholder]" in
        let* () = Util.input env property_name in
        let* () = Pw.click_l (Util.get_by_text env "New option:" false) in
        let* _ =
          E2e_assert.is_visible_l
            (Util.get_by_text env "Select a property type" false)
        in
        let* () =
          Pw.click_l
            (Ls_locator.and_l
               (Pw.q env "span")
               (Util.get_by_text env property_type true))
        in
        let* () =
          match property_type with
          | "Text" ->
              let* () =
                Pw.click env
                  (Printf.sprintf
                     ".property-pair:has-text('%s') > .ls-block"
                     property_name)
              in
              Util.input env "Text"
          | "Number" ->
              let* _ =
                E2e_assert.is_visible env
                  (Printf.sprintf "input[placeholder='Set %s']" property_name)
              in
              let* () = Util.input env "111" in
              Pw.click_l (Util.get_by_text env "New option:" false)
          | "DateTime" | "Date" ->
              let* _ =
                E2e_assert.is_visible env ".ls-property-dialog"
              in
              let* () = Keyboard.enter env in
              Keyboard.esc env
          | "Checkbox" | "URL" -> Js.Promise.resolve ()
          | "Node" ->
              let* () =
                Pw.click_l (Util.get_by_text env "Skip choosing tag" false)
              in
              let* () =
                Util.input env (title_prefix ^ "-Node-value")
              in
              Pw.click_l (Util.get_by_text env "New option:" false)
          | _ -> Js.Promise.resolve ()
        in
        go rest
  in
  go property_types

let () =
  if Util.is_main "test_property_basic.js" then
  Fest.Promise.test "new-property-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = add_new_properties env "new-property-test" in
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_property_basic.js" then
  Fest.Promise.test
    "property-value-lifecycle-and-object-view-persistence-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let property_name = "property-value-lifecycle" in
    let target_title = "property value target" in
    let* owner_page = Ls_page.get_page_name env in
    let* () = Block.new_block env target_title in
    let* () = Util.input_command env "Add property" in
    let* () = Pw.click env "input[placeholder]" in
    let* () = Util.input env property_name in
    let* () = Pw.click_l (Util.get_by_text env "New option:" false) in
    let* () =
      Pw.click_l
        (Ls_locator.and_l
           (Pw.q env "span")
           (Util.get_by_text env "Text" true))
    in
    let* () =
      Pw.click env
        (Printf.sprintf ".property-pair:has-text('%s') > .ls-block"
           property_name)
    in
    let* () = Util.input env "Initial value" in
    let* () = Keyboard.esc env in
    let* _ =
      E2e_assert.is_visible env
        (Printf.sprintf ".property-pair:has-text('%s'):has-text('Initial value')"
           property_name)
    in
    let* () = Ls_page.goto_page env property_name in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env
           ~has_text:target_title
           ".ls-view-body")
    in
    let* _ = Util.refresh_until_graph_loaded env in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env
           ~has_text:target_title
           ".ls-view-body")
    in
    let* () = Ls_page.goto_page env owner_page in
    let* () =
      Pw.click env
        (Printf.sprintf ".property-pair:has-text('%s') > .ls-block"
           property_name)
    in
    let* () = Util.input env "Updated value" in
    let* () = Keyboard.esc env in
    let* _ =
      E2e_assert.is_visible env
        (Printf.sprintf ".property-pair:has-text('%s'):has-text('Updated value')"
           property_name)
    in
    let* () =
      Pw.click_l
        (Ls_locator.filter env
           ~has_text:property_name
           ".property-k")
    in
    let* () =
      Pw.click_l
        (Ls_locator.filter env
           ~has_text:"Delete property from node"
           "[role='menuitem']")
    in
    let* () =
      Pw.click env "div[role='alertdialog'] button:text('Confirm')"
    in
    let* () =
      E2e_assert.have_count env
        (Printf.sprintf ".property-pair:has-text('%s')" property_name)
        0
    in
    let* () = Ls_page.goto_page env property_name in
    let* () =
      E2e_assert.have_count_l
        (Ls_locator.filter env
           ~has_text:target_title
           ".ls-view-body")
        0
    in
    Fixtures.validate_graph env)

let picker_chosen_label env =
  let* t =
    Pw.maybe
      (Util.get_text env
         ".ls-property-dialog .cp__select-results a.menu-link.chosen strong")
  in
  Js.Promise.resolve (String.trim (Option.value ~default:"" t))

let () =
  if Util.is_main "test_property_basic.js" then
  Fest.Promise.test "keyboard-highlight-selects-property-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_blocks env [ "picker target" ] in
    let* () =
      Keyboard.press env
        (if Config.mac then "ControlOrMeta+p" else "Control+Alt+p")
    in
    let* () =
      Pw.wait_for env
        ".ls-property-dialog .cp__select-results a.menu-link.chosen"
    in
    let* first_label = picker_chosen_label env in
    let* () = Keyboard.arrow_down env in
    let* () = Util.wait_timeout env 100. in
    let* highlighted = picker_chosen_label env in
    Fest.equal (first_label <> "") true Fest.expect;
    Fest.equal (first_label <> highlighted) true Fest.expect;
    let* () = Keyboard.enter env in
    let* _ =
      E2e_assert.is_visible_l
        (Playwright.locator_first
           (Ls_locator.or_ env
              (Printf.sprintf ".ls-property-dialog input[placeholder='Set %s']"
                 highlighted)
              ".ls-property-dialog [data-type]"))
    in
    let* () =
      E2e_assert.have_count env
        (Printf.sprintf ".ls-property-dialog input[placeholder='Set %s']"
           first_label)
        0
    in
    Fixtures.validate_graph env)
