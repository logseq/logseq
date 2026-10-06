(** Block manipulation helpers, mirroring clj-e2e's [block.clj]. *)

open Fest.Promise

(** Property values mount a nested [.ls-block .block-content]; clicking that
    0-width editor does not open the last page block, so skip blocks nested
    under [.property-block-container]. *)
let last_page_block_content env =
  (* virtualized lists mount only the visible window — on journals the
     tail may not be mounted at all, and "last block" resolves to the
     journal page-title row. Scroll the scroller to the bottom and wait
     until the mounted tail stops changing. *)
  let scroll_bottom =
    "(() => { const s = \
     document.querySelector('[data-virtuoso-scroller]') || \
     document.querySelector('#main-content-container'); if (s) { \
     s.scrollTop = s.scrollHeight; return 'scroller'; } \
     window.scrollTo(0, document.body.scrollHeight); return 'window'; \
     })()"
  in
  let tail_sig =
    "(() => { const els = document.querySelectorAll('.ls-page-blocks \
     .page-blocks-inner .ls-block[blockid]'); const last = els.length ? \
     els[els.length-1].getAttribute('blockid') : ''; return els.length + \
     '|' + last; })()"
  in
  let rec settle prev tries =
    if tries <= 0 then Js.Promise.resolve ()
    else
      let* _ = Pw.eval_js env scroll_bottom in
      let* () = Pw.wait_timeout env 350. in
      let* sg = Pw.eval_js env tail_sig in
      let s =
        match Js.Json.decodeString sg with Some s -> s | None -> ""
      in
      if s = prev then Js.Promise.resolve () else settle s (tries - 1)
  in
  let* () = settle "" 12 in
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
      let deadline = Js.Date.now () +. 60000. in
      let rec click_last () =
        (* gate on the app's editing state, not DOM textareas — a stale
           editor stays mounted and would skip the click forever *)
        let* editing = Util.editing_uuid env in
        let* live_editor =
          match editing with
          | Some uuid ->
              (* the state can outlive its textarea: a remote-tx remount
                 kills the editor DOM but leaves editor/block pointing at
                 the old uuid — treat that as dead, not open *)
              Js.Promise.catch
                (fun _ -> Js.Promise.resolve false)
                (Js.Promise.then_
                   (fun j ->
                      Js.Promise.resolve
                        (Js.Json.decodeBoolean j = Some true))
                   (Pw.eval_js env
                      (Printf.sprintf
                         "(() => { const t = \
                          document.querySelector('#edit-block-%s'); return \
                          !!(t && t.offsetParent !== null); })()"
                         uuid)))
          | None -> Js.Promise.resolve false
        in
        match editing with
        | Some _ when live_editor -> Js.Promise.resolve ()
        | Some _ ->
            (* dead editing state — clear it so the click below actually
               opens a fresh editor *)
            let* _ =
              Js.Promise.catch
                (fun _ -> Js.Promise.resolve Js.null)
                (Api.ls_api_call env "editor.exitEditingMode"
                   [| Api.bool false |])
            in
            let* () = Pw.wait_timeout env 200. in
            click_last ()
        | None ->
        if Js.Date.now () > deadline then
          Js.Promise.reject
            (Failure "open_last_block: no editor opened within 60s")
        else
          Js.Promise.catch
            (fun _ ->
              let* () = Pw.wait_timeout env 300. in
              click_last ())
            (let* el = last_page_block_content env in
             let* () = Pw.click_l el in
             (* the click can land on a stale element and still
                "succeed" — verify editing state actually appeared
                before giving the editor 60s to mount *)
             let click_deadline = Js.Date.now () +. 5000. in
             let rec wait_editing () =
               let* u = Util.editing_uuid env in
               if u <> None || Js.Date.now () > click_deadline then
                 Js.Promise.resolve ()
               else
                 let* () = Pw.wait_timeout env 150. in
                 wait_editing ()
             in
             wait_editing ())
      in
      click_last ()
  in
  if in_retry then E2e_assert.editor_mode env
  else
    Js.Promise.catch
      (fun _ -> open_last_block ~in_retry:true env)
      (E2e_assert.editor_mode env)

let save_block env text =
  (* target the live editing block's textarea — a stale sibling can hold
     nth=0/nth=-1 and silently absorb the fill; have_count=1 also flakes
     when a dying copy coexists during a remount *)
  let resolve_editor () =
    let* u = Util.wait_editing_uuid env in
    match u with
    | Some uuid ->
        Js.Promise.resolve
          (Printf.sprintf "#edit-block-%s:visible >> nth=-1" uuid)
    | None -> (
        (* editing state may point at a block whose textarea never
           mounted (remote-tx remount) — force-reopen it via the API *)
        let* st = Util.editing_uuid env in
        match st with
        | Some uuid ->
            let* _ =
              Js.Promise.catch
                (fun _ -> Js.Promise.resolve Js.null)
                (Api.ls_api_call env "editor.editBlock" [| Api.str uuid |])
            in
            let* _ =
              E2e_assert.is_visible_l ~timeout:15000.
                (Pw.q env (Printf.sprintf "#edit-block-%s:visible" uuid))
            in
            Js.Promise.resolve
              (Printf.sprintf "#edit-block-%s:visible" uuid)
        | None ->
            let* () =
              E2e_assert.have_count ~timeout:15000. env Util.editor_q 1
            in
            Js.Promise.resolve Util.editor_q_first)
  in
  (* the resolved textarea can die between the mount check and the click —
     re-resolve from live editing state and retry instead of failing on a
     stale selector *)
  let rec click_fill tries =
    let* editor_q = resolve_editor () in
    if tries <= 1 then
      let* () = Pw.click env editor_q in
      Js.Promise.resolve editor_q
    else
      let* clicked =
        Js.Promise.catch
          (fun _ -> Js.Promise.resolve false)
          (Js.Promise.then_ (fun () -> Js.Promise.resolve true)
             (Pw.click env editor_q))
      in
      if clicked then Js.Promise.resolve editor_q
      else click_fill (tries - 1)
  in
  let* editor_q = click_fill 3 in
  let* () = Pw.fill env editor_q text in
  (* a remount mid-fill can drop the text into the dying editor —
     verify the value and refill (bounded) *)
  let read_value () =
    Js.Promise.catch
      (fun _ -> Js.Promise.resolve "<gone>")
      (Pw.input_value env editor_q)
  in
  let rec verify_fill n =
    let* v = read_value () in
    if v = text then Js.Promise.resolve ()
    else if n <= 1 then Js.Promise.resolve ()
    else
      let* () =
        Js.Promise.catch (fun _ -> Js.Promise.resolve ())
          (Pw.fill env editor_q text)
      in
      verify_fill (n - 1)
  in
  let* () = verify_fill 3 in
  (* poll the live .value — a textarea's has-text match does not track
     the value under remounts *)
  let rec wait_value deadline =
    let* v = read_value () in
    if v = text then Js.Promise.resolve ()
    else if Js.Date.now () > deadline then
      Js.Promise.reject
        (Failure ("save_block: editor value never became " ^ text))
    else
      let* () = Util.wait_timeout env 200. in
      wait_value deadline
  in
  wait_value (Js.Date.now () +. 15000.)

let focus_new_block env ~previous_editor_id ?expected () =
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
  let accept uuid =
    match expected with
    | Some e -> uuid = e
    | None -> uuid <> prev_uuid
  in
  let deadline = Js.Date.now () +. 45000. in
  let rec wait_moved () =
    let* u = Util.editing_uuid env in
    match u with
    | Some uuid when accept uuid -> Js.Promise.resolve (Some uuid)
    | _ ->
        if Js.Date.now () > deadline then Js.Promise.resolve None
        else
          let* () = Util.wait_timeout env 200. in
          wait_moved ()
  in
  let* new_uuid = wait_moved () in
  match new_uuid, expected with
  | None, None ->
      failwith
        ("editing state never moved off " ^ previous_editor_id
       ^ " — Enter's insert op was swallowed")
  | Some uuid, _ | None, Some uuid ->
      (* when the insert is already confirmed but editing state never
         landed on it (remount reopened an old block), open the confirmed
         uuid's editor directly instead of failing *)
      let uuid = Option.value ~default:uuid new_uuid in
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
          (* a remote-tx remount can drop the freshly opened editor before
             it ever mounts — retry the API open once *)
          let rec open_editor attempt =
            let* _ =
              Api.ls_api_call env "editor.editBlock" [| Api.str uuid |]
            in
            Js.Promise.catch
              (fun _ ->
                 if attempt > 0 then open_editor (attempt - 1)
                 else
                   Js.Promise.reject
                     (Failure
                        ("editBlock never mounted #edit-block-" ^ uuid)))
              (E2e_assert.is_visible_l ~timeout:15000.
                 (Pw.q env ("#edit-block-" ^ uuid ^ ":focus")))
          in
          open_editor 2
      in
      Js.Promise.resolve uuid

let new_block env title =
  (* gate on the app's editing state and use its uuid for the live
     editor's id — a stale sibling textarea can share the DOM and make
     nth-based ids point at a dead editor *)
  let rec ensure_editing n =
    let* u = Util.editing_uuid env in
    match u with
    | Some uuid ->
        (* the state can outlive its textarea under remote-tx remounts —
           only accept it when the matching editor is actually mounted *)
        let* live =
          Js.Promise.catch
            (fun _ -> Js.Promise.resolve false)
            (Js.Promise.then_
               (fun j ->
                  Js.Promise.resolve (Js.Json.decodeBoolean j = Some true))
               (Pw.eval_js env
                  (Printf.sprintf
                     "(() => { const t = \
                      document.querySelector('#edit-block-%s'); return !!(t \
                      && t.offsetParent !== null); })()"
                     uuid)))
        in
        if live then Js.Promise.resolve uuid
        else begin
          let* _ =
            Js.Promise.catch
              (fun _ -> Js.Promise.resolve Js.null)
              (Api.ls_api_call env "editor.exitEditingMode"
                 [| Api.bool false |])
          in
          if n <= 0 then
            Js.Promise.reject (Failure "editor did not open")
          else
            let* () = open_last_block ~in_retry:true env in
            ensure_editing (n - 1)
        end
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
  let decode_ids j =
    match Js.Json.decodeString j with
    | Some s ->
        (match
           Js.Json.decodeArray
             (try Js.Json.parseExn s with _ -> Js.Json.array [||])
         with
         | Some a ->
             Array.to_list
               (Array.map
                  (fun v ->
                     Option.value ~default:"" (Js.Json.decodeString v))
                  a)
         | None -> [])
    | None -> []
  in
  let rec enter_new_block n =
    (* snapshot every block uuid in the page tree BEFORE pressing — the
       tree covers virtualized rows the DOM never mounts, so a remount
       that reopens editing on an off-screen block can no longer fake a
       "fresh" uuid (a DOM-only snapshot would call that uuid new).
       Falls back to mounted DOM ids when the api call itself fails. *)
    let* prev_ids =
      Js.Promise.catch
        (fun _ -> Js.Promise.resolve [])
        (Js.Promise.then_
           (fun j -> Js.Promise.resolve (decode_ids j))
           (Pw.eval_js env
              "(async () => { const p = await \
               logseq.api.get_current_page(); if (!p) return '[]'; const t \
               = await logseq.api.get_page_blocks_tree(p.uuid || p.name); \
               const ids = []; (function w(ns){(ns||[]).forEach(n => { if \
               (n && n.uuid) { ids.push(n.uuid); w(n.children); } \
               });})(t); return JSON.stringify(ids); })()"))
    in
    let* prev_ids =
      if prev_ids <> [] then Js.Promise.resolve prev_ids
      else
        Js.Promise.then_
          (fun j -> Js.Promise.resolve (decode_ids j))
          (Pw.eval_js env
             "(() => JSON.stringify([...document.querySelectorAll('.ls-block[blockid]')].map(b => b.getAttribute('blockid'))))()")
    in
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
    (* the insert op moves the app's editing state to the new block —
       confirm via the page tree (complete, unlike the mounted DOM): a
       fresh uuid positioned after last_uuid IS the insert; editing
       landing on a fresh-after-last_uuid uuid confirms it too. Editing
       moving to a pre-existing block does NOT count — a remount can
       reopen an old editor, and accepting it would make us type+delete
       into a real block. Re-press only while unconfirmed, so a late
       insert can never mint a duplicate. *)
    let* confirmed =
      if pressed then
        let prev_set =
          "["
          ^ String.concat ","
              (List.map (fun s -> "\"" ^ s ^ "\"") prev_ids)
          ^ "]"
        in
        let detect_js =
          Printf.sprintf
            "(async () => { const st = \
             logseq.api.get_state_from_store('editor/block'); const e = \
             st && st.uuid ? st.uuid : null; const p = await \
             logseq.api.get_current_page(); const t = p ? await \
             logseq.api.get_page_blocks_tree(p.uuid || p.name) : []; \
             const ids = []; (function w(ns){(ns||[]).forEach(n => { if \
             (n && n.uuid) { ids.push(n.uuid); w(n.children); } \
             });})(t); const prev = new Set(%s); const i = \
             ids.indexOf('%s'); if (i < 0) return null; if (e && e !== \
             '%s' && ids.indexOf(e) > i && !prev.has(e)) return e; return \
             ids.slice(i + 1).find(id => !prev.has(id)) || null; })()"
            prev_set last_uuid last_uuid
        in
        let deadline = Js.Date.now () +. 6000. in
        let rec moved_loop () =
          let* fresh =
            Js.Promise.catch
              (fun _ -> Js.Promise.resolve None)
              (Js.Promise.then_
                 (fun j ->
                    Js.Promise.resolve
                      (match Js.Nullable.toOption j with
                       | Some j -> Js.Json.decodeString j
                       | None -> None))
                 (Pw.eval_js env detect_js))
          in
          match fresh with
          | Some _ -> Js.Promise.resolve fresh
          | None ->
              if Js.Date.now () > deadline then Js.Promise.resolve None
              else
                let* () = Util.wait_timeout env 150. in
                moved_loop ()
        in
        moved_loop ()
      else Js.Promise.resolve None
    in
    match confirmed with
    | Some _ -> Js.Promise.resolve confirmed
    | None ->
        if n <= 1 then begin
          let* dbg =
            Js.Promise.catch
              (fun _ -> Js.Promise.resolve Js.null)
              (Js.Promise.then_
                 (fun j -> Js.Promise.resolve j)
                 (Pw.eval_js env
                    (Printf.sprintf
                       "(async () => { const st = \
                        logseq.api.get_state_from_store('editor/block'); \
                        const p = await logseq.api.get_current_page(); \
                        let t = []; try { t = p ? await \
                        logseq.api.get_page_blocks_tree(p.uuid || p.name) \
                        : [] } catch(e) {} const ids = []; (function \
                        w(ns){(ns||[]).forEach(n => { if (n && n.uuid) { \
                        ids.push(n.uuid); w(n.children); } });})(t); \
                        return JSON.stringify({e: st && st.uuid, page: p \
                        && p.name, i: ids.indexOf('%s'), n: ids.length, \
                        dom: document.querySelectorAll('.ls-block[blockid]').length, \
                        ta: document.querySelectorAll('.editor-wrapper \
                        textarea').length}); })()"
                       last_uuid)))
          in
          Js.log2 "[enter-dbg]" dbg;
          Js.Promise.reject
            (Failure "Enter press never confirmed a fresh block insert")
        end
        else
          let* () =
            Js.Promise.catch
              (fun _ -> Js.Promise.resolve ())
              (open_last_block ~in_retry:true env)
          in
          enter_new_block (n - 1)
  in
  let* confirmed = enter_new_block 3 in
  let* new_uuid =
    focus_new_block env ~previous_editor_id:last_id ?expected:confirmed ()
  in
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
  let* () = E2e_assert.editor_mode ~uuid:new_uuid env in
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
  (* remote-tx remounts can leave every editor unmounted for a while;
     wait for the app's editing state to exist first, then for the DOM
     editor to (re)appear. *)
  let* _ = Util.wait_editing_uuid env in
  let* () = E2e_assert.have_count ~timeout:45000. env Util.editor_q 1 in
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
