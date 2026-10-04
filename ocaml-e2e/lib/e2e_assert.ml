(** Assertions backed by [expect] from [@playwright/test], mirroring
    clj-e2e's [assert.clj] (PlaywrightAssertions). *)

open Fest.Promise

let is_visible_l loc = Playwright.expect_is_visible (Playwright.expect loc)

let is_visible env selector =
  let* () = is_visible_l (Playwright.locator_first (Pw.q env selector)) in
  Js.Promise.resolve true

let is_hidden env selector =
  let* () = Playwright.expect_is_hidden (Playwright.expect (Pw.q env selector)) in
  Js.Promise.resolve true

let have_count env selector n =
  Playwright.expect_has_count (Playwright.expect (Pw.q env selector)) n

let have_count_l loc n =
  Playwright.expect_has_count (Playwright.expect loc) n

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

let editor_mode env = have_count env ".editor-wrapper textarea" 1

let selected_block_text env text =
  is_visible env (Printf.sprintf ".ls-block.selected :text('%s')" text)

(** [summary] values come from {!Graph.validate_graph}; equality compares the
    same keys the cljs suite did (blocks/pages/classes/properties). *)
let graph_summary_equal summary1 summary2 =
  Fest.deep_equal summary1 summary2 Fest.expect
