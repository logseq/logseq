(** Port of property_config_basic_test.clj. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

let menu_item env label =
  Ls_locator.filter env ~has_text:label
    "div[role='menuitem']"

let text_span env =
  Ls_locator.and_l (Pw.q env "span") (Util.get_by_text env "Text" true)

let add_text_property env property_name =
  let* () = Block.new_block env "property target" in
  let* () = Util.input_command env "Add property" in
  let* () = Pw.click env "input[placeholder]" in
  let* () = Util.input env property_name in
  let* () = Pw.click_l (Util.get_by_text env "New option:" false) in
  let* () = Pw.click_l (text_span env) in
  let* () = Keyboard.esc env in
  E2e_assert.is_visible env
    (Printf.sprintf ".property-k:text('%s')" property_name)

let open_choices_pane env property_name =
  let* () =
    Pw.click_l
      (Ls_locator.filter env ~has_text:property_name
         ".property-k")
  in
  Pw.click_l (menu_item env "Available choices")

let add_choice env choice =
  let* () = Pw.click_l (menu_item env "Add choice") in
  let* () = Pw.fill env "input[placeholder='title']" choice in
  let* () = Pw.click env "button:has-text('Save')" in
  E2e_assert.is_visible env
    (Printf.sprintf ".choices-list li:has-text('%s')" choice)

let more_settings choice =
  Printf.sprintf
    ".choices-list li:has-text('%s') button[title='More settings']" choice

let () =
  Fest.Promise.test
    "property-choices-configuration-and-mod-p-stay-reactive-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let property_name = "reactive-priority" in
    let choice_before = "Choice before" in
    let choice_after = "Choice after" in
    let removable_choice = "Choice to delete" in
    let* _ = add_text_property env property_name in
    let* () = open_choices_pane env property_name in
    let* _ = add_choice env choice_before in
    let* () =
      Pw.click env
        (Printf.sprintf ".choices-list li:has-text('%s') strong" choice_before)
    in
    let* () = Pw.fill env "input[placeholder='title']" choice_after in
    let* () = Pw.click env "button:has-text('Save')" in
    let* _ =
      E2e_assert.is_visible env
        (Printf.sprintf ".choices-list li:has-text('%s')" choice_after)
    in
    let* () =
      E2e_assert.have_count env
        (Printf.sprintf ".choices-list li:has-text('%s')" choice_before)
        0
    in
    let* () = Pw.click env (more_settings choice_after) in
    let* () = Pw.click_l (menu_item env "Set as default choice") in
    let* () = Util.double_esc env in
    let* () = open_choices_pane env property_name in
    let* _ = add_choice env removable_choice in
    let* () = Pw.click env (more_settings removable_choice) in
    let* () = Pw.click env "div[role='menuitem'].del" in
    let* () =
      E2e_assert.have_count env
        (Printf.sprintf ".choices-list li:has-text('%s')" removable_choice)
        0
    in
    let* () = Util.double_esc env in
    let* () = Block.new_block env "closed choice target" in
    let* () =
      Keyboard.press env
        (if Config.mac then "ControlOrMeta+p" else "Control+Alt+p")
    in
    let* () =
      Pw.fill env ".ls-property-dialog .cp__select-input" property_name
    in
    let* () =
      Pw.click_l
        (Ls_locator.filter env ~has_text:property_name
           "a.menu-link")
    in
    let* _ =
      E2e_assert.is_visible env
        (Printf.sprintf ".ls-property-dialog input[placeholder='Set %s']"
           property_name)
    in
    let* () =
      E2e_assert.have_count env ".ls-property-dialog :text('Empty')" 0
    in
    let* () =
      Pw.click_l
        (Ls_locator.filter env ~has_text:choice_after
           ".ls-property-dialog .cp__select-results")
    in
    let* _ =
      E2e_assert.is_visible env
        (Printf.sprintf ".ls-block :text('%s')" choice_after)
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "mod-p-creates-and-sets-text-property-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let property_name = "mod-p-text" in
    let property_value = "created from mod p" in
    let* () = Block.new_block env "mod p target" in
    let* () =
      Keyboard.press env
        (if Config.mac then "ControlOrMeta+p" else "Control+Alt+p")
    in
    let* () =
      Pw.fill env ".ls-property-dialog .cp__select-input" property_name
    in
    let* () = Pw.click_l (Util.get_by_text env "New option:" false) in
    let* () = Pw.click_l (text_span env) in
    let* _ =
      E2e_assert.is_visible env
        (Printf.sprintf ".property-pair:has-text('%s') textarea" property_name)
    in
    let* () = Util.input env property_value in
    let* () = Keyboard.esc env in
    let* _ =
      E2e_assert.is_visible env
        (Printf.sprintf ".property-k:text('%s')" property_name)
    in
    let* _ =
      E2e_assert.is_visible env
        (Printf.sprintf ".property-pair:has-text('%s'):has-text('%s')"
           property_name property_value)
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "property-table-hides-internal-id-column-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let property_name = "table-without-internal-id" in
    let* _ = add_text_property env property_name in
    let* () = Util.double_esc env in
    let* () = Ls_page.goto_page env property_name in
    let* _ =
      E2e_assert.is_visible env ".ls-view-body .ls-table-header-cell"
    in
    let* () =
      E2e_assert.have_count env
        ".ls-view-body .ls-table-header-cell:text('#')"
        0
    in
    Fixtures.validate_graph env)

