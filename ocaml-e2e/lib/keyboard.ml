(** Named keyboard shortcuts, mirroring clj-e2e's [keyboard.clj]. *)

open Fest.Promise

let press env ?delay key = Pw.press env ?delay key
let press_all env ?delay keys = Pw.press_all env ?delay keys

(** Chord/key press delivered to the live editor element — unlike
    [page.keyboard.press] this focuses the located element first, so a
    remount/focus shift between the modifier keydown and the main key
    can't silently drop the modifier (observed under parallel load as
    e.g. "Control+Backspace" deleting only one char).
    When focus is already inside an editor we keep *:focus: a locator
    press on nth=0 would refocus the FIRST textarea, which can be a
    stale editor belonging to another block and undo the navigation
    the press was meant to perform (observed: ArrowUp moved editing to
    the parent, press_in_editor refocused the child's textarea and the
    zoom chord then focused the child). *)
(* The live editor = the textarea whose id matches the app's editing
   block (edit-block-<uuid>). Stale editors stay mounted under remount
   and can hold DOM focus, so ':focus'/'nth' targeting can hit a dead
   textarea and swallow the keypress entirely. *)
let live_editor_js =
  "(() => { \
   document.querySelectorAll('[data-e2e-live]').forEach(t => t.removeAttribute('data-e2e-live')); \
   const st = logseq.api.get_state_from_store('editor/block'); \
   const u = st && st.uuid; \
   if (u) { \
   const ts = [...document.querySelectorAll('#edit-block-' + CSS.escape(u))] \
   .filter(t => t.offsetParent !== null); \
   if (ts.length) { ts[ts.length - 1].setAttribute('data-e2e-live', '1'); return 'live'; } } \
   const ae = document.activeElement; \
   if (ae && ae.closest && ae.closest('.editor-wrapper')) return 'focus'; \
   const vs = [...document.querySelectorAll('.editor-wrapper textarea')] \
   .filter(t => t.offsetParent !== null); \
   if (vs.length) { vs[vs.length - 1].setAttribute('data-e2e-live', '1'); return 'mark'; } \
   return 'fallback'; })()"

let press_in_editor env ?delay ?timeout key =
  (* the marked textarea can detach between the mark and playwright's
     actionability wait (remount) — press with a bounded timeout and
     re-mark each retry so a remounted editor gets picked up fresh *)
  let rec attempt n =
    let* (target : string) = Pw.eval_js env live_editor_js in
    if target = "live" || target = "mark" then
      let t = match timeout with Some t -> t | None -> 8000. in
      Pw.catch_timeout
        (Playwright.locator_press ?delay ~timeout:t
           (Pw.q env "[data-e2e-live='1']")
           key)
        (fun () ->
           if n > 1 then attempt (n - 1)
           else
             Js.Promise.reject
               (Failure
                  (Printf.sprintf
                     "press_in_editor %s: live editor kept detaching" key)))
    else if target = "focus" then Pw.press env ?delay key
    else Pw.press env ?delay key
  in
  attempt 3
let enter env = Pw.press env "Enter"
let enter_in_editor env = press_in_editor env "Enter"
let esc env = Pw.press env "Escape"
let backspace env = Pw.press env "Backspace"
let delete env = Pw.press env "Delete"
let tab env = Pw.press env "Tab"
let shift_tab env = Pw.press env "Shift+Tab"
let shift_enter env = Pw.press env "Shift+Enter"
let shift_arrow_up env = Pw.press env "Shift+ArrowUp"
let shift_arrow_down env = Pw.press env "Shift+ArrowDown"
(* cursor/block navigation while editing — deliver to the editor
   element when focus is the editor itself or was lost to <body>
   (a remount does that, and *:focus then silently drops the key).
   Focus inside any other widget — picker, popover, menu — is the
   app's intended target: keep *:focus. *)
let arrow_in_editor_or_focus env key =
  let* (target : string) =
    Pw.eval_js env
      "(() => { const a = document.activeElement; if (!a || a.tagName === 'BODY') return 'editor'; if (a.closest('.editor-wrapper')) return 'editor'; return 'focus'; })()"
  in
  if target = "focus" then Pw.press env key
  else
    let* editors = Pw.qs env ".editor-wrapper textarea" in
    if Array.length editors > 0 then press_in_editor env key
    else
      let* rows = Pw.qs env ".ls-page-blocks .block-content" in
      if Array.length rows > 0 then
        Playwright.locator_press
          (Pw.q env ".ls-page-blocks .block-content >> nth=-1")
          key
      else Pw.press env key

let arrow_up env = arrow_in_editor_or_focus env "ArrowUp"
let arrow_down env = arrow_in_editor_or_focus env "ArrowDown"
let arrow_left env = Pw.press env "ArrowLeft"
let arrow_right env = Pw.press env "ArrowRight"

let meta_shift_arrow_up env =
  Pw.press env ((if Config.mac then "Meta" else "Alt") ^ "+Shift+ArrowUp")

let meta_shift_arrow_down env =
  Pw.press env ((if Config.mac then "Meta" else "Alt") ^ "+Shift+ArrowDown")
