(** General utilities, mirroring clj-e2e's [util.clj]. *)

open Fest.Promise

let wait_timeout env ms = Pw.wait_timeout env ms

let editor_q = ".editor-wrapper textarea"

(* the same edited block can render a second editor instance inside the
   references sidebar — resolve the primary one, not a strict single match *)
let editor_q_first = editor_q ^ " >> nth=0"

let get_active_element env = Pw.q env "*:focus"

let get_editor env =
  let editor = Pw.q env editor_q_first in
  let* visible = Pw.visible env editor_q_first in
  if not visible then Js.Promise.resolve None
  else
    (* ensure cursor exists: sometimes the editor is up without a blinking
       cursor and subsequent key presses fail *)
    Js.Promise.catch
      (fun e ->
        let* still_visible = Pw.visible env editor_q_first in
        if still_visible then Playwright.throw_error e
        else Js.Promise.resolve None)
      (Js.Promise.then_
         (fun () -> Js.Promise.resolve (Some editor))
         (Playwright.focus editor))

let get_edit_block_container env =
  let* () = E2e_assert.have_count ~timeout:15000. env editor_q 1 in
  Js.Promise.resolve
    (Playwright.locator_first
       (Pw.qq env ".ls-block" ~has:(Pw.q env editor_q)))

(** replaces the focused input's value with [text] *)
let input env text = Pw.fill env "*:focus" text

let press_seq env ?(delay = 0.) text =
  Playwright.press_sequentially ~delay (Pw.q env "*:focus") text

let type_in_editor env ?(delay = 0.) text =
  (* type into the editor textarea itself — *:focus can point at <body>
     after a remount and silently eat keystrokes; verify and refill *)
  let rec go tries =
    let* () =
      Playwright.press_sequentially ~delay (Pw.q env editor_q) text
    in
    let* v = Pw.input_value env editor_q in
    if v = text || tries <= 1 then Js.Promise.resolve ()
    else
      let* () = Pw.fill_l (Pw.q env editor_q) text in
      let* v' = Pw.input_value env editor_q in
      if v' = text then Js.Promise.resolve () else go (tries - 1)
  in
  go 3

let exit_edit env =
  let* editor = get_editor env in
  (match editor with
   | Some _ ->
       (* esc can be eaten by a remount or a misfocused element; keep
          pressing until the editor actually hides. First tries target
          the editor element directly so focus doesn't matter. *)
       let rec try_esc tries =
         let* () =
           if tries > 2 then
             Js.Promise.catch
               (fun _ -> Keyboard.esc env)
               (Keyboard.press_in_editor env "Escape")
           else Keyboard.esc env
         in
         let* left =
           Pw.catch_timeout
             (Js.Promise.then_ (fun () -> Js.Promise.resolve true)
                (Pw.wait_for_hidden env ~timeout:1000. editor_q_first))
             (fun () -> Js.Promise.resolve false)
         in
         if left || tries <= 1 then Js.Promise.resolve ()
         else try_esc (tries - 1)
       in
       let* () = try_esc 5 in
       (* a swallowed esc (modal/overlay stole focus) leaves the editor
          mounted forever — force the app state out via the API. nth=0
          alone is unreliable: a stale detached textarea can sit first *)
       let* still =
         Pw.count env ".editor-wrapper textarea:visible" in
       if still > 0 then
         let* _ = Api.ls_api_call env "editor.exitEditingMode" [| Api.bool false |] in
         Js.Promise.resolve ()
       else Js.Promise.resolve ()
   | None -> Js.Promise.resolve ())
  |> Js.Promise.then_ (fun () ->
         let* _ = E2e_assert.non_editor_mode env in
         Js.Promise.resolve ())

let double_esc env =
  let popups =
    ".ui__popover-content, .ui__dropdown-menu-content, .ui__context-menu-content"
  in
  let* v = Pw.visible env popups in
  let* () = if v then Keyboard.esc env else Js.Promise.resolve () in
  let* () = exit_edit env in
  let* v = Pw.visible env popups in
  if v then Keyboard.esc env else Js.Promise.resolve ()

let cmdk_search_settle_ms = 400.

let fill_cmdk_search env text =
  (* clear first so a retry of the same query still fires input/onChange *)
  let* () = Pw.fill env ".cp__cmdk-search-input" "" in
  Pw.fill env ".cp__cmdk-search-input" text

let cmdk_open env =
  let* () = Keyboard.press env "ControlOrMeta+k" in
  Pw.catch_timeout
    (Js.Promise.then_ (fun () -> Js.Promise.resolve true)
       (Pw.wait_for env ~timeout:2000. ".cp__cmdk-search-input"))
    (fun () -> Js.Promise.resolve false)

(* stale overlays linger under load and intercept header clicks; esc them
   until none report data-state=open, then dump any survivor for diagnosis *)
let wait_overlays_closed env =
  let rec loop n =
    let* (count : float) =
      Pw.eval_js env
        "(() => document.querySelectorAll(\".ui__dialog-overlay[data-state='open']\").length)()"
    in
    if count = 0. then Js.Promise.resolve ()
    else if n <= 0 then
      let* dump =
        Pw.eval_js env
          "(() => JSON.stringify([...document.querySelectorAll('.ui__dialog-overlay[data-state=\\\"open\\\"]')].map(e => e.className.slice(0,100) + '|' + (e.textContent||'').replace(/\\s+/g,' ').slice(0,150))))()"
      in
      Js.Promise.resolve (Js.log2 "stale-overlay" dump)
    else
      let* () = Keyboard.press env "Escape" in
      let* () = wait_timeout env 400. in
      loop (n - 1)
  in
  loop 10

let search env text =
  let* already = Pw.visible env ".cp__cmdk-search-input" in
  let* () =
    if already then Js.Promise.resolve ()
    else
      let* opened = cmdk_open env in
      if opened then Js.Promise.resolve ()
      else
        let* () = double_esc env in
        let* () = wait_overlays_closed env in
        let* () = Pw.wait_for env ~timeout:15000. "#search-button" in
        let* _ = E2e_assert.in_normal_mode env in
        let* () = Pw.click env "#search-button" in
        Pw.wait_for env ".cp__cmdk-search-input"
  in
  let* () = fill_cmdk_search env text in
  wait_timeout env cmdk_search_settle_ms

let rec repeat_until_visible env n target_loc repeat_fn =
  let* visible = Pw.visible_l target_loc in
  if visible then Js.Promise.resolve ()
  else
    let* () = repeat_fn () in
    Js.Promise.catch
      (fun e ->
        if n <= 0 then Playwright.throw_error e
        else repeat_until_visible env (n - 1) target_loc repeat_fn)
      (E2e_assert.is_visible_l target_loc)

let search_and_click env search_text =
  let* () = search env search_text in
  (* stale cmdk nodes stay mounted inside aria-hidden regions — restrict to
     visible matches so .first() is never a detached/hidden twin *)
  let result =
    Playwright.locator_first
      (Pw.q env
         (Printf.sprintf "[data-testid='%s']:visible" search_text))
  in
  let* () =
    (* index queries lag under -j8; each retry re-fills the search box *)
    repeat_until_visible env 8 result (fun () -> search env search_text)
  in
  Pw.click_l result

let wait_editor_gone ?(editor = editor_q) env =
  Pw.wait_for_hidden env editor

let wait_editor_visible env =
  Pw.wait_for ~timeout:45000. env ".editor-wrapper textarea"

let count_elements env q = Pw.count env q

let blocks_count env =
  Pw.count env ".ls-block:not(.block-add-button)"

let page_blocks_count env =
  Pw.count env
    ".ls-page-blocks .page-blocks-inner .ls-block:not(.block-add-button)"

(** Poll [page_blocks_count] until it reaches [n] (8s budget); returns the
    last observed count so callers can assert the exact value. *)
let wait_page_blocks_count env n =
  let deadline = Js.Date.now () +. 8000. in
  let rec loop () =
    let* c = page_blocks_count env in
    if c = n || Js.Date.now () > deadline then Js.Promise.resolve c
    else
      let* () = wait_timeout env 200. in
      loop ()
  in
  loop ()

let get_text_of loc = Pw.text_of_l loc
(* first-match, like clj's w/-query: nav remounts can briefly render two
   page titles, and strict-mode textContent would throw instead of just
   answering with the visible one *)
let get_text env selector =
  Pw.text_of_l (Playwright.locator_first (Pw.q env selector))

let get_edit_content env =
  let* editor = get_editor env in
  match editor with
  | Some e -> Js.Promise.then_ (fun v -> Js.Promise.resolve (Some v)) (Pw.input_value_l e)
  | None -> Js.Promise.resolve None

(** [edit_content]: the focused editor's value as a plain string — clj's
    [(util/get-edit-content)] = [(.inputValue (util/get-editor))], which fails
    when no editor is open. *)
let edit_content env =
  let* editor = get_editor env in
  match editor with
  | Some e -> Pw.input_value_l e
  | None -> Js.Promise.reject (Failure "edit_content: no editor open")

(** waits until the editing textarea's content equals [expected].
    Polls get_edit_content directly: the editor unmounts and remounts
    under load, so a one-shot wait_editor_visible gate fails while a
    poll rides through the remount window. *)
let wait_edit_content env expected =
  let deadline = Js.Date.now () +. 30000. in
  let rec loop () =
    let* content = get_edit_content env in
    if content = Some expected then Js.Promise.resolve true
    else if Js.Date.now () > deadline then (
      Fest.equal (Option.value ~default:"" content) expected Fest.expect;
      Js.Promise.resolve true)
    else
      let* () = wait_timeout env 100. in
      loop ()
  in
  loop ()

let bounding_xy_l = Pw.bounding_xy_l

let repeat_keyboard env n shortcut =
  let rec go i =
    if i <= 0 then Js.Promise.resolve ()
    else
      let* () = Keyboard.press env ~delay:20. shortcut in
      go (i - 1)
  in
  go n

let repeat_keyboard_in_editor env n shortcut =
  (* re-check per press: a chord can switch the app out of editing mode
     (e.g. shift+arrow enters block selection and unmounts the textarea),
     so a one-time check cannot be trusted across the sequence *)
  let rec go i =
    if i <= 0 then Js.Promise.resolve ()
    else
      let* editors = Pw.qs env editor_q in
      let* () =
        if Array.length editors > 0 then
          Keyboard.press_in_editor env ~delay:20. shortcut
        else
          let* rows = Pw.qs env ".ls-page-blocks .block-content" in
          if Array.length rows > 0 then
            (* no editor (e.g. block-selection mode): deliver to the
               last block row — focusing body drops chords silently *)
            Playwright.locator_press ~delay:20.
              (Pw.q env ".ls-page-blocks .block-content >> nth=-1")
              shortcut
          else Keyboard.press env ~delay:20. shortcut
      in
      go (i - 1)
  in
  go n

let get_page_blocks_contents env =
  Pw.all_text env
    ".ls-page-blocks .ls-block:not(.block-add-button) .block-title-wrap"

(** Poll [get_page_blocks_contents] until it equals [expected] (8s budget);
    returns the last contents either way so callers can still assert
    strictly — block moves/pastes commit asynchronously under load. *)
let wait_page_blocks_contents env expected =
  let deadline = Js.Date.now () +. 8000. in
  let rec loop () =
    let* contents = get_page_blocks_contents env in
    if Array.to_list contents = expected || Js.Date.now () > deadline then
      Js.Promise.resolve contents
    else
      let* () = wait_timeout env 150. in
      loop ()
  in
  loop ()

(** Poll [get_page_blocks_contents] until it stops changing for two reads,
    giving in-flight renders (e.g. an emptied editing row tearing down after
    paste) time to settle — the clj suite's JVM latency covered this gap. *)
let settled_page_blocks_contents env =
  let rec go prev idle =
    let* contents = get_page_blocks_contents env in
    if contents = prev && idle >= 3 then Js.Promise.resolve contents
    else
      let* () = wait_timeout env 150. in
      go contents (if contents = prev then idle + 1 else 0)
  in
  go [||] 0

let login_test_account ?(username = "e2etest") ?(password = "Logseq-e2e") env =
  let* () = Pw.eval_js env "localStorage.setItem(\"login-enabled\",true);" in
  let* () = Pw.click env ".toolbar-dots-btn" in
  let* () = Pw.click env "div:text(\"Login\")" in
  let* () = input env username in
  let* () = Keyboard.tab env in
  let* () = input env password in
  let* () = Pw.click env ".cp__user-login button[type=\"submit\"]" in
  Pw.wait_for_hidden env ".cp__user-login"

let goto_journals env = search_and_click env "Go to journals"

let refresh_until_graph_loaded env =
  let* () = Pw.refresh env in
  E2e_assert.graph_loaded env

let move_cursor_to_end env =
  Pw.press_all env ~delay:20. [ "ControlOrMeta+a"; "ArrowRight" ]

let move_cursor_to_start env =
  Pw.press_all env ~delay:20. [ "ControlOrMeta+a"; "ArrowLeft" ]

let input_command env command =
  let* content = get_edit_content env in
  let* () =
    match content with
    | Some c when c <> "" && not (String.equal (String.sub c (String.length c - 1) 1) " ") ->
        press_seq env " "
    | _ -> Js.Promise.resolve ()
  in
  let* () = press_seq env ~delay:20. "/" in
  let* () = Pw.wait_for env ".ui__popover-content" in
  let* () = press_seq env ~delay:20. command in
  let command_item = Pw.q env "a.menu-link.chosen" in
  let* _ = E2e_assert.is_visible_l command_item in
  Pw.click_l command_item

let set_tag ?(hidden = false) env tag =
  let* () = press_seq env ~delay:20. " #" in
  let* () = press_seq env tag in
  let* items =
    Pw.qs env (Printf.sprintf "a.menu-link:has-text(\"%s\")" tag)
  in
  let* () =
    match items with
    | [||] -> Js.Promise.reject (Failure ("set_tag: no menu-link for " ^ tag))
    | arr -> Pw.click_l arr.(0)
  in
  if String.lowercase_ascii tag <> "task" && not hidden then
    let sel =
      Printf.sprintf
        ".ls-block:not(.block-add-button):has(.editor-wrapper textarea):has(.block-tag :text('%s'))"
        tag
    in
    let* _ = E2e_assert.is_visible env sel in
    Js.Promise.resolve ()
  else Js.Promise.resolve ()

let query_last env q = Playwright.locator_last (Pw.q env q)

let get_by_text env text exact = Pw.get_by_text env ~exact text

(** [String.contains] is not enough for substrings; melange lacks [Str]. *)
let contains_sub haystack needle =
  let n = String.length needle and h = String.length haystack in
  if n = 0 then true
  else
    let rec go i =
      i + n <= h
      && (String.sub haystack i n = needle || go (i + 1))
    in
    go 0

external crypto_random_uuid : unit -> string = "randomUUID"
  [@@mel.scope "crypto"]

let random_uuid = crypto_random_uuid

let clipboard_text env = Pw.eval_js env "navigator.clipboard.readText()"

let clipboard_write env text =
  let* _ = Pw.eval_js_arg env "text => navigator.clipboard.writeText(text)" text in
  Js.Promise.resolve ()

let is_mac () = [%raw "process.platform === 'darwin'"]

(** [is_main name] is true when the file [name] (e.g. "test_editor_basic.js")
    was loaded as node --test's entry point rather than `require`d by another
    test module. Test files that also export reusable scenario functions guard
    their [Fest.Promise.test] registrations with it so importing modules does
    not re-register tests. *)
let is_main (name : string) : bool =
  let argv1 : string = [%raw "process.argv[1] || ''"] in
  Filename.check_suffix argv1 name
