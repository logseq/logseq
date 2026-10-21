(** Port of cmdk_scroll_basic_test.clj — Cmd+K scroll & highlight behavior. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

let scroll_container = ".cp__cmdk .overflow-y-auto"
let kbd_highlight = scroll_container ^ " [data-kb-highlighted]"
let mouse_item = scroll_container ^ " .transition-colors.cursor-pointer"

let setup_search env ?(suffix = "") prefix n =
  let rec go i =
    if i >= n then Js.Promise.resolve ()
    else
      let* () =
        Ls_page.new_page env (prefix ^ string_of_int i ^ suffix)
      in
      go (i + 1)
  in
  let* () = go 0 in
  let* () = Util.search env prefix in
  Util.wait_timeout env 500.

let simulate_mouse_move_into_results env =
  Pw.eval_js env
    ("(() => {\n\
    \           const c = document.querySelector('" ^ scroll_container ^ "');\n\
    \           if (!c) return;\n\
    \           const items = c.querySelectorAll('.transition-colors');\n\
    \           const target = items[2] || items[0] || c;\n\
    \           const rect = target.getBoundingClientRect();\n\
    \           const evt = new MouseEvent('mousemove', {\n\
    \             bubbles: true, cancelable: true,\n\
    \             clientX: rect.x + rect.width / 2,\n\
    \             clientY: rect.y + rect.height / 2\n\
    \           });\n\
    \           Object.defineProperty(evt, 'movementX', {value: 5});\n\
    \           Object.defineProperty(evt, 'movementY', {value: 3});\n\
    \           target.dispatchEvent(evt);\n\
    \         })()")

let kbd_highlight_in_viewport env =
  Pw.eval_js env
    ("(() => {\n\
    \           const el = document.querySelector('" ^ kbd_highlight ^ "');\n\
    \           if (!el) return false;\n\
    \           const c  = document.querySelector('" ^ scroll_container ^ "');\n\
    \           const cr = c.getBoundingClientRect();\n\
    \           const er = el.getBoundingClientRect();\n\
    \           return er.top >= cr.top - 5 && er.bottom <= cr.bottom + 5;\n\
    \         })()")

let () =
  Fest.Promise.test "cmdk-keeps-results-visible-while-searching"
    (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let prefix = "cmdkflicker" ^ Js.String.make (Js.Date.now ()) in
    let result_selector = Printf.sprintf "[data-testid^='%s']" prefix in
    let* () = setup_search env ~suffix:"a" prefix 2 in
    let* result_count = Util.count_elements env result_selector in
    Fest.equal (result_count > 0) true Fest.expect;
    let* () = Util.press_seq env "a" in
    let* n = Util.count_elements env result_selector in
    Fest.equal n result_count Fest.expect;
    let* () = Util.wait_timeout env 400. in
    let* n = Util.count_elements env result_selector in
    Fest.equal n result_count Fest.expect;
    let* () = Keyboard.backspace env in
    let* n = Util.count_elements env result_selector in
    Fest.equal n result_count Fest.expect;
    let* () = Util.wait_timeout env 400. in
    let* n = Util.count_elements env result_selector in
    Fest.equal n result_count Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "cmdk-highlight-mode-switching" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = setup_search env "cmdkhighlight" 8 in
    let* () = Keyboard.press_all env [ "ArrowDown"; "ArrowDown"; "ArrowDown" ] in
    let* () = Util.wait_timeout env 100. in
    let* n = Util.count_elements env kbd_highlight in
    Fest.equal n 1 Fest.expect;
    let* n = Util.count_elements env mouse_item in
    Fest.equal n 0 Fest.expect;
    let* _ = simulate_mouse_move_into_results env in
    let* () = Util.wait_timeout env 200. in
    let* n = Util.count_elements env kbd_highlight in
    Fest.equal n 0 Fest.expect;
    let* n = Util.count_elements env mouse_item in
    Fest.equal (n > 0) true Fest.expect;
    let* () = Keyboard.arrow_down env in
    let* () = Util.wait_timeout env 100. in
    let* n = Util.count_elements env kbd_highlight in
    Fest.equal n 1 Fest.expect;
    let* n = Util.count_elements env mouse_item in
    Fest.equal n 0 Fest.expect;
    let* _ = simulate_mouse_move_into_results env in
    let* () = Util.wait_timeout env 200. in
    let* n = Util.count_elements env kbd_highlight in
    Fest.equal n 0 Fest.expect;
    let* n = Util.count_elements env mouse_item in
    Fest.equal (n > 0) true Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "cmdk-lazy-visible-keyboard-scroll" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = setup_search env "cmdklazy" 30 in
    let* () = Keyboard.arrow_down env in
    let* () = Util.wait_timeout env 100. in
    let* () = Keyboard.press env "ControlOrMeta+ArrowDown" in
    let* () = Util.wait_timeout env 300. in
    let* () =
      Keyboard.press_all env ~delay:30. (List.init 20 (fun _ -> "ArrowDown"))
    in
    let* () = Util.wait_timeout env 300. in
    let* n = Util.count_elements env kbd_highlight in
    Fest.equal n 1 Fest.expect;
    let* (in_view : bool) = kbd_highlight_in_viewport env in
    Fest.equal in_view true Fest.expect;
    Fixtures.validate_graph env)
