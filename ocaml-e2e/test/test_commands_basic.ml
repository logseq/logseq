(** Port of commands_basic_test.clj. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

let date_picker_day_selector =
  ".ui__calendar [role='gridcell'] button, .ui__calendar button[role='gridcell']"

let opaque_color color =
  match color with
  | None -> false
  | Some c ->
      let re =
        Js.Re.fromStringWithFlags ~flags:"i"
          "^(transparent|rgba\\(\\s*0\\s*,\\s*0\\s*,\\s*0\\s*,\\s*0(?:\\.0+)?\\s*\\))$"
      in
      not (Js.Re.test ~str:c re)

let focused_date_picker_day env =
  let script =
    Printf.sprintf
      "(() => {\n\
      \       const active = document.activeElement;\n\
      \       const dayButton = active?.closest?.(%s);\n\
      \       const cs = dayButton ? getComputedStyle(dayButton) : null;\n\
      \       return JSON.stringify({\n\
      \         focused: !!dayButton,\n\
      \         text: dayButton?.textContent ?? null,\n\
      \         label: dayButton?.getAttribute('aria-label') ?? \
       dayButton?.textContent ?? null,\n\
      \         bg: cs?.backgroundColor ?? null\n\
      \       });\n\
      \     })()"
      (Js.Json.stringify (Js.Json.string date_picker_day_selector))
  in
  let* s : string = Pw.eval_js env script in
  Js.Promise.resolve (Js.Json.parseExn s)

let assert_date_picker_keyboard_navigation env command =
  let* () = Block.new_block env (command ^ " keyboard test") in
  let* () = Util.input_command env command in
  let* () = Pw.wait_for env date_picker_day_selector in
  let* initial = focused_date_picker_day env in
  Fest.deep_equal
    (Option.value ~default:false (Api.get_bool initial "focused"))
    true Fest.expect;
  Fest.deep_equal (opaque_color (Api.get_string initial "bg")) true Fest.expect;
  let* () = Keyboard.arrow_right env in
  let* right = focused_date_picker_day env in
  Fest.deep_equal
    (Option.value ~default:false (Api.get_bool right "focused"))
    true Fest.expect;
  Fest.deep_equal
    (Api.get_string right "label" <> Api.get_string initial "label")
    true Fest.expect;
  Fest.deep_equal (opaque_color (Api.get_string right "bg")) true Fest.expect;
  let* () = Keyboard.arrow_left env in
  let* back = focused_date_picker_day env in
  Fest.deep_equal (Api.get_string back "label") (Api.get_string initial "label")
    Fest.expect;
  Fest.deep_equal (opaque_color (Api.get_string back "bg")) true Fest.expect;
  let* () = Keyboard.arrow_down env in
  let* down = focused_date_picker_day env in
  Fest.deep_equal
    (Option.value ~default:false (Api.get_bool down "focused"))
    true Fest.expect;
  Fest.deep_equal
    (Api.get_string down "label" <> Api.get_string initial "label")
    true Fest.expect;
  let* () = Keyboard.arrow_up env in
  let* up = focused_date_picker_day env in
  Fest.deep_equal (Api.get_string up "label") (Api.get_string initial "label")
    Fest.expect;
  let* () = Keyboard.enter env in
  if command = "date picker" then
    Pw.wait_for_hidden env ".ui__calendar"
  else E2e_assert.is_visible env ".ui__calendar"

let () =
  Fest.Promise.test "command-trigger-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "b2" in
    let* () = Util.press_seq env " /" in
    let* () =
      Pw.wait_for env "a.menu-link.chosen:has-text('Node reference')"
    in
    let* () = Keyboard.backspace env in
    let* () = Pw.wait_for_hidden env ".ui__popover-content" in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "slash-command-group-headings-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "slash-headings" in
    let* () = Util.press_seq env " /" in
    let* () =
      Pw.wait_for env "a.menu-link.chosen:has-text('Node reference')"
    in
    let* _ = E2e_assert.is_visible env ".ui__ac-group-name:has-text('BASIC')" in
    let* _ =
      E2e_assert.is_visible env ".ui__ac-group-name:has-text('FORMAT')"
    in
    let* _ =
      E2e_assert.is_visible env ".ui__ac-group-name:has-text('Heading')"
    in
    let* _ =
      E2e_assert.is_hidden env "a.menu-link:has-text('Clear heading')"
    in
    let* () = Util.press_seq env ~delay:20. "node" in
    let* () = Pw.wait_for env "a.menu-link:has-text('Node reference')" in
    let* _ = E2e_assert.is_hidden env ".ui__ac-group-name" in
    Fixtures.validate_graph env)

