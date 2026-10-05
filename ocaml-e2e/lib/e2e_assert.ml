(** Assertions backed by [expect] from [@playwright/test], mirroring
    clj-e2e's [assert.clj] (PlaywrightAssertions). *)

open Fest.Promise

let is_visible_l ?timeout loc =
  (* clj assert-is-visible: (w/-query q) .first isVisible — first-match
     semantics, not strict mode *)
  Playwright.expect_is_visible ?timeout
    (Playwright.expect (Playwright.locator_first loc))

let is_visible env selector =
  let* () = is_visible_l (Playwright.locator_first (Pw.q env selector)) in
  Js.Promise.resolve true

let is_hidden_l loc =
  let* () = Playwright.expect_is_hidden (Playwright.expect loc) in
  Js.Promise.resolve true

let is_hidden env selector =
  let* () = Playwright.expect_is_hidden (Playwright.expect (Pw.q env selector)) in
  Js.Promise.resolve true

let have_count ?timeout env selector n =
  Playwright.expect_has_count ?timeout
    (Playwright.expect (Pw.q env selector))
    n

let have_count_l ?timeout loc n =
  Playwright.expect_has_count ?timeout (Playwright.expect loc) n

let non_editor_mode env =
  Pw.wait_for_hidden env
    "[data-testid='block editor'], [datatestid='block editor']"

(** not editing mode, no action bar, no search(cmdk) modal *)
let in_normal_mode env =
  let* () = non_editor_mode env in
  let* _ = is_hidden env ".selection-action-bar" in
  let* _ = is_visible env "#search-button" in
  Js.Promise.resolve true

let graph_loaded env = is_visible env "[data-testid='page title']"

let editor_mode env =
  (* counting ALL .editor-wrapper textareas flakes under remount churn:
     transient 0 while every editor remounts, transient 2 while a
     stale-but-mounted editor coexists (dup ids). The app's editing
     state is authoritative — wait for the editing block's editor to be
     visible. *)
  let deadline = Js.Date.now () +. 45000. in
  let rec go () =
    let* u =
      Pw.eval_js env
        "(() => { const st = logseq.api.get_state_from_store('editor/block'); \
         return st && st.uuid ? st.uuid : null; })()"
      |> Js.Promise.then_ (fun u -> Js.Promise.resolve (Js.Nullable.toOption u))
    in
    let* ok =
      match u with
      | Some uuid ->
          Pw.count env (Printf.sprintf "#edit-block-%s:visible" uuid)
          |> Js.Promise.then_ (fun n -> Js.Promise.resolve (n > 0))
      | None -> Js.Promise.resolve false
    in
    if ok then Js.Promise.resolve ()
    else if Js.Date.now () > deadline then
      have_count ~timeout:15000. env ".editor-wrapper textarea" 1
    else
      let* () = Pw.wait_timeout env 150. in
      go ()
  in
  go ()

let selected_block_text env text =
  is_visible env (Printf.sprintf ".ls-block.selected :text('%s')" text)

(** Playwright's [expect(loc).toHaveText(regex)] — clj's
    [(-> (assert-that loc) (.hasText re))]. *)
let to_have_text_re ?timeout loc re =
  Playwright.expect_to_have_text (Playwright.expect loc) re
    [%mel.obj { timeout = Js.Undefined.fromOption timeout }]

(** [summary] values come from {!Graph.validate_graph}; equality compares the
    same keys the cljs suite did (blocks/pages/classes/properties). *)
let graph_summary_equal summary1 summary2 =
  Fest.deep_equal summary1 summary2 Fest.expect