let more_settings_first_open_position env : Js.Json.t Js.Promise.t =
  Pw.eval_js env
    "(() => { \
     const trigger = document.querySelector(\".choices-list li button[title='More settings']\"); \
     const menu = document.querySelector('.ls-choice-more-settings'); \
     if (!trigger || !menu) { \
       return {ok: false, reason: 'missing'}; \
     } \
     const t = trigger.getBoundingClientRect(); \
     const m = menu.getBoundingClientRect(); \
     const dx = Math.min(Math.abs(m.left - t.right), Math.abs(m.right - t.left), Math.abs(m.left - t.left)); \
     const dy = Math.min(Math.abs(m.top - t.bottom), Math.abs(m.bottom - t.top)); \
     return { \
       ok: m.left > 8 && m.top > 8 && dx < 240 && dy < 120, \
       menu: {left: m.left, top: m.top}, \
       trigger: {left: t.left, top: t.top, right: t.right, bottom: t.bottom}, \
       dx, dy \
     }; \
     })()"

let () =
  Fest.Promise.test
    "property-choice-more-settings-menu-anchors-on-first-open-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let property_name = "choice-more-settings-pos" in
    let choice = "option1" in
    let* _ = add_text_property env property_name in
    let* () = open_choices_pane env property_name in
    let* _ = add_choice env choice in
    let* () = Pw.click env (more_settings choice) in
    let* _ = E2e_assert.is_visible env ".ls-choice-more-settings" in
    let* pos = more_settings_first_open_position env in
    let ok =
      Js.Nullable.toOption (Api.get pos "ok")
      |> Option.value ~default:false
    in
    Fest.equal ok true Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "available-choices-list-is-scrollable-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let property_name = "many-choices-scroll" in
    let* _ = add_text_property env property_name in
    let* () = open_choices_pane env property_name in
    let rec add_all i =
      if i > 15 then Js.Promise.resolve ()
      else
        let* _ = add_choice env (Printf.sprintf "Choice %d" i) in
        add_all (i + 1)
    in
    let* () = add_all 1 in
    let* (scrolled : bool) =
      Pw.eval_js env
        "(() => { const el = document.querySelector('.ls-property-choices-sub-pane .choices-list'); if (!el || el.scrollHeight <= el.clientHeight) return false; el.scrollTop = el.scrollHeight; return el.scrollTop > 0; })()"
    in
    Fest.equal scrolled true Fest.expect;
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env ~has_text:"Choice 15"
           ".choices-list li")
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test
    "text-property-default-value-can-be-set-from-config-menu-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let property_name = "ui-default-value" in
    let default_text = "shipped default" in
    let default_pane = ".ls-property-default-value-pane" in
    let* _ = add_text_property env property_name in
    let* () =
      Pw.click_l
        (Ls_locator.filter env ~has_text:property_name
           ".property-k")
    in
    let* () = Pw.click_l (menu_item env "Default value") in
    let* _ = E2e_assert.is_visible env default_pane in
    let set_default =
      Ls_locator.filter env ~has_text:"Set default value"
        default_pane
    in
    let* _ = E2e_assert.is_visible_l set_default in
    let* () = Pw.click_l set_default in
    let* () = Util.wait_timeout env 500. in
    let* has_editor =
      Pw.visible env (default_pane ^ " .editor-wrapper textarea")
    in
    let* () =
      if has_editor then
        let* () = Util.input env default_text in
        let* () = Keyboard.enter env in
        E2e_assert.have_count env (default_pane ^ " .ls-block") 1
      else Js.Promise.resolve ()
    in
    let* () = Util.double_esc env in
    let* () =
      Pw.click_l
        (Ls_locator.filter env ~has_text:property_name
           ".property-k")
    in
    let* _ = E2e_assert.is_visible_l (menu_item env "Default value") in
    Fixtures.validate_graph env)