let chosen_slash_command_visibility env =
  let* s : string =
    Pw.eval_js env
      "(() => {\n\
      \       const container = document.getElementById('ui__ac-inner');\n\
      \       const chosen = document.querySelector('a.menu-link.chosen');\n\
      \       if (!container || !chosen) {\n\
      \         return JSON.stringify({visible: false, chosenText: null, \
       scrollTop: 0});\n\
      \       }\n\
      \       const c = container.getBoundingClientRect();\n\
      \       const e = chosen.getBoundingClientRect();\n\
      \       return JSON.stringify({\n\
      \         visible: e.top >= c.top - 1 && e.bottom <= c.bottom + 1,\n\
      \         chosenText: (chosen.textContent || '').trim(),\n\
      \         scrollTop: container.scrollTop\n\
      \       });\n\
      \     })()"
  in
  Js.Promise.resolve (Js.Json.parseExn s)

let () =
  Fest.Promise.test "slash-command-arrow-scroll-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "slash-scroll" in
    let* () = Util.press_seq env " /" in
    let* () =
      Pw.wait_for env "a.menu-link.chosen:has-text('Node reference')"
    in
    let rec times n f = if n <= 0 then Js.Promise.resolve () else
      let* () = f () in times (n - 1) f in
    let* () = times 20 (fun () -> Keyboard.arrow_down env) in
    let* after_down = chosen_slash_command_visibility env in
    Fest.deep_equal
      (match Api.get_string after_down "chosenText" with
       | Some s -> String.length s > 0
       | None -> false)
      true Fest.expect;
    Fest.deep_equal (Api.get_string after_down "chosenText" <> Some "Node reference")
      true Fest.expect;
    Fest.deep_equal
      (Option.value ~default:false (Api.get_bool after_down "visible"))
      true Fest.expect;
    Fest.deep_equal
      (Option.value ~default:0. (Api.get_float after_down "scrollTop") > 0.)
      true Fest.expect;
    let* () = times 20 (fun () -> Keyboard.arrow_up env) in
    let* () =
      Pw.wait_for env "a.menu-link.chosen:has-text('Node reference')"
    in
    let* after_up = chosen_slash_command_visibility env in
    Fest.deep_equal
      (Option.value ~default:false (Api.get_bool after_up "visible"))
      true Fest.expect;
    Fest.deep_equal
      (Option.value ~default:1. (Api.get_float after_up "scrollTop") = 0.)
      true Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "page-reference-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_blocks env [ "b1"; "" ] in
    let* () = Util.input_command env "Node reference" in
    let* () = Util.press_seq env "Another page" in
    let* () = Keyboard.enter env in
    let* content = Util.get_edit_content env in
    Fest.deep_equal content (Some "[[Another page]]") Fest.expect;
    let* () = Util.exit_edit env in
    let* t = Util.get_text env "a.page-ref" in
    Fest.deep_equal t "Another page" Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "block-reference-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_blocks env [ "block test"; "" ] in
    let* () = Util.input_command env "Node reference" in
    let* () = Util.press_seq env "block test" in
    let* () = Util.wait_timeout env 300. in
    let* () = Keyboard.enter env in
    let* content = Util.get_edit_content env in
    Fest.deep_equal
      (match content with
       | Some c -> Util.contains_sub c "[["
       | None -> false)
      true Fest.expect;
    let* () = Util.exit_edit env in
    let* t = Util.get_text env "a.page-ref" in
    Fest.deep_equal t "block test" Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "link-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let add_logseq_link () =
      let* () = Util.press_seq env "https://logseq.com" in
      let* () = Keyboard.tab env in
      let* () = Util.press_seq env "Logseq" in
      let* () = Keyboard.tab env in
      Keyboard.enter env
    in
    let* () = Block.new_block env "" in
    let* () = Util.input_command env "link" in
    let* () = add_logseq_link () in
    let* content = Util.get_edit_content env in
    Fest.deep_equal content (Some "[Logseq](https://logseq.com)") Fest.expect;
    let* () = Util.press_seq env " some content " in
    let* () = Util.input_command env "link" in
    let* () = add_logseq_link () in
    let* content = Util.get_edit_content env in
    Fest.deep_equal content
      (Some "[Logseq](https://logseq.com) some content [Logseq](https://logseq.com)")
      Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "link-image-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "" in
    let* () = Util.input_command env "image link" in
    let* () = Util.press_seq env "https://logseq.com/test.png" in
    let* () = Keyboard.tab env in
    let* () = Util.press_seq env "Logseq" in
    let* () = Keyboard.tab env in
    let* () = Keyboard.enter env in
    let* content = Util.get_edit_content env in
    Fest.deep_equal content (Some "![Logseq](https://logseq.com/test.png)")
      Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "underline-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "" in
    let* () = Util.input_command env "underline" in
    let* content = Util.get_edit_content env in
    Fest.deep_equal content (Some "<ins></ins>") Fest.expect;
    let* () = Util.press_seq env "test" in
    let* content = Util.get_edit_content env in
    Fest.deep_equal content (Some "<ins>test</ins>") Fest.expect;
    let* () = Util.move_cursor_to_end env in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "code-block-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "" in
    let* () = Util.input_command env "code block" in
    let* () = Pw.wait_for env ".CodeMirror" in
    let* () = Util.wait_timeout env 100. in
    let* () = Keyboard.shift_enter env in
    let* _ = E2e_assert.is_hidden env ".ls-page-blocks .block-tags" in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "math-block-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "" in
    let* () = Util.input_command env "math block" in
    let* () = Util.press_seq env "1 + 2 = 3" in
    let* () = Util.exit_edit env in
    let* () = Pw.wait_for env ".katex" in
    let* _ = E2e_assert.is_hidden env ".ls-page-blocks .block-tags" in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "quote-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "" in
    let* () = Util.input_command env "quote" in
    let* () = Pw.wait_for env "div[data-node-type='quote']" in
    let* _ = E2e_assert.is_hidden env ".ls-page-blocks .block-tags" in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "quote-heading-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "Property quote heading" in
    let* () = Util.input_command env "quote" in
    let* () = Util.input_command env "h1" in
    let* () = Util.exit_edit env in
    let* () = Block.new_block env "# Markdown quote heading" in
    let* () = Util.input_command env "quote" in
    let* () = Util.exit_edit env in
    let* _ =
      E2e_assert.is_visible env
        "div[data-node-type='quote']:has(h1.block-title-wrap.as-heading:has-text('Property quote heading'))"
    in
    let* _ =
      E2e_assert.is_visible env
        "div[data-node-type='quote']:has(h1.block-title-wrap.as-heading:has-text('Markdown quote heading'))"
    in
    let* () = Block.jump_to_block env "Markdown quote heading" in
    let* () = E2e_assert.editor_mode env in
    let* content = Util.get_edit_content env in
    Fest.deep_equal content (Some "Markdown quote heading") Fest.expect;
    let* () = Util.exit_edit env in
    let* () = Block.new_block env "Plain quote" in
    let* () = Util.input_command env "quote" in
    let* () = Util.exit_edit env in
    let* _ =
      E2e_assert.is_visible env
        "div[data-node-type='quote']:has(span.block-title-wrap:has-text('Plain quote'))"
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "headings-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let rec go i =
      if i > 6 then Js.Promise.resolve ()
      else
        let heading = Printf.sprintf "h%d" i in
        let text = heading ^ " test " in
        let* () = Block.new_block env text in
        let* () = Util.input_command env heading in
        let* content = Util.get_edit_content env in
        Fest.deep_equal content (Some text) Fest.expect;
        let* () = Util.exit_edit env in
        let* () = Pw.wait_for env heading in
        go (i + 1)
    in
    let* () = go 1 in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "clear-heading-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "clear heading test" in
    let* () = Util.input_command env "h1" in
    let* () = Util.exit_edit env in
    let* () =
      Pw.wait_for env
        "h1.block-title-wrap.as-heading:has-text('clear heading test')"
    in
    let* () = Block.jump_to_block env "clear heading test" in
    let* () = Util.input_command env "Clear heading" in
    let* () = Util.exit_edit env in
    let* _ =
      E2e_assert.is_hidden env
        "h1.block-title-wrap.as-heading:has-text('clear heading test')"
    in
    let* _ =
      E2e_assert.is_visible env
        "span.block-title-wrap:has-text('clear heading test')"
    in
    let* () = Block.new_block env "normal block" in
    let* () = Util.press_seq env " /clear" in
    let* () = Pw.wait_for env ".ui__popover-content" in
    let* _ =
      E2e_assert.is_hidden env "a.menu-link:has-text('Clear heading')"
    in
    let* _ =
      E2e_assert.is_visible env "a.menu-link:has-text('No matched commands')"
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "status-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let status_icon = function
      | "Doing" -> "InProgress50"
      | "In review" -> "InReview"
      | "Canceled" -> "Cancelled"
      | s -> s
    in
    let rec go = function
      | [] -> Js.Promise.resolve ()
      | status :: rest ->
          let text = status ^ " test " in
          let* () = Block.new_block env text in
          let* () = Util.input_command env status in
          let* content = Util.get_edit_content env in
          Fest.deep_equal content (Some text) Fest.expect;
          let* () = Util.exit_edit env in
          let* () = Keyboard.esc env in
          let* () =
            Pw.wait_for env (".ls-icon-" ^ status_icon status)
          in
          go rest
    in
    let* () =
      go [ "Backlog"; "Todo"; "Doing"; "In review"; "Done"; "Canceled" ]
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "priority-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let icon = function
      | "No priority" -> "line-dashed"
      | p -> "priorityLvl" ^ p
    in
    let rec go = function
      | [] -> Js.Promise.resolve ()
      | priority :: rest ->
          let text = priority ^ " test " in
          let* () = Block.new_block env text in
          let* () = Util.input_command env priority in
          let* content = Util.get_edit_content env in
          Fest.deep_equal content (Some text) Fest.expect;
          let* () = Util.exit_edit env in
          let* () = Pw.wait_for env (".ls-icon-" ^ icon priority) in
          go rest
    in
    let* () =
      go [ "No priority"; "Low"; "Medium"; "High"; "Urgent" ]
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "scheduled-deadline-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let rec go = function
      | [] -> Js.Promise.resolve ()
      | command :: rest ->
          let* _ = Fixtures.create_page env in
          let text = command ^ " test " in
          let* () = Block.new_block env text in
          let* () = Util.input_command env command in
          let* () = Pw.wait_for env date_picker_day_selector in
          let* () = Keyboard.enter env in
          let* () = E2e_assert.editor_mode env in
          let* () = Util.exit_edit env in
          let* t = Util.get_text env ".property-k" in
          Fest.deep_equal t command Fest.expect;
          let* t = Util.get_text env ".ls-datetime a.page-ref" in
          Fest.deep_equal t "Today" Fest.expect;
          go rest
    in
    let* () = go [ "Scheduled"; "Deadline" ] in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "date-command-keyboard-navigation-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let rec go = function
      | [] -> Js.Promise.resolve ()
      | command :: rest ->
          let* _ = Fixtures.create_page env in
          let* _v = assert_date_picker_keyboard_navigation env command in
          go rest
    in
    let* () = go [ "date picker"; "Scheduled"; "Deadline" ] in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "date-picker-month-select-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "date picker month select test" in
    let* () = Util.input_command env "date picker" in
    let* () = Pw.wait_for env date_picker_day_selector in
    let* () = Pw.wait_for env ".ls-date-month-select" in
    let* current = Util.get_text env ".ls-date-month-select" in
    let current = String.trim current in
    let target = if current = "August" then "March" else "August" in
    let* () = Pw.click env ".ls-date-month-select" in
    let* () = Pw.wait_for env ".ls-date-month-option" in
    let* () =
      Pw.click env
        (Printf.sprintf ".ls-date-month-option:has-text('%s')" target)
    in
    let* () = Pw.wait_for_hidden env "[role='menu']" in
    let* shown = Util.get_text env ".ls-date-month-select" in
    Fest.deep_equal (String.trim shown) target Fest.expect;
    let* cal = Util.get_text env ".ui__calendar" in
    Fest.deep_equal (Util.contains_sub cal target) true Fest.expect;
    Fixtures.validate_graph env)

