(** Block manipulation helpers, mirroring clj-e2e's [block.clj]. *)

open Fest.Promise

(** Property values mount a nested [.ls-block .block-content]; clicking that
    0-width editor does not open the last page block, so skip blocks nested
    under [.property-block-container]. *)
let last_page_block_content env =
  (* locator.evaluate treats a string as an expression, so pick the index
     in-page and take .nth on the locator. *)
  let sel = ".ls-page-blocks .page-blocks-inner .ls-block .block-content" in
  let* (idx : int) =
    Pw.eval_js env
      ("Array.from(document.querySelectorAll('" ^ sel
      ^ "')).findLastIndex(el => !el.closest('.property-block-container'))")
  in
  if idx < 0 then Js.Promise.reject (Failure "No page block content")
  else Js.Promise.resolve (Playwright.locator_nth (Pw.q env sel) idx)

let rec open_last_block ?(in_retry = false) env =
  let* () = Util.double_esc env in
  let* _ = E2e_assert.in_normal_mode env in
  let* blocks_count = Util.page_blocks_count env in
  let* () =
    if blocks_count = 0 then
      let* buttons = Pw.qs env ".ls-page-blocks .block-add-button" in
      if Array.length buttons = 0 then
        Js.Promise.reject (Failure "no .block-add-button")
      else Pw.click_l buttons.(Array.length buttons - 1)
    else
      (* Only ever click a non-property [.block-content].  Clicking a raw
         [.ls-block] row can land on the .block-add-button sibling (it is
         .ls-block-classed too) and dispatch a real insert-new-block.  An
         open editor means the last block is already being edited — keep
         hands off. *)
      let rec click_last tries =
        (* gate on the app's editing state, not DOM textareas — a stale
           editor stays mounted and would skip the click forever *)
        let* editing = Util.editing_uuid env in
        if editing <> None then Js.Promise.resolve ()
        else
          Js.Promise.catch
            (fun e ->
              if tries <= 0 then Playwright.throw_error e
              else
                let* () = Pw.wait_timeout env 300. in
                click_last (tries - 1))
            (let* el = last_page_block_content env in
             Pw.click_l el)
      in
      click_last 80 (* ~24s — .block-content can mount late *)
  in
  if in_retry then E2e_assert.editor_mode env
  else
    Js.Promise.catch
      (fun _ -> open_last_block ~in_retry:true env)
      (E2e_assert.editor_mode env)

let save_block env text =
  let* () = E2e_assert.have_count ~timeout:15000. env Util.editor_q 1 in
  let* () = Pw.click env Util.editor_q_first in
  let* () = Pw.fill env Util.editor_q_first text in
  (* a remount mid-fill can drop the text into the dying editor —
     verify the value and refill (bounded) *)
  let rec verify_fill n =
    let* editors = Pw.qs env Util.editor_q in
    let* v =
      if Array.length editors = 0 then Js.Promise.resolve "<no editor>"
      else
        Js.Promise.catch (fun _ -> Js.Promise.resolve "<gone>")
          (Pw.input_value env Util.editor_q_first)
    in
    if v = text then Js.Promise.resolve ()
    else if n <= 1 then Js.Promise.resolve ()
    else
      let* () =
        Js.Promise.catch (fun _ -> Js.Promise.resolve ())
          (Pw.fill env Util.editor_q_first text)
      in
      verify_fill (n - 1)
  in
  let* () = verify_fill 3 in
  (* poll the live .value of the first editor — a textarea's has-text
     match does not track the value under remounts *)
  let rec wait_value deadline =
    let* editors = Pw.qs env Util.editor_q in
    let* v =
      if Array.length editors = 0 then Js.Promise.resolve "<no editor>"
      else
        Js.Promise.catch (fun _ -> Js.Promise.resolve "<gone>")
          (Pw.input_value env Util.editor_q_first)
    in
    if v = text then Js.Promise.resolve ()
    else if Js.Date.now () > deadline then
      Js.Promise.reject
        (Failure ("save_block: editor value never became " ^ text))
    else
      let* () = Util.wait_timeout env 200. in
      wait_value deadline
  in
  wait_value (Js.Date.now () +. 15000.)

let focus_new_block env ~previous_editor_id =
  let prev_uuid =
    if String.length previous_editor_id > 11
       && String.sub previous_editor_id 0 11 = "edit-block-"
    then String.sub previous_editor_id 11
          (String.length previous_editor_id - 11)
    else previous_editor_id
  in
  (* The authoritative signal that the Enter's insert op landed is the
     app's editing state moving to a different block; the DOM textarea
     mounts (or fails to mount, under remote-tx remounts) after that.
     Never re-Enter and never re-click: the insert op is already applied
     in the worker, and re-driving the UI here can mint a duplicate empty
     block or open the previous block's editor. *)
  let deadline = Js.Date.now () +. 45000. in
  let rec wait_moved () =
    let* u = Util.editing_uuid env in
    match u with
    | Some uuid when uuid <> prev_uuid -> Js.Promise.resolve (Some uuid)
    | _ ->
        if Js.Date.now () > deadline then Js.Promise.resolve None
        else
          let* () = Util.wait_timeout env 200. in
          wait_moved ()
  in
  let* new_uuid = wait_moved () in
  match new_uuid with
  | None ->
      failwith
        ("editing state never moved off " ^ previous_editor_id
       ^ " — Enter's insert op was swallowed")
  | Some uuid ->
      (* the app may not have mounted/focused the new block's textarea
         (remote remount can swallow it); force-open via the API when the
         state already moved *)
      let* mounted =
        Pw.catch_timeout
          (Js.Promise.then_ (fun () -> Js.Promise.resolve true)
             (E2e_assert.is_visible_l ~timeout:20000.
                (Pw.q env ("#edit-block-" ^ uuid ^ ":focus"))))
          (fun () -> Js.Promise.resolve false)
      in
      let* () =
        if mounted then Js.Promise.resolve ()
        else
          let* _ =
            Api.ls_api_call env "editor.editBlock" [| Api.str uuid |]
          in
          E2e_assert.is_visible_l ~timeout:15000.
            (Pw.q env ("#edit-block-" ^ uuid ^ ":focus"))
      in
      Js.Promise.resolve uuid

let new_block env title =
  (* gate on the app's editing state and use its uuid for the live
     editor's id — a stale sibling textarea can share the DOM and make
     nth-based ids point at a dead editor *)
  let rec ensure_editing n =
    let* u = Util.editing_uuid env in
    match u with
    | Some uuid -> Js.Promise.resolve uuid
    | None ->
        if n <= 0 then Js.Promise.reject (Failure "editor did not open")
        else
          let* () = open_last_block ~in_retry:true env in
          ensure_editing (n - 1)
  in
  let* last_uuid = ensure_editing 3 in
  let last_id = "edit-block-" ^ last_uuid in
  let* () = Util.move_cursor_to_end env in
  (* element-targeted Enter: page.keyboard.press dies silently when
     *:focus is <body> after a remount — a swallowed Enter leaves no new
     block and focus_new_block just times out. The editor itself can
     vanish between open_last_block and the press when a remote tx
     remounts the view — re-open and retry instead of waiting 30s on a
     textarea that never comes back. *)
  let rec enter_new_block n =
    (* short timeout on the press: if the editor vanished mid-remount the
       locator would otherwise burn the full 30s before we can re-open *)
    let* pressed =
      Js.Promise.catch
        (fun _ -> Js.Promise.resolve false)
        (let* () =
           Keyboard.press_in_editor env ~timeout:8000. "Enter"
         in
         Js.Promise.resolve true)
    in
    if pressed then Js.Promise.resolve ()
    else if n <= 1 then Js.Promise.resolve ()
    else
      let* () = open_last_block ~in_retry:true env in
      enter_new_block (n - 1)
  in
  let* () = enter_new_block 3 in
  let* new_uuid = focus_new_block env ~previous_editor_id:last_id in
  (* the block's own textarea id is derived from the block uuid, so it
     survives editor remounts; read/fill it directly instead of
     get_edit_content, which is ambiguous while two editors coexist *)
  let new_editor_q = "#edit-block-" ^ new_uuid in
  let* () =
    if String.length title > 0 then begin
      (* type into the resolved new textarea, not *:focus — a remount can
         move focus to body mid-typing and silently drop keystrokes *)
      Playwright.press_sequentially (Pw.q env new_editor_q) title
    end
    else Js.Promise.resolve ()
  in
  let* () = E2e_assert.editor_mode env in
  let* content = Pw.input_value env new_editor_q in
  let* () =
    if content = title then Js.Promise.resolve ()
    else begin
      (* a remount stole focus mid-typing and keystrokes landed on the old
         editor — set the new editor's value directly (clj's save-block
         uses fill for the same reason) *)
      Pw.fill_l (Pw.q env new_editor_q) title
    end
  in
  let* content = Pw.input_value env new_editor_q in
  Fest.equal content title Fest.expect;
  Js.Promise.resolve ()

let new_blocks env titles =
  let* editor = Util.get_editor env in
  let* () = match editor with
    | Some _ -> Js.Promise.resolve ()
    | None -> open_last_block env
  in
  match titles with
  | [] -> Js.Promise.resolve ()
  | first :: rest ->
      let* value = Util.get_edit_content env in
      let* () =
        match value with
        | Some v when String.trim v = "" -> save_block env first
        | _ -> new_block env first
      in
      let rec go = function
        | [] -> Js.Promise.resolve ()
        | t :: ts ->
            let* () = new_block env t in
            go ts
      in
      go rest

let delete_blocks env =
  let* editor = Util.get_editor env in
  let* () = match editor with
    | Some _ -> Util.exit_edit env
    | None -> Js.Promise.resolve ()
  in
  Keyboard.backspace env

let assert_blocks_visible env blocks =
  let rec go = function
    | [] -> Js.Promise.resolve ()
    | b :: rest ->
        let* _ =
          E2e_assert.is_visible env
            (Printf.sprintf ".ls-page-blocks .ls-block :text('%s')" b)
        in
        go rest
  in
  go blocks

let jump_to_block env block_text =
  (* poll: the block list can remount between the query and the click;
     fall back to substring match — .block-content can carry extra
     whitespace/text in focused views. Under -j8 load a route change
     (zoom-out) can leave .ls-block shells mounted while their
     .block-content subtree is still absent for well over 15s — wait
     on the row and then on the content inside it. *)
  let deadline = Js.Date.now () +. 25000. in
  let sub_sel =
    Printf.sprintf ".ls-block .block-content:has-text('%s')" block_text
  in
  let row_sel =
    Printf.sprintf ".ls-block:has-text('%s')" block_text
  in
  let rec poll () =
    let* loc = Pw.find_one_by_text env ".ls-block .block-content" block_text in
    match loc with
    | Some l -> Pw.click_l l
    | None ->
        let* n = Pw.count env sub_sel in
        if n > 0 then
          Pw.click_l (Playwright.locator_first (Pw.q env sub_sel))
        else
          let* rows = Pw.count env row_sel in
          if rows > 0 then
            (* row shell mounted but .block-content subtree still absent
               under load — click the row, which enters the block too.
               nth=-1: a parent .ls-block also has-text of its nested
               children; the deepest match is DOM-last. *)
            Pw.click_l (Pw.q env (row_sel ^ " >> nth=-1"))
          else if Js.Date.now () > deadline then
            Js.Promise.reject
              (Failure ("no block with text " ^ block_text))
          else
            let* () = Util.wait_timeout env 150. in
            poll ()
  in
  poll ()

let wait_editor_text env text =
  let* () = E2e_assert.have_count ~timeout:15000. env Util.editor_q 1 in
  Pw.wait_for env
    (Printf.sprintf ".editor-wrapper textarea:text('%s')" text)

let copy env = Keyboard.press env ~delay:100. "ControlOrMeta+c"
let paste env = Keyboard.press env ~delay:100. "ControlOrMeta+v"
let undo env = Keyboard.press env ~delay:100. "ControlOrMeta+z"
let redo env = Keyboard.press env ~delay:100. "ControlOrMeta+y"

let wait_for_editor_x_change env x1 moved =
  let rec go attempts_left =
    let* editor = Util.get_editor env in
    match editor with
    | Some e ->
        let* x2, _y = Pw.bounding_xy_l e in
        if moved x1 x2 || attempts_left <= 0 then Js.Promise.resolve x2
        else
          let* () = Util.wait_timeout env 50. in
          go (attempts_left - 1)
    | None ->
        if attempts_left <= 0 then Js.Promise.resolve x1
        else
          let* () = Util.wait_timeout env 50. in
          go (attempts_left - 1)
  in
  go 40

let indent_outdent env ~indent =
  let* editor = Util.get_editor env in
  match editor with
  | None -> Js.Promise.reject (Failure "indent_outdent: no editor")
  | Some e ->
      let* x1, _y = Pw.bounding_xy_l e in
      let moved = if indent then ( < ) else ( > ) in
      let* () = if indent then Keyboard.tab env else Keyboard.shift_tab env in
      let* x2 = wait_for_editor_x_change env x1 moved in
      let* x2 =
        if moved x1 x2 then Js.Promise.resolve x2
        else
          (* the tx→render roundtrip remounted the editor mid-wait and the
             keypress landed on body — refocus the open editor and press
             once more *)
          let* () = Pw.click env Util.editor_q_first in
          let* () =
            if indent then Keyboard.tab env else Keyboard.shift_tab env
          in
          let* x2 = wait_for_editor_x_change env x1 moved in
          Js.Promise.resolve x2
      in
      if indent then Fest.ok (x1 < x2) Fest.expect else Fest.ok (x1 > x2) Fest.expect;
      Js.Promise.resolve ()

let indent env = indent_outdent env ~indent:true
let outdent env = indent_outdent env ~indent:false

let toggle_property env property_title property_value =
  let* () =
    Keyboard.press env
      (if Config.mac then "ControlOrMeta+p" else "Control+Alt+p")
  in
  let* () = Pw.fill env ".ls-property-dialog .cp__select-input" property_title in
  let* () =
    Pw.wait_for env
      (Printf.sprintf "#ac-0.menu-link:has-text('%s')" property_title)
  in
  let* () = Keyboard.enter env in
  let* () = Util.wait_timeout env 100. in
  let* () = Pw.click env ".ls-property-dialog .cp__select-input" in
  let* () = Util.wait_timeout env 100. in
  let* () = Util.input env property_value in
  let* () =
    Pw.wait_for env
      (Printf.sprintf "#ac-0.menu-link:has-text('%s')" property_value)
  in
  Keyboard.enter env

let select_blocks env n =
  (* element-targeted while editing: *:focus can be <body> after a
     remount and the shift-chord is then silently dropped *)
  let* editor = Util.get_editor env in
  let* () =
    match editor with
    | Some _ -> Util.repeat_keyboard_in_editor env n "Shift+ArrowUp"
    | None -> Util.repeat_keyboard env n "Shift+ArrowUp"
  in
  Util.wait_timeout env 200.
