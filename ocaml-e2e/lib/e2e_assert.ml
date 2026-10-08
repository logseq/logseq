(** Assertions backed by [expect] from [@playwright/test], mirroring
    clj-e2e's [assert.clj] (PlaywrightAssertions). *)

open Fest.Promise

let is_visible_l ?timeout loc =
  (* clj assert-is-visible: (w/-query q) .first isVisible — first-match
     semantics, not strict mode *)
  Playwright.expect_is_visible ?timeout
    (Playwright.expect (Playwright.locator_first loc))

let is_visible ?timeout env selector =
  let* () =
    is_visible_l ?timeout (Playwright.locator_first (Pw.q env selector))
  in
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

(* rtc/state idle can precede the title bar's mount by seconds on a remote
   graph switch — give the title more than playwright's 5s default *)
let graph_loaded env = is_visible ~timeout:30000. env "[data-testid='page title']"

let editor_mode ?uuid env =
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
    else if Js.Date.now () > deadline then (
      (* a remote-tx remount can leave editing state pointing at a block
         whose editor never mounts — reopen it through the API and wait
         for its textarea instead of counting textareas that never come *)
      let target =
        match uuid with
        | Some _ -> uuid
        | None -> u
      in
      match target with
      | Some uuid ->
          let* _ =
            Js.Promise.catch
              (fun _ -> Js.Promise.resolve Js.null)
              (Api.ls_api_call env "editor.editBlock" [| Api.str uuid |])
          in
          is_visible_l ~timeout:15000.
            (Pw.q env (Printf.sprintf "#edit-block-%s:visible" uuid))
      | None ->
          let* dump =
            Pw.eval_js env
              "(() => JSON.stringify({editing: logseq.api.get_state_from_store('editor/block'), url: location.hash, blocks: document.querySelectorAll('.ls-block').length, textareas: document.querySelectorAll('.editor-wrapper textarea').length, errorBoundary: !!document.querySelector('.error-boundary, [class*=error]'), body: document.body?.innerText?.slice(0,120)}))()"
          in
          let* () = Js.Promise.resolve (Js.log2 "[editor-mode-dbg]" dump) in
          (* editing state is gone entirely (remote remount cleared it)
             — recover like a user re-click: open the last block's
             editor via the API, then wait for its textarea *)
          let* last_uuid =
            Pw.eval_js env
              "(() => { const bs = document.querySelectorAll('.ls-block[blockid]'); \
               const last = bs[bs.length - 1]; \
               return last ? last.getAttribute('blockid') : null; })()"
          in
          (match Js.Nullable.toOption last_uuid with
           | Some bid ->
               let* _ =
                 Js.Promise.catch
                   (fun _ -> Js.Promise.resolve Js.null)
                   (Api.ls_api_call env "editor.editBlock" [| Api.str bid |])
               in
               is_visible_l ~timeout:15000.
                 (Pw.q env (Printf.sprintf "#edit-block-%s:visible" bid))
           | None -> have_count ~timeout:15000. env ".editor-wrapper textarea" 1))
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