let is_date_ref = function
  | Some t ->
      String.length t >= 4
      && String.sub t 0 2 = "[["
      && String.sub t (String.length t - 2) 2 = "]]"
  | None -> false

let () =
  Fest.Promise.test "date-time-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let check command =
      let* () = Util.input_command env command in
      let* text = Util.get_edit_content env in
      Fest.deep_equal (is_date_ref text) true Fest.expect;
      Js.Promise.resolve ()
    in
    let* () = check "today" in
    let* () = Block.new_block env "" in
    let* () = check "yesterday" in
    let* () = Block.new_block env "" in
    let* () = check "tomorrow" in
    let* () = Block.new_block env "" in
    (* /date picker only opens the calendar; nothing is inserted until a day is
       selected, matching the keyboard-navigation test which presses Enter. *)
    let* () = Util.input_command env "date picker" in
    let* () = Pw.wait_for env date_picker_day_selector in
    let* () = Keyboard.enter env in
    let* () = Pw.wait_for_hidden env ".ui__calendar" in
    let* text = Util.get_edit_content env in
    Fest.deep_equal (is_date_ref text) true Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "number-list-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Util.input_command env "number list" in
    let* () = Block.new_blocks env [ "a"; "b"; "c" ] in
    let* () = E2e_assert.have_count env "span.typed-list" 3 in
    let* texts = Pw.all_text env "span.typed-list" in
    Fest.deep_equal (Array.to_list texts) [ "1."; "2."; "3." ] Fest.expect;
    let* () = Keyboard.enter env in
    let* () = E2e_assert.have_count env "span.typed-list" 4 in
    let* () = Util.wait_timeout env 60. in
    let* () = Keyboard.enter env in
    let* () = E2e_assert.have_count env "span.typed-list" 3 in
    let* texts = Pw.all_text env "span.typed-list" in
    Fest.deep_equal (Array.to_list texts) [ "1."; "2."; "3." ] Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "number-children-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_blocks env [ "a"; "a1"; "a2"; "a3"; "b" ] in
    let* () = Keyboard.arrow_up env in
    let* () = Pw.wait_for env "textarea:text('a3')" in
    let* () = Util.repeat_keyboard env 3 "Shift+ArrowUp" in
    let* () = Keyboard.tab env in
    let* () = Block.jump_to_block env "a" in
    let* () = Util.input_command env "number children" in
    let* () = E2e_assert.have_count env "span.typed-list" 3 in
    let* texts = Pw.all_text env "span.typed-list" in
    Fest.deep_equal (Array.to_list texts) [ "1."; "2."; "3." ] Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "query-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () =
      Block.new_blocks env [ "[[foo]] block"; "[[foo]] another"; "" ]
    in
    let* () = Util.input_command env "query" in
    let* () = Pw.click_l (Util.query_last env "button:text('filter')") in
    let* () = Util.input env "page reference" in
    let* () = Pw.click env "a.menu-link:has-text('page reference')" in
    let* () =
      Pw.click_l
        (Playwright.locator_first (Pw.q env "a.menu-link:has-text('foo')"))
    in
    let* _ = E2e_assert.is_visible env "div:text('Live query (2)')" in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "query-view-membership-updates-live" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let tag = "live-query-membership" in
    let candidate_title = "query membership candidate" in
    let* () =
      Block.new_blocks env
        [ Printf.sprintf "[[%s]] query seed" tag; candidate_title; "" ]
    in
    let* candidate_uuid =
      Playwright.get_attribute
        (Playwright.locator_first
           (Pw.q env
              (Printf.sprintf ".ls-block[data-block-title='%s']"
                 candidate_title)))
        "blockid"
    in
    let candidate_uuid = Option.value ~default:"" candidate_uuid in
    let candidate_row =
      Printf.sprintf ".custom-query-results :text('%s')" candidate_title
    in
    Fest.deep_equal (candidate_uuid <> "") true Fest.expect;
    let* () = Util.input_command env "query" in
    let* () = Pw.click_l (Util.query_last env "button:text('filter')") in
    let* () = Util.input env "page reference" in
    let* () = Pw.click env "a.menu-link:has-text('page reference')" in
    let* () =
      Pw.click_l
        (Playwright.locator_first
           (Pw.q env (Printf.sprintf "a.menu-link:has-text('%s')" tag)))
    in
    let* () = Pw.wait_for env "div:text('Live query (1)')" in
    let* _ =
      Api.ls_api_call env "editor.updateBlock"
        [| Api.str candidate_uuid;
           Api.str (Printf.sprintf "[[%s]] %s" tag candidate_title) |]
    in
    let* () = Pw.wait_for env "div:text('Live query (2)')" in
    let* () = Pw.wait_for env candidate_row in
    let* _ =
      Api.ls_api_call env "editor.updateBlock"
        [| Api.str candidate_uuid; Api.str candidate_title |]
    in
    let* () = Pw.wait_for env "div:text('Live query (1)')" in
    let* () = Pw.wait_for_hidden env candidate_row in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "advanced-query-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () =
      Block.new_blocks env [ "[[bar]] block"; "[[bar]] another"; "" ]
    in
    let* () = Util.input_command env "advanced query" in
    let* () = Pw.click env ".ls-query-setting" in
    let* () =
      Pw.click_l (Playwright.locator_first (Pw.q env "pre.CodeMirror-line"))
    in
    let* () =
      Util.input env
        "{:query [:find (pull ?b [*])\n\
         :where [?b :block/refs ?r]\n\
         [?r :block/title \"bar\"]]}"
    in
    let* () = Keyboard.esc env in
    let* found = Pw.find_one_by_text env "div" "Live query (2)" in
    Fest.deep_equal (found <> None) true Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "calculator-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "" in
    let* () = Util.input_command env "calculator" in
    let* () = Util.input env "1 + 2" in
    let* () = Pw.wait_for env "div.extensions__code-calc-output-line" in
    let* t = Util.get_text env "div.extensions__code-calc-output-line" in
    Fest.deep_equal t "3" Fest.expect;
    let* _ = E2e_assert.is_hidden env ".ls-page-blocks .block-tags" in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "template-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "template 1" in
    let* () = Util.set_tag env ~hidden:true "Template" in
    let* () = Block.new_blocks env [ "block 1"; "block 2"; "block 3"; "test" ] in
    let* () = Keyboard.arrow_up env in
    let* () = Pw.wait_for env "textarea:text('block 3')" in
    let* () = Util.repeat_keyboard env 3 "Shift+ArrowUp" in
    let* () = Keyboard.tab env in
    let* () = Block.jump_to_block env "test" in
    let* () = Util.input_command env "template" in
    let* () = Util.input env "template 1" in
    let* () =
      Pw.wait_for env "a.menu-link.chosen:has-text('template 1')"
    in
    let* () = Keyboard.enter env in
    let rec go = function
      | [] -> Js.Promise.resolve ()
      | text :: rest ->
          let* () =
            E2e_assert.have_count_l
              (Ls_locator.or_ env
                 (Printf.sprintf ".ls-block .block-title-wrap:text('%s')"
                    text)
                 (Printf.sprintf ".ls-block textarea:text('%s')" text))
              2
          in
          go rest
    in
    let* () = go [ "block 1"; "block 2"; "block 3" ] in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "embed-html-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "" in
    let* () = Util.input_command env "embed html" in
    let* () = Util.press_seq env "<div id=\"embed-test\">test</div>" in
    let* () = Util.exit_edit env in
    let* t = Util.get_text env "#embed-test" in
    Fest.deep_equal t "test" Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "embed-video-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "" in
    let* () = Util.input_command env "embed video" in
    let* () =
      Util.press_seq env "https://www.youtube.com/watch?v=7xTGNNLPyMI"
    in
    let* () = Util.exit_edit env in
    let* () = Pw.wait_for env "iframe" in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "embed-tweet-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "" in
    let* () = Util.input_command env "embed tweet" in
    let* () =
      Util.press_seq env "https://x.com/logseq/status/1784914564083314839"
    in
    let* () = Util.exit_edit env in
    let* () = Pw.wait_for env "iframe" in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "cloze-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "" in
    let* () = Util.input_command env "cloze" in
    let* () = Util.press_seq env "hidden answer" in
    let* () = Util.exit_edit env in
    let* () = Pw.click env "span.cloze" in
    let* () = Pw.wait_for env "span.cloze-revealed" in
    Fixtures.validate_graph env)
