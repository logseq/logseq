(** General utilities, mirroring clj-e2e's [util.clj]. *)

open Fest.Promise

let wait_timeout env ms = Pw.wait_timeout env ms

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

let editor_q = ".editor-wrapper textarea"

(* the same edited block can render a second editor instance inside the
   references sidebar — resolve the primary one, not a strict single match *)
(* the live editor = last *visible* textarea; a stale/dying textarea can
   sit at nth=0 and shadow reads or absorb fills *)
let editor_q_first = editor_q ^ ":visible >> nth=-1"

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

let editing_uuid env =
  Pw.eval_js env
    "(() => { const st = logseq.api.get_state_from_store('editor/block'); \
     return st && st.uuid ? st.uuid : null; })()"
  |> Js.Promise.then_ (fun u -> Js.Promise.resolve (Js.Nullable.toOption u))

let editing_uuid_js =
  "(() => { const st = logseq.api.get_state_from_store('editor/block'); \
   return st && st.uuid ? st.uuid : null; })()"

(* Polls the app's own editing state and returns the live editor's uuid
   (the id of its textarea is 'edit-block-' ^ uuid). A stale/dying editor
   can stay mounted and visible while editing has already moved on, so
   DOM visibility alone is not a reliable "is editing" check. *)
let wait_editing_uuid env =
  let deadline = Js.Date.now () +. 15000. in
  let rec loop () =
    let* u = Pw.eval_js env editing_uuid_js in
    match Js.Nullable.toOption u with
    | Some uuid ->
        let* mounted =
          Pw.count env ("#edit-block-" ^ uuid)
          |> Js.Promise.then_ (fun n -> Js.Promise.resolve (n > 0))
        in
        if mounted then Js.Promise.resolve (Some uuid)
        else if Js.Date.now () > deadline then Js.Promise.resolve None
        else
          let* () = wait_timeout env 150. in
          loop ()
    | None ->
        if Js.Date.now () > deadline then Js.Promise.resolve None
        else
          let* () = wait_timeout env 150. in
          loop ()
  in
  loop ()

let get_edit_block_container env =
  (* the editing block's uuid identifies the live editor — the plain
     count=1 check flakes when a stale textarea coexists briefly *)
  let* u = wait_editing_uuid env in
  match u with
  | Some uuid ->
      Js.Promise.resolve
        (Playwright.locator_first
           (Pw.qq env ".ls-block" ~has:(Pw.q env ("#edit-block-" ^ uuid))))
  | None ->
      let* () = E2e_assert.have_count ~timeout:30000. env editor_q 1 in
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
       let force_exit_deadline = Js.Date.now () +. 30000. in
       let rec force_exit () =
         let* still =
           Pw.count env ".editor-wrapper textarea:visible" in
         if still = 0 then Js.Promise.resolve ()
         else
           let* _ =
             Api.ls_api_call env "editor.exitEditingMode"
               [| Api.bool false |]
           in
           let* () = wait_timeout env 300. in
           if Js.Date.now () > force_exit_deadline then
             Js.Promise.resolve ()
           else force_exit ()
       in
       let* () = force_exit () in
       (* a remount can leave :editor/block state set with no editor DOM —
          the read view then never renders (.extensions__code etc).
          Clear a lingering editing state as well. *)
       let* editing = Pw.eval_js env editing_uuid_js in
       (match Js.Nullable.toOption editing with
        | Some _ ->
            let* _ =
              Api.ls_api_call env "editor.exitEditingMode"
                [| Api.bool false |]
            in
            Js.Promise.resolve ()
        | None -> Js.Promise.resolve ())
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
  (* clear first so a retry of the same query still fires input/onChange;
     a remount mid-fill can drop the text — verify the box holds it *)
  let rec fill_verified tries =
    let* () = Pw.fill env ".cp__cmdk-search-input" "" in
    let* () = Pw.fill env ".cp__cmdk-search-input" text in
    let* v = Pw.input_value env ".cp__cmdk-search-input" in
    if v = text || tries <= 1 then Js.Promise.resolve ()
    else fill_verified (tries - 1)
  in
  fill_verified 3

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

let rec search ?(tries = 3) env text =
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
  let* () =
    (* the cmdk can remount between open and fill — the input detaches and
       fill waits forever. Reopen and retry; the last timeout propagates. *)
    Pw.catch_timeout (fill_cmdk_search env text) (fun () ->
        if tries <= 1 then fill_cmdk_search env text
        else
          let* () = Keyboard.esc env in
          search ~tries:(tries - 1) env text)
  in
  wait_timeout env cmdk_search_settle_ms

let rec repeat_until_visible ?(expect_timeout = 5000.) env n target_loc
    repeat_fn =
  let* visible = Pw.visible_l target_loc in
  if visible then Js.Promise.resolve ()
  else
    let* () = repeat_fn () in
    Js.Promise.catch
      (fun e ->
        if n <= 0 then Playwright.throw_error e
        else
          repeat_until_visible ~expect_timeout env (n - 1) target_loc
            repeat_fn)
      (E2e_assert.is_visible_l ~timeout:expect_timeout target_loc)

(** On a fresh graph the worker search-index build truncates the table and
    refills it in chunks; under -j8 that window stretches past any retry
    budget, so a query that already missed once waits for the build state
    the worker reports before re-firing. Ready = a build reported
    completed, or no build running after the schedule grace window. *)
let wait_search_index_ready env =
  let deadline = Js.Date.now () +. 180000. in
  let grace_deadline = Js.Date.now () +. 8000. in
  let rec loop () =
    let* st =
      Pw.eval_js env
        "(() => { const s = logseq.api.get_state_from_store('search/index-build'); return JSON.stringify({running: !!(s && (s['running?'] || s.running)), status: (s && s.status) || null}); })()"
    in
    let running, status =
      match Js.Json.decodeString st with
      | Some s ->
          (match
             try Js.Json.decodeObject (Js.Json.parseExn s) with _ -> None
           with
           | Some o ->
               let bool_of k =
                 match Js.Dict.get o k with
                 | Some v ->
                     (match Js.Json.decodeBoolean v with
                      | Some b -> b
                      | None -> false)
                 | None -> false
               in
               let str_of k =
                 match Js.Dict.get o k with
                 | Some v ->
                     (match Js.Json.decodeString v with
                      | Some s -> s
                      | None -> "")
                 | None -> ""
               in
               bool_of "running", str_of "status"
           | None -> false, "")
      | None -> false, ""
    in
    let ready =
      status = "completed" || status = ":completed" || status = "failed"
      || status = ":failed"
      || ((not running) && status = "" && Js.Date.now () > grace_deadline)
    in
    if ready then Js.Promise.resolve ()
    else if Js.Date.now () > deadline then
      Js.Promise.resolve (Js.log2 "[search-idx-dbg] build never reported done; state=" st)
    else
      let* () = wait_timeout env 500. in
      loop ()
  in
  loop ()

(* Probes the worker search index itself (the same thread-api/search-blocks
   path the cmdk uses): 'hit' means the index can answer the query right
   now, 'miss' means the build is still catching up and re-firing the UI
   query is pointless, 'err' falls back to the plain re-fire path. *)
let probe_search_index env text =
  let js =
    Printf.sprintf
      "(async () => { try { const r = await logseq.api.search(%s, {'built-in?': true, limit: 10}); const rows = (r && r.blocks) || []; return rows.some(b => String(b['block/title'] || b.title || '') === %s) ? 'hit' : 'miss'; } catch (e) { return 'err:' + String(e); } })()"
      (Js.Json.stringify (Js.Json.string text))
      (Js.Json.stringify (Js.Json.string text))
  in
  Pw.eval_js env js

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
    Js.Promise.catch
      (fun e ->
        let* dump =
          Pw.eval_js env
            "(() => JSON.stringify({input: document.querySelector('.cp__cmdk-search-input')?.value, items: [...document.querySelectorAll('[data-testid]')].filter(el => el.offsetParent !== null).slice(0, 30).map(el => el.dataset.testid + ' :: ' + el.textContent.replace(/\\s+/g, ' ').slice(0, 60)), results: [...document.querySelectorAll('.search-results > div, .cp__cmdk [role=option]')].slice(0, 30).map(el => el.textContent.replace(/\\s+/g, ' ').slice(0, 80))}))()"
        in
        (* worker-side search errors are only visible on the page console —
           surface them like wait_idle does for db-sync lines *)
        let worker_lines =
          Env.console_logs env
          |> List.filter (fun l ->
                 contains_sub l "search/" || contains_sub l "search-"
                 || contains_sub l "Error" || contains_sub l "Invalid")
          |> (fun l ->
               if List.length l > 15 then
                 List.filteri (fun i _ -> i >= List.length l - 15) l
               else l)
          |> String.concat " || "
        in
        let* () =
          Js.Promise.resolve
            (Js.log3 "[search-dbg]" dump worker_lines)
        in
        Playwright.throw_error e)
      (* each round re-fills the box, which wipes pending results — under
         -j8 the worker's search can take >5s, so give every issued query
         room to render before re-firing. If the index can't answer the
         query yet (fresh-graph build still truncating/refilling), just
         wait — re-filling would only wipe the box without producing a row *)
      (repeat_until_visible ~expect_timeout:15000. env 24 result (fun () ->
           let* probe = probe_search_index env search_text in
           match probe with
           | "miss" ->
               let* () = wait_search_index_ready env in
               wait_timeout env 1500.
           | _ ->
               let* () = wait_search_index_ready env in
               search env search_text))
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

(* Reads prefer the textarea matching the app's editing block
   (edit-block-<uuid>) — the live editor — then the focused one, then the
   last visible; a stale textarea can hold focus or sit at nth=0 and
   shadow the real editor's value. *)
let edit_content_js =
  "(() => { \
   const st = logseq.api.get_state_from_store('editor/block'); \
   const u = st && st.uuid; \
   if (u) { const ts = [...document.querySelectorAll('#edit-block-' + CSS.escape(u))] \
   .filter(t => t.offsetParent !== null); \
   if (ts.length) return ts[ts.length - 1].value; } \
   const ae = document.activeElement; \
   if (ae && ae.matches && ae.matches('.editor-wrapper textarea')) \
   return ae.value; \
   const ts = [...document.querySelectorAll('.editor-wrapper textarea')] \
   .filter(t => t.offsetParent !== null); \
   return ts.length ? ts[ts.length - 1].value : null; })()"

let get_edit_content env =
  let* v = Pw.eval_js env edit_content_js in
  Js.Promise.resolve (Js.Nullable.toOption v)

(** [edit_content]: the focused editor's value as a plain string — clj's
    [(util/get-edit-content)] = [(.inputValue (util/get-editor))], which fails
    when no editor is open. *)
let edit_content env =
  let* v = get_edit_content env in
  match v with
  | Some s -> Js.Promise.resolve s
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
  (* remote churn can keep rewriting the page longer than the suite's
     shard budget — bound the settle wait and return the last observed
     contents so the caller's own comparison decides. *)
  let deadline = Js.Date.now () +. 90000. in
  let rec go prev idle =
    let* contents = get_page_blocks_contents env in
    if contents = prev && idle >= 3 then Js.Promise.resolve contents
    else if Js.Date.now () > deadline then Js.Promise.resolve contents
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
  let* () = Keyboard.press_in_editor env ~delay:20. "ControlOrMeta+a" in
  Keyboard.press_in_editor env ~delay:20. "ArrowRight"

let move_cursor_to_start env =
  let* () = Keyboard.press_in_editor env ~delay:20. "ControlOrMeta+a" in
  Keyboard.press_in_editor env ~delay:20. "ArrowLeft"

let input_command env command =
  let* content = get_edit_content env in
  let* () =
    match content with
    | Some c when c <> "" && not (String.equal (String.sub c (String.length c - 1) 1) " ") ->
        Keyboard.type_in_editor env " "
    | _ -> Js.Promise.resolve ()
  in
  (* '/' typed into the live editor — *:focus lands on <body> after a
     remount and the palette never opens *)
  let rec open_palette tries =
    (* '/' only triggers the palette as a keydown — when a remount kills
       the popover the editor is left ending in "/" and re-typing just
       appends another; erase a stale one first *)
    let* c = get_edit_content env in
    let* () =
      match c with
      | Some s
        when String.length s > 0
             && String.sub s (String.length s - 1) 1 = "/" ->
          Keyboard.press_in_editor env "Backspace"
      | _ -> Js.Promise.resolve ()
    in
    let* () = Keyboard.type_in_editor env ~delay:20. "/" in
    Pw.catch_timeout
      (Pw.wait_for ~timeout:10000. env ".ui__popover-content")
      (fun () ->
         if tries > 1 then open_palette (tries - 1)
         else Pw.wait_for env ".ui__popover-content")
  in
  let* () = open_palette 3 in
  let* () = Keyboard.type_in_editor env ~delay:20. command in
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
