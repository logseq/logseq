(** Port of editor_basic_test.clj. *)

open Fest.Promise

module B = Block
module Page = Ls_page
module K = Keyboard
module Assert = E2e_assert
module Loc = Ls_locator

(** Sequential promise iteration over a list (clj's [doseq] over awaits). *)
let rec iter_seq f = function
  | [] -> Js.Promise.resolve ()
  | x :: rest ->
      let* () = f x in
      iter_seq f rest

let env = Fixtures.shared_open_page ()

external js_string_of : 'a -> string = "String" [@@mel.scope "globalThis"]

let open_recycle env =
  let* () = Pw.click env ".toolbar-dots-btn" in
  Pw.click env "[role='menuitem'] div:text('Recycle')"

let recycle_root env page_name =
  Loc.filter env ".ls-recycle-page-content section > div > div"
    ~has_text:page_name

let open_left_sidebar env =
  let* visible = Pw.visible env "#left-sidebar.is-open" in
  if visible then Js.Promise.resolve ()
  else
    let* () = Pw.click env "#left-menu" in
    Pw.wait_for env "#left-sidebar.is-open"

let open_block_context_menu env =
  let* () = B.new_blocks env [ "hover target" ] in
  let* () = Util.exit_edit env in
  let* () =
    Pw.click_right env
      ".ls-page-blocks .ls-block:not(.block-add-button) .bullet-container"
  in
  Pw.wait_for env ".ls-context-menu-content"

let open_page_context_menu env =
  let* () = Util.exit_edit env in
  let* () = Pw.click_right env "div[data-testid='page title']" in
  Pw.wait_for env ".ls-context-menu-content"

let reset_uncaught_errors env =
  let* _ =
    Pw.eval_js env
      "(() => { window.__lsUncaughtErrors = []; \
       if (!window.__lsUncaughtErrorsInstalled) { \
       window.__lsUncaughtErrorsInstalled = true; \
       window.addEventListener('error', (event) => { \
       window.__lsUncaughtErrors.push(String(event.error || event.message || '')); }); } \
       return true; })()"
  in
  Js.Promise.resolve ()

let uncaught_errors env =
  let* s =
    Pw.eval_js env
      "(() => JSON.stringify(window.__lsUncaughtErrors || []))()"
  in
  Js.Promise.resolve
    (match Api.json_parse s |> Js.Json.decodeArray with
     | Some a ->
         List.filter_map Js.Json.decodeString (Array.to_list a)
     | None -> [])

let stack_overflow_messages msgs =
  List.filter
    (fun m ->
      let n = String.length "Maximum call stack size exceeded" in
      let hl = String.length m in
      let rec go i =
        if i + n > hl then false
        else if String.sub m i n = "Maximum call stack size exceeded" then true
        else go (i + 1)
      in
      n = 0 || go 0)
    msgs

let collect_page_errors env errs =
  Playwright.on_event (Env.page env) "pageerror" (fun e ->
      Queue.add (js_string_of e) errs)

let assert_no_stack_overflow env page_errors =
  let* js_errs = uncaught_errors env in
  let console = Env.console_logs env in
  let overflows =
    stack_overflow_messages (Queue.fold (fun a m -> m :: a) [] page_errors)
    @ stack_overflow_messages js_errs
    @ stack_overflow_messages console
  in
  Fest.deep_equal overflows [] Fest.expect;
  Js.Promise.resolve ()

let highlight_context_menu_item env =
  let item =
    Playwright.locator_first
      (Pw.q env ".ls-context-menu-content [role='menuitem']")
  in
  let* () = Pw.hover_l item in
  Js.Promise.resolve item

let leave_context_menu_by_tab env =
  let* item = highlight_context_menu_item env in
  let* () = Playwright.locator_press item "Tab" in
  let rec loop n =
    if n > 0 then
      let* visible = Pw.visible env ".ls-context-menu-content" in
      if visible then
        let* () = K.tab env in
        loop (n - 1)
      else Js.Promise.resolve ()
    else Js.Promise.resolve ()
  in
  loop 40

let leave_context_menu_by_shift_tab env =
  let* item = highlight_context_menu_item env in
  Playwright.locator_press item "Shift+Tab"

let choose_move_target env target =
  let* () = Pw.fill env "input[placeholder=\"Move blocks to\"]" target in
  let result =
    Playwright.locator_first (Pw.get_by_test_id env target)
  in
  let* _ = Assert.is_visible_l result in
  Pw.click_l result

let drag_and_drop_file env file_name file_type =
  let* _ =
    Pw.eval_js env
      (Printf.sprintf
         "(() => { \
          const container = document.querySelector('#main-content-container'); \
          if (!container) { throw new Error('main-content-container not found'); } \
          const dataTransfer = new DataTransfer(); \
          dataTransfer.items.add(new File(['logseq-e2e-drag-drop'], %s, { type: %s })); \
          container.dispatchEvent(new DragEvent('dragover', { dataTransfer, bubbles: true, cancelable: true })); \
          container.dispatchEvent(new DragEvent('drop', { dataTransfer, bubbles: true, cancelable: true })); \
          })();"
         (Pw.json_stringify file_name)
         (Pw.json_stringify file_type))
  in
  Js.Promise.resolve ()

let enable_virtualized_rendering env =
  let* _ =
    Pw.eval_js env
      "(() => { const url = new URL(location.href); \
       url.searchParams.set('virtualized', 'true'); \
       history.replaceState(null, '', url.pathname + url.search + url.hash); })()"
  in
  let* () = Pw.refresh env in
  let* () =
    Pw.wait_for env ~timeout:15000.
      "[data-testid='page title']"
  in
  Assert.graph_loaded env

let js_json env script =
  let* (v : Js.Json.t) = Pw.eval_js env script in
  Js.Promise.resolve
    (match Js.Json.decodeString v with
     | Some s -> Api.json_parse s
     | None -> v)

let start_edit_exit_frame_capture env =
  let* _ =
    Pw.eval_js env
      "(() => { \
       const editor = document.querySelector('.editor-wrapper textarea'); \
       const block = editor?.closest('.ls-block'); \
       if (!block) throw new Error('Expected an editing block'); \
       window.__e2eEditExitFrames = []; \
       const startedAt = performance.now(); \
       const sample = () => { \
       const currentEditor = block.querySelector('.editor-wrapper textarea'); \
       const title = block.querySelector('.block-title-wrap'); \
       const pageRef = block.querySelector('.page-reference .page-ref'); \
       window.__e2eEditExitFrames.push({ \
       editing: Boolean(currentEditor), \
       text: title?.textContent || '', \
       pageRefText: pageRef?.textContent || '' }); \
       if (performance.now() - startedAt < 400) requestAnimationFrame(sample); }; \
       requestAnimationFrame(sample); \
       return true; })()"
  in
  Js.Promise.resolve ()

let edit_exit_read_frames env =
  let* () = Util.wait_timeout env 450. in
  let* frames = js_json env "JSON.stringify(window.__e2eEditExitFrames)" in
  Js.Promise.resolve
    (match Js.Json.decodeArray frames with
     | Some a ->
         Array.to_list a
         |> List.filter (fun f ->
                match Api.get_bool f "editing" with
                | Some true -> false
                | _ -> true)
     | None -> [])

let insert_current_page_blocks env blocks =
  let* page = Api.ls_api_call env "editor.getCurrentPage" [||] in
  let page_uuid = Api.get_raw page "uuid" in
  let* _ =
    Api.ls_api_call env "editor.insertBatchBlock"
      [| page_uuid
       ; Api.arr
           (Array.map (fun c -> Api.obj [ "content", Api.str c ]) blocks)
       ; Api.obj [ "sibling", Api.bool false ]
      |]
  in
  let* _ =
    Api.ls_api_call env "editor.exitEditingMode" [| Api.bool false |]
  in
  let* _ =
    Api.ls_api_call env "app.pushState"
      [| Api.str "page"; Api.obj [ "name", page_uuid ]; Api.null |]
  in
  Js.Promise.resolve ()

let select_block_range_with_fast_scroll env blocks =
  let* (r : Js.Json.t) =
    Pw.eval_js_arg env
      "async (blockTitles) => { \
       const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); \
       const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))); \
       const scrollContainer = document.querySelector('#main-content-container'); \
       const blockByTitle = (title) => Array.from(document.querySelectorAll('.ls-page-blocks .page-blocks-inner .ls-block:not(.block-add-button)')) \
       .find((block) => block.textContent.includes(title)); \
       const scrollToBlock = async (title, step) => { \
       for (let i = 0; i < 120; i++) { \
       const block = blockByTitle(title); \
       if (block) { \
       block.scrollIntoView({ block: 'center' }); \
       await nextFrame(); \
       return block; \
       } \
       scrollContainer.scrollTop += step; \
       await nextFrame(); \
       } \
       throw new Error(`Could not find mounted block ${title}`); \
       }; \
       if (!document.querySelector('[data-virtuoso-scroller]')) { \
       throw new Error('Expected virtualized list scroller'); \
       } \
       scrollContainer.scrollTop = 0; \
       await nextFrame(); \
       const firstBlock = await scrollToBlock(blockTitles[0], -1000); \
       const firstContent = firstBlock.querySelector('.block-content'); \
       const firstRect = firstContent.getBoundingClientRect(); \
       const clientX = Math.floor(firstRect.left + 24); \
       const clientY = Math.floor(firstRect.top + Math.min(20, firstRect.height / 2)); \
       const pointerInit = { bubbles: true, cancelable: true, button: 0, buttons: 1, clientX, clientY }; \
       firstContent.dispatchEvent(new PointerEvent('pointerdown', pointerInit)); \
       await delay(100); \
       await scrollToBlock(blockTitles[blockTitles.length - 1], 1400); \
       await delay(200); \
       document.querySelector('#app-container-wrapper')?.dispatchEvent(new PointerEvent('pointerup', { \
       bubbles: true, cancelable: true, button: 0, buttons: 0, clientX, clientY \
       })); \
       return ((await window.logseq.api.get_selected_blocks()) || []) \
       .map((block) => block.title || block.content); \
       }"
      (Js.Json.array (Array.map Js.Json.string blocks))
  in
  Js.Promise.resolve
    (match Js.Json.decodeArray r with
     | Some a ->
         List.filter_map Js.Json.decodeString (Array.to_list a)
     | None -> [])

let wait_for_copied_blocks env blocks =
  let rec loop remaining =
    let* clipboard = Util.clipboard_text env in
    let missing =
      List.filter
        (fun b ->
          let n = String.length b and h = String.length clipboard in
          let rec go i =
            if i + n > h then false
            else if String.sub clipboard i n = b then true
            else go (i + 1)
          in
          n = 0 || not (go 0))
        blocks
    in
    if missing = [] || remaining = 0 then
      Js.Promise.resolve (String.length clipboard, missing)
    else
      let* () = Util.wait_timeout env 100. in
      loop (remaining - 1)
  in
  loop 50

let seed_journals env journals =
  let* () =
    iter_seq
      (fun (date, blocks) ->
        let* page = Api.ls_api_call env "editor.createJournalPage" [| Api.str date |] in
        let* _ =
          Api.ls_api_call env "editor.insertBatchBlock"
            [| Api.get_raw page "uuid"
             ; Api.arr
                 (Array.map
                    (fun c -> Api.obj [ "content", Api.str c ])
                    blocks)
             ; Api.obj [ "sibling", Api.bool false ]
            |]
        in
        Js.Promise.resolve ())
      journals
  in
  let* _ =
    Api.ls_api_call env "editor.exitEditingMode" [| Api.bool false |]
  in
  let* () = Util.goto_journals env in
  Pw.wait_for env "#journals"

let seed_journals_with_linked_ref env =
  let* target =
    Api.ls_api_call env "editor.createJournalPage"
      [| Api.str "2026-03-01T12:00:00" |]
  in
  let* source =
    Api.ls_api_call env "editor.createJournalPage"
      [| Api.str "2026-02-28T12:00:00" |]
  in
  let* _ =
    Api.ls_api_call env "editor.insertBatchBlock"
      [| Api.get_raw target "uuid"
       ; Api.arr
           [| Api.obj
                [ "content"
                , Api.str "journals linked refs visible target" ]
           |]
       ; Api.obj [ "sibling", Api.bool false ]
      |]
  in
  let* _ =
    Api.ls_api_call env "editor.insertBatchBlock"
      [| Api.get_raw source "uuid"
       ; Api.arr
           [| Api.obj
                [ "content"
                , Api.str
                    (Printf.sprintf
                       "journals linked refs visible source [[%s]]"
                       (Option.value ~default:""
                          (Api.get_string target "name"))) ]
           |]
       ; Api.obj [ "sibling", Api.bool false ]
      |]
  in
  let* _ =
    Api.ls_api_call env "editor.exitEditingMode" [| Api.bool false |]
  in
  let* () = Util.goto_journals env in
  Pw.wait_for env "#journals"

let scroll_journals_to_text env text =
  let* _ =
    Pw.eval_js_arg env
      "async (text) => { \
       const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); \
       const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))); \
       const scrollContainer = document.querySelector('#main-content-container'); \
       if (!scrollContainer) { throw new Error('Expected main content scroller'); } \
       const findText = () => Array.from(document.querySelectorAll('#journals .journal-item')) \
       .find((item) => item.textContent.includes(text)); \
       scrollContainer.scrollTop = 0; \
       await nextFrame(); \
       for (let i = 0; i < 240; i++) { \
       for (let settle = 0; settle < 40; settle++) { \
       const item = findText(); \
       if (item) { \
       item.scrollIntoView({ block: 'center' }); \
       await nextFrame(); \
       return true; \
       } \
       const visibleItems = Array.from(document.querySelectorAll('#journals .journal-item')) \
       .filter((journal) => { \
       const rect = journal.getBoundingClientRect(); \
       const containerRect = scrollContainer.getBoundingClientRect(); \
       return rect.bottom > containerRect.top && rect.top < containerRect.bottom; \
       }); \
       if (visibleItems.length > 0 && visibleItems.every((journal) => journal.textContent.trim())) { \
       break; \
       } \
       await delay(50); \
       } \
       scrollContainer.scrollTop += Math.max(280, Math.floor(scrollContainer.clientHeight * 0.7)); \
       await delay(80); \
       } \
       throw new Error(`Could not find mounted journal text ${text}`); \
       }"
      text
  in
  Js.Promise.resolve ()

let journals_layout_metrics env =
  js_json env
    "(async () => { \
     const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))); \
     for (let i = 0; i < 40; i++) { \
     if (document.querySelector('#journals .journal-item')) { break; } \
     await nextFrame(); \
     } \
     const journalItem = document.querySelector('#journals .journal-item'); \
     if (!journalItem) { throw new Error('Expected a mounted journal item'); } \
     const style = getComputedStyle(journalItem); \
     return JSON.stringify({ \
     'journal-item-margin-bottom': Number.parseFloat(style.marginBottom), \
     'journal-item-padding-bottom': Number.parseFloat(style.paddingBottom), \
     'journals-scroller-count': document.querySelectorAll('#journals [data-virtuoso-scroller]').length \
     }); \
     })();"

let journals_linked_refs_metrics env =
  js_json env
    "(async () => { \
     const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); \
     let references = null; \
     let foldableContent = null; \
     let viewBody = null; \
     for (let i = 0; i < 80; i++) { \
     references = document.querySelector('#journals .references'); \
     foldableContent = references?.querySelector('.ls-foldable-content'); \
     viewBody = references?.querySelector('.ls-view-body'); \
     const expanded = foldableContent?.getAttribute('aria-hidden') !== 'true'; \
     const bodyHeight = viewBody?.getBoundingClientRect().height || 0; \
     if (references && expanded && bodyHeight > 0) { break; } \
     await delay(100); \
     } \
     if (!references) { throw new Error('Expected linked references in journals'); } \
     return JSON.stringify({ \
     'collapsed': foldableContent?.getAttribute('aria-hidden') === 'true', \
     'body-mounted': Boolean(viewBody), \
     'body-height': viewBody?.getBoundingClientRect().height || 0 \
     }); \
     })();"

let set_journals_scroll_position env position =
  let* _ =
    Pw.eval_js_arg env
      "pos => { \
       const scrollContainer = document.querySelector('#main-content-container'); \
       if (!scrollContainer) { throw new Error('Expected main content scroller'); } \
       scrollContainer.scrollTop = pos === 'start' ? 0 : scrollContainer.scrollHeight; \
       }"
      position
  in
  Js.Promise.resolve ()

let mounted_journal_height env block_title =
  Pw.eval_js_arg env
    "title => { \
     const journal = Array.from(document.querySelectorAll('#journals .journal-item')) \
     .find((item) => item.textContent.includes(title)); \
     if (!journal) { throw new Error(`Expected mounted journal containing ${title}`); } \
     return Math.round(journal.getBoundingClientRect().height); \
     }"
    block_title

let multiline_heading_bullet_alignment env title =
  js_json env
    (Printf.sprintf
       "(async () => { \
        const title = %s; \
        const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))); \
        const block = Array.from(document.querySelectorAll('.ls-page-blocks .page-blocks-inner .ls-block:not(.block-add-button)')) \
        .find((block) => block.textContent.includes(title)); \
        if (!block) { throw new Error(`Block not found: ${title}`); } \
        const wrapper = block.querySelector('.block-content-wrapper'); \
        const bullet = block.querySelector('.bullet-container'); \
        const heading = block.querySelector('.block-title-wrap.as-heading'); \
        if (!wrapper || !bullet || !heading) { \
        throw new Error('Expected heading block with bullet controls'); \
        } \
        wrapper.style.maxWidth = '160px'; \
        await nextFrame(); \
        const bulletRect = bullet.getBoundingClientRect(); \
        const headingRect = heading.getBoundingClientRect(); \
        const lineHeight = Number.parseFloat(window.getComputedStyle(heading).lineHeight); \
        const firstLineCenterY = headingRect.top + (lineHeight / 2); \
        const bulletCenterY = bulletRect.top + (bulletRect.height / 2); \
        return JSON.stringify({ bulletCenterY, firstLineCenterY, delta: Math.abs(bulletCenterY - firstLineCenterY) }); \
        })();"
       (Pw.json_stringify title))

let journals_rows_state env =
  js_json env
    "(() => { \
     const rows = Array.from(document.querySelectorAll('#journals [data-index]')); \
     return JSON.stringify(rows.map((row) => { \
     const item = row.querySelector('.journal-item'); \
     return {index: row.dataset.index, \
     content: !!row.querySelector('.cp__page-inner-wrap'), \
     placeholder: !!row.querySelector('.journal-item-placeholder'), \
     minHeight: item ? item.style.minHeight : null}; \
     })); \
     })();"

let scroll_journals_down env step steps : float Js.Promise.t =
  Pw.eval_js_arg env
    "(args) => { \
     const scrollContainer = document.querySelector('#main-content-container'); \
     const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))); \
     return (async () => { \
     for (let i = 0; i < args.steps; i++) { \
     scrollContainer.scrollTop += args.step; \
     await nextFrame(); \
     } \
     return scrollContainer.scrollTop; \
     })(); \
     }"
    (Js.Json.object_
       (Js.Dict.fromList
          [ "step", Js.Json.number step; "steps", Js.Json.number steps ]))

let console_logs env = Env.console_logs env

let worker_op_logs logs op_names =
  List.filter
    (fun l ->
      let contains sub =
        let n = String.length sub and h = String.length l in
        let rec go i =
          if i + n > h then false
          else if String.sub l i n = sub then true
          else go (i + 1)
        in
        n = 0 || go 0
      in
      contains ":db-worker/outliner-op-perf" && contains (":op-names " ^ op_names))
    logs

let editor_input_state env =
  js_json env
    "(() => { \
     const editor = document.querySelector('.editor-wrapper textarea'); \
     return JSON.stringify({ \
     value: editor?.value ?? null, \
     focused: editor === document.activeElement, \
     selectionStart: editor?.selectionStart ?? null, \
     selectionEnd: editor?.selectionEnd ?? null, \
     blockTitles: Array.from(document.querySelectorAll('.ls-page-blocks .block-title-wrap')) \
     .map((node) => node.textContent.trim()) \
     }); \
     })();"

let selection_range env =
  Pw.eval_js env
    "(() => { \
     const editor = document.querySelector('.editor-wrapper textarea'); \
     return `${editor.selectionStart}:${editor.selectionEnd}`; \
     })()"

let assert_editor_value env value =
  Playwright.expect_has_value
    (Playwright.expect (Pw.q env Util.editor_q))
    value

let editor_box_heights env =
  js_json env
    "(() => { \
     const editor = document.querySelector('.editor-wrapper textarea'); \
     return JSON.stringify({client: editor.clientHeight, scroll: editor.scrollHeight}); \
     })();"

let caret_row = "abcdefghij klmnopqrst"
let caret_3_rows =
  String.concat "\n" [ caret_row; caret_row; caret_row ]

let block_of_three_rows env =
  let* () = B.new_block env "" in
  let* () = Util.input env caret_3_rows in
  let* () = Util.move_cursor_to_end env in
  let* c = Util.edit_content env in
  Fest.deep_equal c caret_3_rows Fest.expect;
  Js.Promise.resolve ()

let t name body =
  Fest.Promise.test name (fun () ->
      let* env = env in
      let* () = Fixtures.new_logseq_page env in
      let* _ = body env in
      Fixtures.validate_graph env)

let () =
  if Util.is_main "test_editor_basic.js" then (
    t "recycle-restore-removes-row-immediately-test" (fun env ->
        let page_name = "recycle-restore-" ^ Util.random_uuid () in
        let* () = Page.new_page env page_name in
        let* () = Page.delete_page env page_name in
        let* () = open_recycle env in
        let root = recycle_root env page_name in
        let* _ = Assert.is_visible_l root in
        let* () =
          Pw.click_l (Playwright.locator_locator root "button:text('Restore')")
        in
        let* _ = Assert.have_count_l root 0 in
        Pw.wait_for_hidden_l
          (Loc.filter env ".ui__toast.success" ~has_text:page_name));

    t "recycle-delete-removes-row-and-recent-entry-test" (fun env ->
        let page_name = "recycle-delete-" ^ Util.random_uuid () in
        let recent_item =
          Loc.filter env ".recent .recent-item" ~has_text:page_name
        in
        let* () = open_left_sidebar env in
        let* () = Page.new_page env page_name in
        let* () = B.save_block env "recycle delete content" in
        let* () = Page.delete_page env page_name in
        let* () = open_recycle env in
        let root = recycle_root env page_name in
        let* _ = Assert.is_visible_l root in
        let dialog_seen = ref ("", "") in
        let handler d =
          dialog_seen :=
            ( Playwright.dialog_type d
            , Playwright.dialog_message d );
          ignore (Playwright.dialog_accept d)
        in
        Playwright.on_event (Env.page env) "dialog" handler;
        let* () =
          Js.Promise.then_
            (fun () -> Js.Promise.resolve ())
            (let* () =
               Pw.click_l
                 (Playwright.locator_locator root "button:text('Delete')")
             in
             Js.Promise.resolve ())
        in
        Playwright.off_event (Env.page env) "dialog" handler;
        let dtype, dmsg = !dialog_seen in
        Fest.deep_equal dtype "confirm" Fest.expect;
        (* message includes "cannot be undone" *)
        let sub = "cannot be undone" in
        let n = String.length sub and h = String.length dmsg in
        let rec go i =
          if i + n > h then false
          else if String.sub dmsg i n = sub then true
          else go (i + 1)
        in
        Fest.deep_equal (go 0) true Fest.expect;
        let* _ = Assert.have_count_l root 0 in
        let* _ = Assert.have_count_l recent_item 0 in
        Pw.wait_for_hidden_l
          (Loc.filter env ".ui__toast.success" ~has_text:page_name));

    t "page-context-menu-tab-closes-without-stack-overflow-test"
      (fun env ->
        let errs = Queue.create () in
        collect_page_errors env errs;
        let* _ = reset_uncaught_errors env in
        let* () = open_page_context_menu env in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env "[role='menuitem']" ~has_text:"Delete page")
        in
        let* () = leave_context_menu_by_tab env in
        let* () = Pw.wait_for_hidden env ".ls-context-menu-content" in
        let* () = assert_no_stack_overflow env errs in
        Assert.is_visible env "div[data-testid='page title']");

    t "page-context-menu-shift-tab-closes-without-stack-overflow-test"
      (fun env ->
        let errs = Queue.create () in
        collect_page_errors env errs;
        let* _ = reset_uncaught_errors env in
        let* () = open_page_context_menu env in
        let* () = leave_context_menu_by_shift_tab env in
        let* () = Pw.wait_for_hidden env ".ls-context-menu-content" in
        let* () = assert_no_stack_overflow env errs in
        Assert.is_visible env "div[data-testid='page title']");

    t "block-context-menu-tab-does-not-overflow-test" (fun env ->
        let errs = Queue.create () in
        collect_page_errors env errs;
        let* _ = reset_uncaught_errors env in
        let* () = open_block_context_menu env in
        let* () = leave_context_menu_by_tab env in
        let* () = Pw.wait_for_hidden env ".ls-context-menu-content" in
        let* () = assert_no_stack_overflow env errs in
        Assert.is_visible env "div[data-testid='page title']");

    t "block-context-menu-clickable-controls-use-pointer-test" (fun env ->
        let* () = open_block_context_menu env in
        let heading_button = "button[title='Auto heading']" in
        let item = "[role='menuitem']:has-text('Add comment')" in
        let sub_trigger = "[role='menuitem']:has-text('Add reaction')" in
        let* () = Pw.hover_l (Pw.q env heading_button) in
        let* c1 =
          Pw.eval_on_element env heading_button
            "element => getComputedStyle(element).cursor"
        in
        Fest.deep_equal c1 "pointer" Fest.expect;
        let* () = Pw.hover_l (Pw.q env item) in
        let* c2 =
          Pw.eval_on_element env item
            "element => getComputedStyle(element).cursor"
        in
        Fest.deep_equal c2 "pointer" Fest.expect;
        let* () = Pw.hover_l (Pw.q env sub_trigger) in
        let* c3 =
          Pw.eval_on_element env sub_trigger
            "element => getComputedStyle(element).cursor"
        in
        Fest.deep_equal c3 "pointer" Fest.expect;
        Js.Promise.resolve ());

    t "block-context-menu-color-hover-shows-ring-test" (fun env ->
        let* () = open_block_context_menu env in
        let sel = "a[title='Yellow'] .heading-bg" in
        let* before =
          Pw.eval_on_element env sel
            "element => getComputedStyle(element).boxShadow"
        in
        let* () = Pw.hover_l (Pw.q env sel) in
        let* after =
          Pw.eval_on_element env sel
            "element => getComputedStyle(element).boxShadow"
        in
        Fest.deep_equal (before <> after) true Fest.expect;
        Fest.deep_equal (after <> "none") true Fest.expect;
        Js.Promise.resolve ());

    t "notification-appears-at-top-right-test" (fun env ->
        let message_key = "notification-position-test" in
        let toast =
          Loc.filter env ".ui__toast" ~has_text:"notification position test"
        in
        let* _ =
          Api.ls_api_call env "show_msg"
            [| Api.str "notification position test"
             ; Api.str "success"
             ; Api.obj
                 [ "key", Api.str message_key; "timeout", Api.num 0. ]
            |]
        in
        let* () =
          Js.Promise.resolve ()
        in
        let* () = Pw.wait_for_l toast in
        let* pos =
          Pw.eval_js env
            "(() => { \
             const toast = Array.from(document.querySelectorAll('.ui__toast')) \
             .find((element) => element.textContent.includes('notification position test')); \
             const rect = toast.getBoundingClientRect(); \
             const vertical = rect.top < window.innerHeight / 2 ? 'top' : 'bottom'; \
             const horizontal = window.innerWidth - rect.right <= 48 ? 'right' : 'left'; \
             return `${vertical}-${horizontal}`; \
             })()"
        in
        Fest.deep_equal pos "top-right" Fest.expect;
        let* _ =
          Api.ls_api_call env "ui.close_msg" [| Api.str message_key |]
        in
        Pw.wait_for_hidden_l toast);

    t "favorites-and-recents-load-after-refresh-test" (fun env ->
        let page_name = "sidebar-startup-" ^ Util.random_uuid () in
        let favorite_item =
          Loc.filter env ".favorites .favorite-item" ~has_text:page_name
        in
        let recent_item =
          Loc.filter env ".recent .recent-item" ~has_text:page_name
        in
        let* () = Page.new_page env page_name in
        let* () = K.press env "ControlOrMeta+Shift+f" in
        let* _ = Assert.is_visible_l favorite_item in
        let* _ = Assert.is_visible_l recent_item in
        let* _ = Util.refresh_until_graph_loaded env in
        let* () = Util.wait_timeout env 500. in
        let* c1 = Playwright.count favorite_item in
        let* c2 = Playwright.count recent_item in
        Fest.deep_equal (c1, c2) (1, 1) Fest.expect;
        Js.Promise.resolve ());

    t "favorite-menu-and-sidebar-follow-page-updates-test" (fun env ->
        let page_name = "favorite-reactivity-" ^ Util.random_uuid () in
        let renamed_page = "renamed-favorite-" ^ Util.random_uuid () in
        let favorite_item name =
          Loc.filter env ".favorites .favorite-item" ~has_text:name
        in
        let recent_item name =
          Loc.filter env ".recent .recent-item" ~has_text:name
        in
        let* () = Page.new_page env page_name in
        let* () = Util.exit_edit env in
        let* () = open_left_sidebar env in
        let* () = K.press env "ControlOrMeta+Shift+f" in
        let* _ = Assert.is_visible_l (favorite_item page_name) in
        let* () = Pw.click env ".toolbar-dots-btn" in
        let* () =
          Pw.click_l
            (Loc.filter env "[role='menuitem']" ~has_text:"Unfavorite page")
        in
        let* _ = Assert.have_count_l (favorite_item page_name) 0 in
        let* () = Pw.click env ".toolbar-dots-btn" in
        let* () =
          Pw.click_l
            (Loc.filter env "[role='menuitem']" ~has_text:"Add to Favorites")
        in
        let* _ = Assert.is_visible_l (favorite_item page_name) in
        let* () = Page.rename_page env page_name renamed_page in
        let* _ = Assert.is_visible_l (favorite_item renamed_page) in
        let* _ = Assert.is_visible_l (recent_item renamed_page) in
        let* _ = Assert.have_count_l (favorite_item page_name) 0 in
        Assert.have_count_l (recent_item page_name) 0);

    t "page-alias-can-be-added-and-removed-from-the-property-picker-test"
      (fun env ->
        let target_page = "alias-target-" ^ Util.random_uuid () in
        let source_page = "alias-source-" ^ Util.random_uuid () in
        let target_result =
          Printf.sprintf ".property-select :text-is('%s')" target_page
        in
        let target_value =
          Loc.filter env ".ls-page-properties .property-value"
            ~has_text:target_page
        in
        let* () = Page.new_page env target_page in
        let* () = B.save_block env "alias target content" in
        let* () = Util.exit_edit env in
        let* () = Page.new_page env source_page in
        let* () = B.save_block env "alias source content" in
        let* () = Util.exit_edit env in
        let* () = Pw.click env "button:text('Set property')" in
        let* () =
          Pw.click_l
            (Loc.and_l (Pw.q env "strong")
               (Util.get_by_text env "Alias" true))
        in
        let* () =
          Pw.fill env "input[placeholder='Set Alias']" target_page
        in
        let* () = Pw.click env target_result in
        let* () = K.esc env in
        let* page = Api.ls_api_call env "editor.getPage" [| Api.str source_page |] in
        let alias_titles =
          match Api.get_list page "alias" with
          | Some items ->
              List.filter_map
                (fun i -> Api.get_string i "title")
                (Array.to_list items)
          | None -> []
        in
        Fest.deep_equal alias_titles [ target_page ] Fest.expect;
        let* _ = Assert.is_visible_l target_value in
        let* () =
          Playwright.locator_press
            (Playwright.locator_locator target_value
               ".multi-values.jtrigger")
            "Enter"
        in
        let* () =
          Pw.fill env "input[placeholder='Set Alias']" target_page
        in
        let* () = Pw.click env target_result in
        let* _ = Assert.have_count_l target_value 0 in
        Pw.click_l (Pw.get_by_test_id env "page title"));

    t "theme-preview-images-load-test" (fun env ->
        let* () = Pw.click env ".toolbar-dots-btn" in
        let* () =
          Pw.click_l
            (Loc.filter env "[role='menuitem']" ~has_text:"Settings")
        in
        let* _ = Assert.is_visible env ".cp__theme-modes-options" in
        let* ok =
          Pw.eval_js env
            "(async () => { \
             const previews = Array.from( \
             document.querySelectorAll('.cp__theme-modes-options > li > i')); \
             const urls = previews.map((preview) => { \
             const match = getComputedStyle(preview).backgroundImage.match(/^url\\([\"']?(.*?)[\"']?\\)$/); \
             return match?.[1]; \
             }); \
             if (urls.length !== 3 || urls.some((url) => !url)) { return false; } \
             const loaded = await Promise.all(urls.map((url) => new Promise((resolve) => { \
             const image = new Image(); \
             image.onload = () => resolve(image.naturalWidth > 0); \
             image.onerror = () => resolve(false); \
             image.src = url; \
             }))); \
             return loaded.every(Boolean); \
             })()"
        in
        Fest.deep_equal ok true Fest.expect;
        Js.Promise.resolve ());

    t "language-select-shows-dropdown-indicator-test" (fun env ->
        let* () = Pw.click env ".toolbar-dots-btn" in
        let* () =
          Pw.click_l
            (Loc.filter env "[role='menuitem']" ~has_text:"Settings")
        in
        let* _ = Assert.is_visible env ".ui__select-trigger" in
        Assert.have_count env ".ui__select-trigger .ui__select-icon svg" 1);

    t "main-scrollbar-track-uses-main-background-test" (fun env ->
        let* ok =
          Pw.eval_js env
            "(() => { \
             const main = document.querySelector('#main-content-container'); \
             const style = getComputedStyle(main); \
             const probe = document.createElement('span'); \
             probe.style.color = style.getPropertyValue('--ls-primary-background-color'); \
             document.body.appendChild(probe); \
             const mainBackground = getComputedStyle(probe).color; \
             probe.remove(); \
             return style.scrollbarColor.endsWith(mainBackground); \
             })()"
        in
        Fest.deep_equal ok true Fest.expect;
        Js.Promise.resolve ());

    t "click-rendered-block-focuses-editor" (fun env ->
        let title = "click rendered block focuses editor" in
        let* () = insert_current_page_blocks env [| title |] in
        let* () =
          Pw.click env
            (Printf.sprintf ".ls-block .block-content:has-text('%s')" title)
        in
        let* _ = Assert.editor_mode env in
        let* r =
          js_json env
            "(() => { \
             const editor = document.querySelector('.editor-wrapper textarea'); \
             return JSON.stringify({ \
             activeId: document.activeElement && document.activeElement.id, \
             activeTag: document.activeElement && document.activeElement.tagName, \
             editorId: editor && editor.id, \
             editorFocused: editor === document.activeElement \
             }); \
             })();"
        in
        Fest.deep_equal (Api.get_bool r "editorFocused") (Some true)
          Fest.expect;
        Js.Promise.resolve ());

    t "multiline-heading-keeps-bullet-on-first-line" (fun env ->
        let* () =
          iter_seq
            (fun heading ->
              let title =
                Printf.sprintf
                  "Multiline %s heading bullet should stay on the first visual line"
                  heading
              in
              let* () = B.new_block env title in
              let* () = Util.input_command env heading in
              let* () = Util.exit_edit env in
              let* _ =
                Assert.is_visible_l
                  (Loc.filter env ".block-title-wrap.as-heading"
                     ~has_text:title)
              in
              let* alignment =
                multiline_heading_bullet_alignment env title
              in
              let delta =
                Option.value ~default:999.
                  (Api.get_float alignment "delta")
              in
              Fest.deep_equal (delta <= 3.) true Fest.expect;
              Js.Promise.resolve ())
            [ "h1"; "h6" ]
        in
        Js.Promise.resolve ());

    t "copy-blocks-selected-after-fast-scroll-virtualized-list" (fun env ->
        let blocks =
          Array.init 30 (fun i ->
              Printf.sprintf "fast-scroll-copy-block-%03d" (i + 1))
        in
        let* () = insert_current_page_blocks env blocks in
        let* _ = enable_virtualized_rendering env in
        let* selected =
          select_block_range_with_fast_scroll env blocks
        in
        let missing_sel =
          List.filter
            (fun b -> not (List.mem b selected))
            (Array.to_list blocks)
        in
        Fest.deep_equal missing_sel [] Fest.expect;
        let* () = B.copy env in
        let* _len, missing =
          wait_for_copied_blocks env (Array.to_list blocks)
        in
        Fest.deep_equal missing [] Fest.expect;
        Js.Promise.resolve ());

    t "journals-list-uses-measured-spacing-without-item-margins"
      (fun env ->
        let* () =
          seed_journals env
            [ "2026-03-05T12:00:00", [| "journals measured spacing first" |]
            ; "2026-03-04T12:00:00", [| "journals measured spacing second" |]
            ]
        in
        let* () = Pw.wait_for env "#journals .journal-item" in
        let* metrics = journals_layout_metrics env in
        Fest.deep_equal
          (Option.value ~default:(-1.)
             (Api.get_float metrics "journal-item-margin-bottom"))
          0. Fest.expect;
        Fest.deep_equal
          (Option.value ~default:0.
             (Api.get_float metrics "journal-item-padding-bottom")
           > 0.)
          true Fest.expect;
        Js.Promise.resolve ());

    t "journals-list-does-not-nest-virtualized-scrollers-in-long-journal"
      (fun env ->
        let blocks =
          Array.init 12 (fun i ->
              Printf.sprintf "journals long stable block %03d" (i + 1))
        in
        let* () =
          seed_journals env [ "2026-03-06T12:00:00", blocks ]
        in
        let* () =
          Pw.wait_for env
            (Printf.sprintf "#journals .journal-item:has-text('%s')"
               blocks.(0))
        in
        let* _ = enable_virtualized_rendering env in
        let* () =
          Pw.wait_for env "#journals [data-virtuoso-scroller]"
        in
        let* () = scroll_journals_to_text env blocks.(0) in
        let* metrics = journals_layout_metrics env in
        Fest.deep_equal
          (Option.value ~default:0
             (Api.get_int metrics "journals-scroller-count"))
          1 Fest.expect;
        Js.Promise.resolve ());

    t "journals-list-rows-hold-no-pin-once-content-is-in" (fun env ->
        let journals =
          List.init 30 (fun idx ->
              ( Printf.sprintf "2026-03-%02dT12:00:00" (idx + 1)
              , [| Printf.sprintf "journals pin block %02d" (idx + 1) |] ))
        in
        let* () = seed_journals env journals in
        let* _ = enable_virtualized_rendering env in
        let* () =
          Pw.wait_for env "#journals [data-virtuoso-scroller]"
        in
        let* () = Pw.wait_for env "#journals [data-index]" in
        let* st = scroll_journals_down env 400. 60. in
        Fest.deep_equal (st > 0.) true Fest.expect;
        let* () = Util.wait_timeout env 2000. in
        let* rows_at_end = journals_rows_state env in
        let* _ = scroll_journals_down env (-300.) 20. in
        let* () = Util.wait_timeout env 3000. in
        let* rows_on_way_back = journals_rows_state env in
        let rows =
          match
            ( Js.Json.decodeArray rows_at_end
            , Js.Json.decodeArray rows_on_way_back )
          with
          | Some a, Some b -> Array.to_list a @ Array.to_list b
          | _ -> []
        in
        let content_rows =
          List.filter
            (fun r -> Api.get_bool r "content" = Some true)
            rows
        in
        let pinned =
          List.filter
            (fun r ->
              Api.get_bool r "content" = Some true
              && Api.get_string r "minHeight" <> None
              && Api.get_string r "minHeight" <> Some "")
            rows
        in
        Fest.deep_equal (List.length content_rows > 2) true Fest.expect;
        Fest.deep_equal pinned [] Fest.expect;
        Js.Promise.resolve ());

    t "journals-list-remounts-complete-long-journal-with-one-scroller"
      (fun env ->
        let first_block_title = "journals remount stable block 001" in
        let last_block_title = "journals remount stable block 012" in
        let filler = String.concat " " (List.init 24 (fun _ -> "wrapped-content")) in
        let long_blocks =
          Array.init 12 (fun i ->
              Printf.sprintf "journals remount stable block %03d %s" (i + 1)
                filler)
        in
        let older_journals =
          List.init 6 (fun idx ->
              ( Printf.sprintf "2026-03-%02dT12:00:00" (idx + 1)
              , [| Printf.sprintf "journals remount spacer block %02d"
                     (idx + 1)
                |] ))
        in
        let* () =
          seed_journals env
            (("2026-03-20T12:00:00", long_blocks) :: older_journals)
        in
        let* _ = enable_virtualized_rendering env in
        let journal_selector =
          Printf.sprintf "#journals .journal-item:has-text('%s')"
            first_block_title
        in
        let last_block_selector =
          Printf.sprintf "%s .ls-block:has-text('%s')" journal_selector
            last_block_title
        in
        let* () = Pw.wait_for env last_block_selector in
        let* initial_height =
          mounted_journal_height env first_block_title
        in
        let* () = set_journals_scroll_position env "end" in
        let* () = Pw.wait_for_hidden env journal_selector in
        let* () = set_journals_scroll_position env "start" in
        let* () = Pw.wait_for env last_block_selector in
        let* metrics = journals_layout_metrics env in
        let* remounted_height =
          mounted_journal_height env first_block_title
        in
        Fest.deep_equal
          (remounted_height >= initial_height -. 1.)
          true Fest.expect;
        Fest.deep_equal
          (Option.value ~default:0
             (Api.get_int metrics "journals-scroller-count"))
          1 Fest.expect;
        Assert.have_count env
          (Printf.sprintf "%s [data-virtuoso-scroller]" journal_selector)
          0);

    t "journals-linked-refs-remain-visible" (fun env ->
        let journals =
          List.init 4 (fun day ->
              ( Printf.sprintf "2026-03-%02dT12:00:00" (day + 2)
              , [| Printf.sprintf "journals linked refs spacer %02d"
                     (day + 2)
                |] ))
        in
        let* () = seed_journals env journals in
        let* () = seed_journals_with_linked_ref env in
        let* () =
          scroll_journals_to_text env
            "journals linked refs visible target"
        in
        let* metrics = journals_linked_refs_metrics env in
        Fest.deep_equal (Api.get_bool metrics "collapsed")
          (Some false) Fest.expect;
        Fest.deep_equal (Api.get_bool metrics "body-mounted")
          (Some true) Fest.expect;
        Fest.deep_equal
          (Option.value ~default:0.
             (Api.get_float metrics "body-height")
           > 0.)
          true Fest.expect;
        Js.Promise.resolve ());

    t "consecutive-enter-keeps-text-and-cursor-on-the-new-block"
      (fun env ->
        let* () = B.new_block env "rapid enter start" in
        let* () = K.enter env in
        let* () = Util.press_seq env "rapid enter alpha" in
        let* () = K.enter env in
        let* () = Util.press_seq env "rapid enter beta" in
        let* () = Util.wait_timeout env 800. in
        let* st = editor_input_state env in
        let value =
          Option.value ~default:"" (Api.get_string st "value")
        in
        Fest.deep_equal value "rapid enter beta" Fest.expect;
        Fest.deep_equal (Api.get_bool st "focused") (Some true)
          Fest.expect;
        let ss = Option.value ~default:(-1) (Api.get_int st "selectionStart") in
        let se = Option.value ~default:(-2) (Api.get_int st "selectionEnd") in
        Fest.deep_equal (String.length value, ss, se)
          (String.length value, String.length value, String.length value)
          Fest.expect;
        let* () = Util.exit_edit env in
        let* st' = editor_input_state env in
        let block_titles =
          match Api.get_list st' "blockTitles" with
          | Some a ->
              List.filter_map Js.Json.decodeString (Array.to_list a)
          | None -> []
        in
        Fest.deep_equal (List.mem "rapid enter alpha" block_titles) true
          Fest.expect;
        Fest.deep_equal (List.mem "rapid enter beta" block_titles) true
          Fest.expect;
        Js.Promise.resolve ());

    t "enter-delete-keeps-text-and-cursor-on-the-previous-block"
      (fun env ->
        let* () = B.new_block env "rapid delete start" in
        let* () = K.enter env in
        let* () = K.backspace env in
        let* () = Util.press_seq env " tail" in
        let* () = Util.wait_timeout env 800. in
        let* st = editor_input_state env in
        let value =
          Option.value ~default:"" (Api.get_string st "value")
        in
        Fest.deep_equal value "rapid delete start tail" Fest.expect;
        Fest.deep_equal (Api.get_bool st "focused") (Some true)
          Fest.expect;
        let* () = Util.exit_edit env in
        let* st' = editor_input_state env in
        let block_titles =
          match Api.get_list st' "blockTitles" with
          | Some a ->
              List.filter_map Js.Json.decodeString (Array.to_list a)
          | None -> []
        in
        Fest.deep_equal
          (List.mem "rapid delete start tail" block_titles)
          true Fest.expect;
        Js.Promise.resolve ());

    t "parent-and-child-rapid-edits-keep-the-latest-child-title"
      (fun env ->
        let* () = Page.new_page env "parent child pending edits" in
        let* page =
          Api.ls_api_call env "editor.getBlock"
            [| Api.str "parent child pending edits" |]
        in
        let page_uuid = Api.get_raw page "uuid" in
        let* (inserted : Js.Json.t) =
          Api.ls_api_call env "editor.insertBatchBlock"
            [| page_uuid
             ; Api.arr
                 [| Api.obj
                      [ "content", Api.str "a"
                      ; "children"
                        , Api.arr
                            [| Api.obj [ "content", Api.str "b" ] |]
                      ]
                 |]
             ; Api.obj [ "sibling", Api.bool false ]
            |]
        in
        let arr = Option.value ~default:[||] (Js.Json.decodeArray inserted) in
        let parent = if Array.length arr > 0 then arr.(0) else Js.Json.null in
        let child = if Array.length arr > 1 then arr.(1) else Js.Json.null in
        let parent_uuid =
          Option.value ~default:"" (Api.get_string parent "uuid")
        in
        let child_uuid =
          Option.value ~default:"" (Api.get_string child "uuid")
        in
        let* () = Pw.click env ("#block-content-" ^ parent_uuid) in
        let* () = Pw.fill env Util.editor_q "ax" in
        let* () = Pw.click env ("#block-content-" ^ child_uuid) in
        let* () = Pw.fill env Util.editor_q "bx" in
        let* () = Pw.fill env Util.editor_q "b" in
        let* () = K.arrow_up env in
        let* () = Util.wait_timeout env 800. in
        let* b =
          Api.ls_api_call env "editor.getBlock" [| Api.str child_uuid |]
        in
        Fest.deep_equal (Api.get_string b "content") (Some "b")
          Fest.expect;
        Js.Promise.resolve ());

    t "page-level-node-reference-renders-linked-references" (fun env ->
        let target_name =
          "linked-reference-target-" ^ Util.random_uuid ()
        in
        let source_name =
          "linked-reference-source-" ^ Util.random_uuid ()
        in
        let* () = Page.new_page env target_name in
        let* target =
          Api.ls_api_call env "editor.getBlock" [| Api.str target_name |]
        in
        let target_uuid = Api.get_raw target "uuid" in
        let* () = Page.new_page env source_name in
        let* () = B.save_block env (Printf.sprintf "[[%s]]" target_name) in
        let* () = Util.exit_edit env in
        let* source =
          Api.ls_api_call env "editor.getBlock" [| Api.str source_name |]
        in
        let source_uuid = Api.get_raw source "uuid" in
        let* _ =
          Api.ls_api_call env "editor.upsertBlockProperty"
            [| source_uuid
             ; Api.str "linked-reference-node"
             ; target_uuid
             ; Api.obj
                 [ "schema", Api.obj [ "type", Api.str "node" ] ]
            |]
        in
        let* (source' : Js.Json.t) =
          Api.ls_api_call env "editor.getBlock" [| source_uuid |]
        in
        let found_node_prop =
          match Js.Nullable.toOption (Api.nullable source') with
          | Some o -> (
              match Js.Json.decodeObject o with
              | Some dict ->
                  Js.Dict.entries dict
                  |> Array.to_list
                  |> List.exists (fun (k, v) ->
                         let suffix = "/linked-reference-node" in
                         let kl = String.length k
                         and sl = String.length suffix in
                         kl >= sl
                         && String.sub k (kl - sl) sl = suffix
                         && Js.Json.decodeNull v = None)
              | None -> false)
          | None -> false
        in
        Fest.deep_equal found_node_prop true Fest.expect;
        let* () = Page.goto_page env target_name in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".references" ~has_text:source_name)
        in
        Assert.have_count_l
          (Loc.filter env ".references" ~has_text:"Unexpected error")
          0);

    t "consecutive-enter-and-delete-ops-complete-without-worker-errors"
      (fun env ->
        let* () = Util.wait_timeout env 500. in
        let old_logs = console_logs env in
        let* () =
          iter_seq
            (fun idx ->
              let* () =
                B.new_block env (Printf.sprintf "render budget %d" idx)
              in
              let* container = Util.get_edit_block_container env in
              let* block_uuid = Pw.attr_l container "blockid" in
              let* () = B.delete_blocks env in
              Assert.have_count env
                ("#ls-block-"
                 ^ Option.value ~default:"" block_uuid)
                0)
            [ 0; 1; 2 ]
        in
        let* () = Util.wait_timeout env 800. in
        (* worker perf logs travel over the console-message pipe and can lag
           under suite load; poll the counts (still asserts exactly 3). *)
        let collect () =
          let new_logs =
            List.filter
              (fun l -> not (List.mem l old_logs))
              (console_logs env)
          in
          ( new_logs
          , worker_op_logs new_logs "[:insert-blocks]"
            @ worker_op_logs new_logs "[:save-block :insert-blocks]"
          , worker_op_logs new_logs "[:delete-blocks]" )
        in
        let rec poll n =
          let new_logs, enter_logs, delete_logs = collect () in
          if
            List.length enter_logs >= 3 && List.length delete_logs >= 3
            || n <= 0
          then Js.Promise.resolve (new_logs, enter_logs, delete_logs)
          else
            let* () = Util.wait_timeout env 300. in
            poll (n - 1)
        in
        let* new_logs, enter_logs, delete_logs = poll 30 in
        if List.length enter_logs <> 3 || List.length delete_logs <> 3 then
          List.iter
            (fun l -> Js.log ("new-log-line: " ^ l))
            new_logs;
        Fest.deep_equal (List.length enter_logs) 3 Fest.expect;
        Fest.deep_equal (List.length delete_logs) 3 Fest.expect;
        let bad =
          List.exists
            (fun l ->
              List.exists
                (fun sub ->
                  let n = String.length sub
                  and h = String.length l in
                  let rec go i =
                    if i + n > h then false
                    else if String.sub l i n = sub then true
                    else go (i + 1)
                  in
                  n = 0 || go 0)
                [ "DB worker API failed"
                ; "Missing renderer resource entity"
                ; "Unsupported view resource row"
                ; "Invalid renderer resource UUID" ])
            new_logs
        in
        Fest.deep_equal bad false Fest.expect;
        Js.Promise.resolve ());

    t "backspace-at-start-removes-pending-block-dom-test" (fun env ->
        let* () = B.new_blocks env [ "source" ] in
        let* () = B.new_block env "" in
        let* () = B.save_block env "pending block" in
        let* container = Util.get_edit_block_container env in
        let* block_uuid = Pw.attr_l container "blockid" in
        let* () = Util.move_cursor_to_start env in
        let* () = K.backspace env in
        let* blk =
          Api.ls_api_call env "editor.getBlock"
            [| Api.str (Option.value ~default:"" block_uuid) |]
        in
        Fest.deep_equal
          (Js.Nullable.toOption (Api.nullable blk) = None)
          true Fest.expect;
        Assert.have_count env
          ("#ls-block-" ^ Option.value ~default:"" block_uuid)
          0);

    t "today-queries-render-without-resource-errors" (fun env ->
        let* page =
          Api.ls_api_call env "editor.createJournalPage"
            [| Api.str (Js.Date.make () |> Js.Date.toISOString) |]
        in
        let* _ =
          Api.ls_api_call env "app.pushState"
            [| Api.str "page"
             ; Api.obj [ "name", Api.get_raw page "uuid" ]
             ; Api.null
            |]
        in
        let* () = Util.wait_timeout env 1500. in
        let* _ = Assert.have_count env "#today-queries" 1 in
        Assert.have_count env "#today-queries .block-content-fallback-ui" 0);

    t "drag-and-drop-asset-does-not-create-blank-asset" (fun env ->
        let asset_title = "drag-drop-regression" in
        let file_name = asset_title ^ ".png" in
        let* () = B.new_block env "" in
        let* () = drag_and_drop_file env file_name "image/png" in
        let* () =
          Pw.wait_for env ".ls-page-blocks .ls-block .asset-container img"
        in
        let* () = Util.exit_edit env in
        let* _ =
          Assert.have_count env
            ".ls-page-blocks .ls-block .asset-container img" 1
        in
        Assert.is_visible env
          (Printf.sprintf
             ".ls-page-blocks .ls-block .block-title-wrap:text('%s')"
             asset_title));

    t "toggle-between-page-and-block" (fun env ->
        let* () = B.new_block env "b1" in
        let* () = Util.set_tag ~hidden:true env "Page" in
        let* _ =
          Assert.is_visible env ".ls-page-blocks .ls-block .ls-icon-file"
        in
        let* () = B.toggle_property env "Tags" "Page" in
        Assert.is_hidden env ".ls-page-blocks .ls-block .ls-icon-file");

    t "toggle-between-page-and-block-for-selected-blocks" (fun env ->
        let* () = B.new_blocks env [ "b1"; "b2"; "b3" ] in
        let* () = B.select_blocks env 3 in
        let* () = B.toggle_property env "Tags" "Page" in
        let* _ =
          Assert.is_visible env ".ls-page-blocks .ls-block .ls-icon-file"
        in
        let* () = Pw.wait_for env ".menu-link:has-text('Page')" in
        let* () = K.esc env in
        let* () = B.toggle_property env "Tags" "Page" in
        Pw.wait_for_hidden env ".ls-page-blocks .ls-block .ls-icon-file");

    t "disallow-adding-page-tag-to-normal-pages" (fun env ->
        let* () = K.arrow_up env in
        let* () = Util.move_cursor_to_end env in
        let editor = Pw.q env "*:focus" in
        let* original_title = Pw.input_value_l editor in
        let* () = Util.press_seq ~delay:20. env " #" in
        let* () = Util.press_seq env "Page" in
        let* _ =
          Assert.is_hidden env "#ac-0.menu-link:has-text('Page')"
        in
        let* () = Pw.fill_l editor original_title in
        let* v = Pw.input_value_l editor in
        Fest.deep_equal v original_title Fest.expect;
        Util.exit_edit env);

    t "move-blocks-mod+shift+m" (fun env ->
        let* () = Page.new_page env "Target page" in
        let* () = Page.new_page env "Source page" in
        let* () = B.new_blocks env [ "b1"; "b2"; "b3" ] in
        let* () = B.select_blocks env 3 in
        let* () = K.press env "ControlOrMeta+Shift+m" in
        let* () = choose_move_target env "Target page" in
        Assert.have_count env
          ".ls-page-blocks .page-blocks-inner .ls-block:not(.block-add-button)"
          0);

    t "move-blocks-cmdk" (fun env ->
        let target_page = "Target page " ^ Util.random_uuid () in
        let source_page = "Source page " ^ Util.random_uuid () in
        let* () = Page.new_page env target_page in
        let* () = Page.new_page env source_page in
        let* () = B.new_blocks env [ "b1"; "b2"; "b3" ] in
        let* () = B.select_blocks env 3 in
        let* () = Util.search_and_click env "Move blocks to" in
        let* () = choose_move_target env target_page in
        Assert.have_count env
          ".ls-page-blocks .page-blocks-inner .ls-block:not(.block-add-button)"
          0);

    t "move-editing-block-cmdk" (fun env ->
        let target_page = "Editing block target " ^ Util.random_uuid () in
        let source_page = "Editing block source " ^ Util.random_uuid () in
        let* () = Page.new_page env target_page in
        let* () = Page.new_page env source_page in
        let* () = B.new_blocks env [ "editing block" ] in
        let* () = Util.search_and_click env "Move blocks to" in
        let* () = choose_move_target env target_page in
        let* _ =
          Assert.have_count env
            ".ls-page-blocks .page-blocks-inner .ls-block:not(.block-add-button)"
            0
        in
        let* () = Page.goto_page env target_page in
        let* () =
          Pw.wait_for env ".ls-page-blocks .ls-block:has-text('editing block')"
        in
        let* contents = Util.get_page_blocks_contents env in
        Fest.deep_equal (Array.to_list contents |> List.mem "editing block")
          true Fest.expect;
        Js.Promise.resolve ());

    t "shift-open-page-in-sidebar" (fun env ->
        let* () = Page.new_page env "Ordinary sidebar page" in
        let* () = B.new_blocks env [ "ordinary page block" ] in
        let* () = Page.new_page env "Sidebar search source" in
        let* () = Util.search env "Ordinary sidebar page" in
        let result =
          Playwright.locator_first
            (Pw.get_by_test_id env "Ordinary sidebar page")
        in
        let* _ = Assert.is_visible_l result in
        let* () = Pw.hover_l result in
        let* () = Pw.fill_l (Pw.q env ".cp__cmdk-search-input") "" |> fun _ -> Js.Promise.resolve () in
        let* () = Pw.click_l (Pw.q env ".cp__cmdk-search-input") in
        let* () = K.press env "Shift+Enter" in
        Assert.is_visible env
          ".cp__right-sidebar .sidebar-item :text('Ordinary sidebar page')");

    t "shift-click-page-title-opens-in-sidebar" (fun env ->
        let* () = Page.new_page env "Shift click sidebar page" in
        let* () = Util.exit_edit env in
        let* () =
          Pw.click_l ~modifiers:[| "Shift" |]
            (Pw.q env "div[data-testid='page title'] .block-title-wrap")
        in
        Assert.is_visible env
          ".cp__right-sidebar .sidebar-item :text('Shift click sidebar page')");

    t "cmdk-block-results-render-breadcrumbs-test" (fun env ->
        let* page_name = Page.get_page_name env in
        let title = "cmdk breadcrumb target " ^ Util.random_uuid () in
        let* () = B.new_block env title in
        let* () = Util.exit_edit env in
        let* () = Util.search env title in
        let breadcrumb =
          Loc.filter env ".cp__cmdk .breadcrumb" ~has_text:page_name
        in
        Util.repeat_until_visible env 5 breadcrumb (fun () ->
            Util.search env title));

    t "comments-update-and-title-edit" (fun env ->
        let* () = Page.new_page env "Comments reactivity" in
        let* () = B.new_blocks env [ "comment target" ] in
        let* () = Util.search_and_click env "Add comment" in
        let* _ = Assert.is_visible env ".ls-comments-area" in
        let* _ =
          Assert.is_hidden env ".ls-block.is-comments-area .block-tags"
        in
        let* () =
          Pw.fill env ".ls-comment-add textarea" "first comment"
        in
        let* () = Pw.click env ".ls-comment-submit" in
        let* _ =
          Assert.is_visible env ".ls-comment-row :text('first comment')"
        in
        let* () = Pw.click env ".ls-comments-label" in
        let* _ =
          Assert.is_visible env ".ls-comments-title-editor textarea"
        in
        Assert.is_hidden env ":text('Something went wrong')");

    t "first-comment-actions-stay-inside-scroll-container" (fun env ->
        let* () = Page.new_page env "Comment actions clipping" in
        let* () = B.new_blocks env [ "comment target" ] in
        let* () = Util.search_and_click env "Add comment" in
        let* () =
          Pw.fill env ".ls-comment-add textarea" "first comment"
        in
        let* () = Pw.click env ".ls-comment-submit" in
        let* _ = Assert.is_visible env ".ls-comment-row" in
        let* ok =
          Pw.eval_js env
            "(() => { \
             const list = document.querySelector('.ls-comments-list'); \
             const actions = document.querySelector('.ls-comment-row .ls-comment-actions'); \
             const listRect = list.getBoundingClientRect(); \
             const actionsRect = actions.getBoundingClientRect(); \
             return actionsRect.top >= listRect.top && actionsRect.bottom <= listRect.bottom; \
             })()"
        in
        Fest.deep_equal ok true Fest.expect;
        Js.Promise.resolve ());

    t "move-pages-to-library" (fun env ->
        let* () = Page.goto_page env "Library" in
        let* () = Page.new_page env "test page" in
        let* () = B.new_blocks env [ "block1"; "block2"; "block3" ] in
        let* () = B.select_blocks env 3 in
        let* () = B.toggle_property env "Tags" "Page" in
        let* _ =
          Assert.is_visible env ".ls-page-blocks .ls-block .ls-icon-file"
        in
        let* () = K.press env "ControlOrMeta+Shift+m" in
        let* () =
          Pw.fill env "input[placeholder=\"Move blocks to\"]" "Library"
        in
        let* () =
          Pw.wait_for_l (Pw.get_by_test_id env "Library")
        in
        let* () = Pw.click_l (Pw.get_by_test_id env "Library") in
        let* _ =
          Assert.have_count_l
            (Loc.filter env ".ls-page-blocks .ls-block" ~has_text:"block1")
            0
        in
        let* () = Page.goto_page env "Library" in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".ls-page-blocks .block-title-wrap"
               ~has_text:"block1")
        in
        let* contents = Util.get_page_blocks_contents env in
        let missing =
          List.filter
            (fun b ->
              not (List.mem b (Array.to_list contents)))
            [ "block1"; "block2"; "block3" ]
        in
        Fest.deep_equal missing [] Fest.expect;
        Js.Promise.resolve ());

    t "create-nested-pages-in-library" (fun env ->
        let* () = Page.goto_page env "Library" in
        let* () = B.new_blocks env [ "page parent"; "page child" ] in
        let* () = B.indent env in
        let* () = B.new_block env "another nested child" in
        B.indent env);

    t "page-icon-in-library" (fun env ->
        let* () = B.new_block env "library icon source" in
        let* () = Util.set_tag ~hidden:true env "Page" in
        let* _ =
          Assert.is_visible env ".ls-page-blocks .ls-block .ls-icon-file"
        in
        let* () = Page.goto_page env "Library" in
        let* _ =
          Assert.have_count_l
            (Loc.filter ~has:(Pw.q env ".ls-icon-file") env
               ".ls-page-blocks .ls-block:has-text('library icon source')")
            0
        in
        let* () = Page.goto_page env "library icon source" in
        let* () = Pw.click env "button:text('Add icon')" in
        let* () =
          Pw.fill env ".cp__emoji-icon-picker input" "books"
        in
        let* () =
          Pw.click env
            ".cp__emoji-icon-picker button:has(em-emoji[id='books'])"
        in
        let* () = Page.goto_page env "Library" in
        Assert.is_visible_l
          (Loc.filter ~has:(Pw.q env "em-emoji[id='books']")
             env ".ls-page-blocks .ls-block:has-text('library icon source')"));

    t "editor-exit-and-unicode-persistence-test" (fun env ->
        (* Non-ASCII literals must use JS unicode escapes: melange emits
           UTF-8 bytes as \xNN escapes which JS decodes as latin1. *)
        let content : string =
          [%raw "\"\\u4e2d\\u6587\\ud83d\\ude42 e\\u0301 editor persistence\""]
        in
        let* page_name = Page.get_page_name env in
        let* () = B.new_block env content in
        let* container = Util.get_edit_block_container env in
        let* block_uuid = Pw.attr_l container "blockid" in
        let* () = K.esc env in
        let* _ = Assert.have_count env Util.editor_q 0 in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".ls-page-blocks" ~has_text:content)
        in
        let* () = Pw.click env "#main-content-container" in
        let* _ =
          Assert.have_count env ".ui__popover-content, .autocomplete" 0
        in
        let* () = Page.new_page env "editor exit destination" in
        let* () = Page.goto_page env page_name in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".ls-page-blocks" ~has_text:content)
        in
        let* _ = Util.refresh_until_graph_loaded env in
        let* blk =
          Api.ls_api_call env "editor.getBlock"
            [| Api.str (Option.value ~default:"" block_uuid) |]
        in
        Fest.deep_equal (Api.get_string blk "content") (Some content)
          Fest.expect;
        Js.Promise.resolve ());

    t "empty-enter-and-soft-line-break-test" (fun env ->
        let* () = B.new_block env "" in
        let* before = Util.page_blocks_count env in
        let* () = K.enter env in
        let* after = Util.page_blocks_count env in
        Fest.deep_equal after (before + 1) Fest.expect;
        let* _ = Assert.have_count env Util.editor_q 1 in
        let* () = B.save_block env "first line second line" in
        let* () = K.press env "Home" in
        let* () =
          iter_seq (fun _ -> K.arrow_right env) (List.init 10 (fun i -> i))
        in
        let* () = K.press env "Shift+Enter" in
        let* c = Util.edit_content env in
        Fest.deep_equal c "first line\n second line" Fest.expect;
        let* () = Util.exit_edit env in
        let* contents = Util.get_page_blocks_contents env in
        let n_first =
          List.length
            (List.filter
               (fun s ->
                  let sub = "first line" in
                  let n = String.length sub and h = String.length s in
                  let rec go i =
                    if i + n > h then false
                    else if String.sub s i n = sub then true
                    else go (i + 1)
                  in
                  n = 0 || go 0)
               (Array.to_list contents))
        in
        Fest.deep_equal n_first 1 Fest.expect;
        let* () = B.new_blocks env [ "empty parent"; "" ] in
        let* () = B.indent env in
        let* before_count = Util.page_blocks_count env in
        let* ed = Util.get_editor env in
        let* bx, _ =
          match ed with
          | Some l -> Pw.bounding_xy_l l
          | None -> Js.Promise.reject (Failure "no editor")
        in
        let* () = K.enter env in
        let* ed' = Util.get_editor env in
        let* ax, _ =
          match ed' with
          | Some l -> Pw.bounding_xy_l l
          | None -> Js.Promise.reject (Failure "no editor")
        in
        let* now_count = Util.page_blocks_count env in
        Fest.deep_equal now_count before_count Fest.expect;
        Fest.deep_equal (ax < bx) true Fest.expect;
        Js.Promise.resolve ());

    t "cursor-boundaries-word-motion-and-kill-test" (fun env ->
        let word_modifier = if Util.is_mac () then "Alt" else "Control" in
        let* () =
          B.new_blocks env [ "first cursor line"; "second cursor line" ]
        in
        let* () = K.shift_enter env in
        let* () = Util.press_seq env "continued" in
        let multiline = "second cursor line\ncontinued" in
        let second_line_start = String.length "second cursor line" + 1 in
        let* c = Util.edit_content env in
        Fest.deep_equal c multiline Fest.expect;
        let* () = K.press env "Home" in
        let* sr = selection_range env in
        Fest.deep_equal sr
          (Printf.sprintf "%d:%d" second_line_start second_line_start)
          Fest.expect;
        let* () = K.arrow_up env in
        let* c2 = Util.edit_content env in
        Fest.deep_equal c2 multiline Fest.expect;
        let* () = K.press env "Home" in
        let* sr2 = selection_range env in
        Fest.deep_equal sr2 "0:0" Fest.expect;
        let* () = K.arrow_up env in
        let* () = B.wait_editor_text env "first cursor line" in
        let* c3 = Util.edit_content env in
        Fest.deep_equal c3 "first cursor line" Fest.expect;
        let* () = Util.move_cursor_to_end env in
        let* before = Util.edit_content env in
        let* () = K.press env (word_modifier ^ "+ArrowLeft") in
        let* sr3 = selection_range env in
        let bl = String.length before in
        Fest.deep_equal
          (sr3 <> Printf.sprintf "%d:%d" bl bl)
          true Fest.expect;
        let* () = K.press env (word_modifier ^ "+Backspace") in
        let* () = assert_editor_value env "first line" in
        let* () = B.undo env in
        let* () = assert_editor_value env "first cursor line" in
        let* () = K.press env "ControlOrMeta+a" in
        let* () = K.backspace env in
        let* () = assert_editor_value env "" in
        let* () = B.undo env in
        assert_editor_value env "first cursor line");

    t "text-format-shortcuts-and-source-roundtrip-test" (fun env ->
        let* () =
          iter_seq
            (fun (shortcut, source, expected) ->
              let* () = B.new_block env source in
              let* () = K.press env "ControlOrMeta+a" in
              let* () = K.press env shortcut in
              let* formatted = Util.edit_content env in
              Fest.deep_equal formatted expected Fest.expect;
              let* () = Util.exit_edit env in
              let* _ =
                Assert.is_visible_l
                  (Loc.filter env ".block-title-wrap" ~has_text:source)
              in
              let* () =
                Pw.click_l
                  (Loc.filter env ".block-title-wrap" ~has_text:source)
              in
              let* c = Util.edit_content env in
              Fest.deep_equal c formatted Fest.expect;
              Js.Promise.resolve ())
            [ "ControlOrMeta+b", "bold", "**bold**"
            ; "ControlOrMeta+i", "italic", "*italic*"
            ; "ControlOrMeta+Shift+h", "highlight", "==highlight=="
            ]
        in
        let* () =
          B.new_block env
            "escape \\* literal 🙂 longwordwithoutbreak0123456789"
        in
        let* () = Util.exit_edit env in
        Assert.is_visible_l
          (Loc.filter env ".block-title-wrap"
             ~has_text:"longwordwithoutbreak"));

    t "escape-save-never-paints-stale-block-content-test" (fun env ->
        let title = "escape-save-frame-" ^ Util.random_uuid () in
        let* () = B.new_block env "" in
        let* () = Pw.fill env Util.editor_q title in
        let* () = start_edit_exit_frame_capture env in
        let* () = K.esc env in
        let* _ = Assert.non_editor_mode env in
        let* frames = edit_exit_read_frames env in
        Fest.deep_equal (frames <> []) true Fest.expect;
        Fest.deep_equal
          (List.for_all
             (fun f -> Api.get_string f "text" = Some title)
             frames)
          true Fest.expect;
        Js.Promise.resolve ());

    t "new-page-reference-renders-on-the-first-frame-after-save-test"
      (fun env ->
        let page_title = "reference-first-frame-" ^ Util.random_uuid () in
        let* () = B.new_block env "" in
        let* () =
          Pw.fill env Util.editor_q ("[[" ^ page_title ^ "]]")
        in
        let* () = start_edit_exit_frame_capture env in
        let* () = K.esc env in
        let* _ = Assert.non_editor_mode env in
        let* frames = edit_exit_read_frames env in
        Fest.deep_equal (frames <> []) true Fest.expect;
        Fest.deep_equal
          (List.for_all
             (fun f -> Api.get_string f "pageRefText" = Some page_title)
             frames)
          true Fest.expect;
        Js.Promise.resolve ());

    t "saved-page-reference-reopens-with-page-title-test" (fun env ->
        let page_title = "reference-reedit-" ^ Util.random_uuid () in
        let source = "[[" ^ page_title ^ "]]" in
        let* () = B.new_block env "" in
        let* () = Pw.fill env Util.editor_q source in
        let* () = K.esc env in
        let* _ = Assert.non_editor_mode env in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".page-reference .page-ref" ~has_text:page_title)
        in
        let* () = K.enter env in
        let* _ = Assert.editor_mode env in
        let* c = Util.edit_content env in
        Fest.deep_equal c source Fest.expect;
        Js.Promise.resolve ());

    t "page-and-tag-autocomplete-test" (fun env ->
        let* () = Page.new_page env "autocomplete existing page" in
        let* () = Page.new_page env "autocomplete host" in
        let* () = B.new_block env "" in
        let* () = Util.press_seq env "[[autocomplete existing page" in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".ui__popover-content a.menu-link.chosen"
               ~has_text:"autocomplete existing page")
        in
        let* () = K.enter env in
        let* c = Util.edit_content env in
        let sub = "[[autocomplete existing page]]" in
        let n = String.length sub and h = String.length c in
        let rec go i =
          if i + n > h then false
          else if String.sub c i n = sub then true
          else go (i + 1)
        in
        Fest.deep_equal (go 0) true Fest.expect;
        let* () = Util.exit_edit env in
        let* () =
          Pw.click_l
            (Loc.filter env ".page-reference .page-ref"
               ~has_text:"autocomplete existing page")
        in
        let* name = Page.get_page_name env in
        Fest.deep_equal name "autocomplete existing page" Fest.expect;
        let* () = Page.goto_page env "autocomplete host" in
        let* () = B.new_block env "" in
        let* () = Util.press_seq env "#autocomplete-new-tag" in
        let* _ = Assert.is_visible env ".ui__popover-content" in
        let* () = K.enter env in
        Assert.is_visible_l
          (Loc.filter env ".block-tag" ~has_text:"autocomplete-new-tag"));

    t "slash-menu-filter-scroll-and-cleanup-test" (fun env ->
        let* () = B.new_block env "" in
        let* () = Util.press_seq env "/" in
        let* _ = Assert.is_visible env ".ui__popover-content" in
        let* () = Util.press_seq env "property" in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".ui__popover-content" ~has_text:"property")
        in
        let* () = K.arrow_down env in
        let* () = K.arrow_up env in
        let* _ =
          Assert.have_count env
            ".ui__popover-content a.menu-link.chosen, .ui__popover-content [data-kb-highlighted]"
            1
        in
        let* () = K.esc env in
        let* _ = Assert.is_hidden env ".ui__popover-content" in
        let* c = Util.edit_content env in
        Fest.deep_equal c "/property" Fest.expect;
        let* () = Util.press_seq env "/" in
        Assert.is_visible env ".ui__popover-content");

    t "task-date-and-priority-slash-lifecycle-test" (fun env ->
        let* () = B.new_block env "sample task" in
        let* () = Util.input_command env "TODO" in
        let* () = Util.exit_edit env in
        let block =
          Loc.filter env ".ls-page-blocks .ls-block" ~has_text:"sample task"
        in
        let* uuid = Pw.attr_l block "blockid" in
        let uuid = Option.value ~default:"" uuid in
        let block_selector = "#ls-block-" ^ uuid in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env (block_selector ^ " .block-tag")
               ~has_text:"Task")
        in
        let* () =
          Pw.click_l
            (Loc.filter env (block_selector ^ " .block-title-wrap")
               ~has_text:"sample task")
        in
        let* () = Util.move_cursor_to_end env in
        let* () = Util.input_command env "Priority High" in
        let* () = Util.exit_edit env in
        let* _ =
          Assert.have_count env
            (block_selector
             ^ " .positioned-properties.block-left .property-value-inner")
            2
        in
        let* blk =
          Api.ls_api_call env "editor.getBlock" [| Api.str uuid |]
        in
        let prio = Api.get blk ":logseq.property/priority" in
        Fest.deep_equal (Api.get_string prio "title") (Some "High")
          Fest.expect;
        let* () =
          Pw.click_l
            (Loc.filter env (block_selector ^ " .block-title-wrap")
               ~has_text:"sample task")
        in
        let* () = Util.move_cursor_to_end env in
        let* () = Util.input_command env "Scheduled" in
        let* () =
          Pw.click env "[role='gridcell'][aria-selected='true'] button"
        in
        let* () = Util.exit_edit env in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env (block_selector ^ " .bottom-property-pill")
               ~has_text:"Scheduled")
        in
        let* () =
          Pw.click_l
            (Loc.filter env (block_selector ^ " .block-title-wrap")
               ~has_text:"sample task")
        in
        let* () = Util.move_cursor_to_end env in
        let* () = Util.input_command env "No priority" in
        let* () = Util.exit_edit env in
        let* blk2 =
          Api.ls_api_call env "editor.getBlock" [| Api.str uuid |]
        in
        let prio2 = Api.get blk2 ":logseq.property/priority" in
        Fest.deep_equal (Api.get_string prio2 "ident")
          (Some ":logseq.property/empty-placeholder")
          Fest.expect;
        Js.Promise.resolve ());

    t "virtualized-late-editor-and-code-editor-test" (fun env ->
        let* page_name = Page.get_page_name env in
        let* page =
          Api.ls_api_call env "editor.getPage" [| Api.str page_name |]
        in
        let page_uuid = Api.get_raw page "uuid" in
        let* _ =
          Api.ls_api_call env "editor.insertBatchBlock"
            [| page_uuid
             ; Api.arr
                 (Array.init 30 (fun i ->
                      Api.obj
                        [ "content"
                        , Api.str
                            (Printf.sprintf "late editor row %d" i) ]))
             ; Api.obj [ "sibling", Api.bool false ]
            |]
        in
        let* () =
          Pw.click_l
            (Loc.filter env ".block-title-wrap"
               ~has_text:"late editor row 29")
        in
        let* () = Util.move_cursor_to_end env in
        let* () = Util.press_seq env " edited" in
        let* c = Util.edit_content env in
        Fest.deep_equal c "late editor row 29 edited" Fest.expect;
        let* () = B.new_block env "" in
        let* () = Util.input_command env "Code block" in
        let* _ = Assert.is_visible env ".CodeMirror, .cm-editor" in
        let* code_uuid =
          Pw.attr env ".ls-block:has(.CodeMirror)" "blockid"
        in
        let code_uuid = Option.value ~default:"" code_uuid in
        let* () =
          Pw.click_l
            (Playwright.locator_first
               (Pw.q env "pre.CodeMirror-line"))
        in
        let* () = Util.input env "const value = 1;\nvalue + 1;" in
        let* () = K.esc env in
        let* () = Util.exit_edit env in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".extensions__code"
               ~has_text:"const value = 1")
        in
        let* _ = Util.refresh_until_graph_loaded env in
        let* blk =
          Api.ls_api_call env "editor.getBlock" [| Api.str code_uuid |]
        in
        let content =
          Option.value ~default:"" (Api.get_string blk "content")
        in
        let sub = "const value = 1" in
        let n = String.length sub and h = String.length content in
        let rec go i =
          if i + n > h then false
          else if String.sub content i n = sub then true
          else go (i + 1)
        in
        Fest.deep_equal (go 0) true Fest.expect;
        Js.Promise.resolve ());

    t "multi-selection-indent-roundtrip-test" (fun env ->
        let* page_name = Page.get_page_name env in
        let* () =
          B.new_blocks env
            [ "multi a"; "multi a child"; "multi b"; "multi b child" ]
        in
        let* () = K.tab env in
        let* () = K.arrow_up env in
        let* () = K.arrow_up env in
        let* () = K.tab env in
        let* tree =
          Api.ls_api_call env "editor.getPageBlocksTree"
            [| Api.str page_name |]
        in
        let len (x : Js.Json.t) =
          match Js.Json.decodeArray x with
          | Some a -> Array.length a
          | None -> -1
        in
        Fest.deep_equal (len tree) 2 Fest.expect;
        let* () = K.arrow_down env in
        let* () = K.arrow_down env in
        let* () = B.select_blocks env 2 in
        let* () = K.tab env in
        let* indented =
          Api.ls_api_call env "editor.getPageBlocksTree"
            [| Api.str page_name |]
        in
        Fest.deep_equal (len indented) 1 Fest.expect;
        let* () = B.undo env in
        let* t2 =
          Api.ls_api_call env "editor.getPageBlocksTree"
            [| Api.str page_name |]
        in
        Fest.deep_equal (len t2) 2 Fest.expect;
        let* () = B.redo env in
        let* t3 =
          Api.ls_api_call env "editor.getPageBlocksTree"
            [| Api.str page_name |]
        in
        Fest.deep_equal (len t3) 1 Fest.expect;
        Js.Promise.resolve ());

    t "collapse-single-multiple-and-sidebar-test" (fun env ->
        let* page_name = Page.get_page_name env in
        let* parent =
          Api.ls_api_call env "editor.appendBlockInPage"
            [| Api.str page_name; Api.str "collapse parent" |]
        in
        let uuid = Option.value ~default:"" (Api.get_string parent "uuid") in
        let* _ =
          Api.ls_api_call env "editor.insertBlock"
            [| Api.str uuid
             ; Api.str "collapse child"
             ; Api.obj [ "sibling", Api.bool false ]
            |]
        in
        let* () =
          Pw.click env (Printf.sprintf ".ls-page-blocks #control-%s" uuid)
        in
        let* _ =
          Assert.is_hidden_l
            (Loc.filter env (Printf.sprintf "#ls-block-%s" uuid)
               ~has_text:"collapse child")
        in
        let* _ =
          Api.ls_api_call env "editor.openInRightSidebar"
            [| Api.str uuid |]
        in
        let* _ =
          Assert.is_visible env
            (Printf.sprintf ".cp__right-sidebar #ls-block-%s" uuid)
        in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".cp__right-sidebar"
               ~has_text:"collapse child")
        in
        let* () =
          Pw.click env
            (Printf.sprintf ".cp__right-sidebar #control-%s" uuid)
        in
        let* _ =
          Assert.is_hidden_l
            (Loc.filter env ".cp__right-sidebar"
               ~has_text:"collapse child")
        in
        let* () =
          Pw.click env
            (Printf.sprintf ".cp__right-sidebar #control-%s" uuid)
        in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".cp__right-sidebar"
               ~has_text:"collapse child")
        in
        let* () = Pw.refresh env in
        let* _ = Assert.is_hidden env ".ui__loading, .loading-graph" in
        Assert.is_visible env
          (Printf.sprintf ".ls-page-blocks #ls-block-%s" uuid));

    t "collapsed-subtree-stays-collapsed-after-bullet-zoom-back-test"
      (fun env ->
        let* page_name = Page.get_page_name env in
        let* parent =
          Api.ls_api_call env "editor.appendBlockInPage"
            [| Api.str page_name; Api.str "zoom collapse parent" |]
        in
        let uuid = Option.value ~default:"" (Api.get_string parent "uuid") in
        let child_in_parent =
          Loc.filter env (Printf.sprintf ".ls-page-blocks #ls-block-%s" uuid)
            ~has_text:"zoom collapse child"
        in
        Fest.deep_equal (uuid <> "") true Fest.expect;
        let* _ =
          Api.ls_api_call env "editor.insertBlock"
            [| Api.str uuid
             ; Api.str "zoom collapse child"
             ; Api.obj [ "sibling", Api.bool false ]
            |]
        in
        let* () =
          Pw.click env (Printf.sprintf ".ls-page-blocks #control-%s" uuid)
        in
        let* _ = Assert.is_hidden_l child_in_parent in
        let* () =
          Pw.click env (Printf.sprintf ".ls-page-blocks #dot-%s" uuid)
        in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env "#main-content-container"
               ~has_text:"zoom collapse child")
        in
        let* hash = Pw.eval_js env "window.location.hash" in
        let sub = uuid in
        let n = String.length sub and h = String.length hash in
        let rec go i =
          if i + n > h then false
          else if String.sub hash i n = sub then true
          else go (i + 1)
        in
        Fest.deep_equal (n = 0 || go 0) true Fest.expect;
        let* _ = Playwright.go_back (Env.page env) in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".ls-page-blocks"
               ~has_text:"zoom collapse parent")
        in
        let* _ = Assert.is_hidden_l child_in_parent in
        let* v = Pw.visible_l child_in_parent in
        Fest.deep_equal v false Fest.expect;
        Js.Promise.resolve ());

    t "selection-direction-and-hierarchical-select-all-test" (fun env ->
        let* () =
          B.new_blocks env
            [ "select a"; "select b"; "select c"; "select d" ]
        in
        let* () = B.select_blocks env 3 in
        let* _ =
          Assert.have_count env ".ls-page-blocks .ls-block.selected" 3
        in
        let* texts =
          Pw.all_text env
            ".ls-page-blocks .ls-block.selected .block-title-wrap"
        in
        Fest.deep_equal
          (Array.to_list texts |> List.map String.trim)
          [ "select b"; "select c"; "select d" ]
          Fest.expect;
        let* () = K.press env "ControlOrMeta+a" in
        let* _ =
          Assert.have_count env ".ls-page-blocks .ls-block.selected" 4
        in
        Assert.have_count env ".cp__right-sidebar .ls-block.selected" 0);

    t "structured-and-plain-text-copy-test" (fun env ->
        let target_page = "copy target" in
        let* () =
          B.new_blocks env [ "copy parent"; "copy child"; "copy sibling" ]
        in
        let* () = K.arrow_up env in
        let* () = B.indent env in
        let* () = K.arrow_down env in
        let* () = B.select_blocks env 3 in
        let* () = B.copy env in
        let* () = Page.new_page env target_page in
        let* () = B.paste env in
        let* () = Util.exit_edit env in
        let* (tree : Js.Json.t) =
          Api.ls_api_call env "editor.getPageBlocksTree"
            [| Api.str target_page |]
        in
        let tree_arr =
          match Js.Json.decodeArray tree with
          | Some a -> Array.to_list a
          | None -> []
        in
        let contents_of o =
          Option.value ~default:"" (Api.get_string o "content")
        in
        Fest.deep_equal
          (List.map contents_of tree_arr)
          [ "copy parent"; "copy sibling" ]
          Fest.expect;
        let first_children =
          match tree_arr with
          | f :: _ -> (
              match Api.get_list f "children" with
              | Some c -> List.map contents_of (Array.to_list c)
              | None -> [])
          | [] -> []
        in
        Fest.deep_equal first_children [ "copy child" ] Fest.expect;
        let* () =
          Pw.click_l
            (Loc.filter env ".block-title-wrap" ~has_text:"copy sibling")
        in
        let* () = B.select_blocks env 3 in
        let* () = K.press env "ControlOrMeta+Shift+c" in
        let* _len, missing =
          wait_for_copied_blocks env
            [ "copy parent"; "copy child" ]
        in
        Fest.deep_equal missing [] Fest.expect;
        Js.Promise.resolve ());

    t "plain-multiline-and-html-paste-test" (fun env ->
        let* () = B.new_block env "before-after" in
        let* () = K.press env "Home" in
        let* () =
          iter_seq (fun _ -> K.arrow_right env) (List.init 7 (fun i -> i))
        in
        let* () = Util.clipboard_write env "middle" in
        let* () = B.paste env in
        let* c = Util.edit_content env in
        Fest.deep_equal c "before-middleafter" Fest.expect;
        let* () = Util.clipboard_write env "root\n  child\nsibling" in
        let* () = B.new_block env "" in
        let* () = B.paste env in
        let* () = Util.exit_edit env in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".ls-page-blocks" ~has_text:"child")
        in
        let* () = B.new_block env "" in
        let* _ =
          Pw.eval_js env
            "(() => { \
             const transfer = new DataTransfer(); \
             transfer.setData('text/html', \
             '<h2>Rich title</h2><ul><li><strong>Bold item</strong></li></ul><script>window.__e2eInjected=true</script>'); \
             transfer.setData('text/plain', 'Rich title\\nBold item'); \
             document.querySelector('.editor-wrapper textarea').dispatchEvent( \
             new ClipboardEvent('paste', {bubbles: true, cancelable: true, clipboardData: transfer})); \
             })()"
        in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".ls-page-blocks" ~has_text:"Rich title")
        in
        let* () = K.esc env in
        let* () = Util.exit_edit env in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".block-title-wrap" ~has_text:"Rich title")
        in
        let* injected = Pw.eval_js env "window.__e2eInjected === true" in
        Fest.deep_equal injected false Fest.expect;
        Js.Promise.resolve ());

    t "mixed-height-virtual-page-keeps-blocks-separated-test" (fun env ->
        let long_text =
          String.concat "" (List.init 8 (fun _ -> "long mixed-height content "))
        in
        let blocks =
          List.init 8 (fun i -> i)
          |> List.concat_map (fun i ->
                 [ Printf.sprintf "mixed plain %03d" i
                 ; Printf.sprintf "## mixed heading %d" i
                 ; Printf.sprintf "```clojure\n(+ %d 1)\n```" i
                 ; long_text ^ string_of_int i ])
          |> Array.of_list
        in
        let* () = insert_current_page_blocks env blocks in
        let* _ = enable_virtualized_rendering env in
        let* _ =
          Assert.is_visible_l
            (Playwright.locator_last
               (Pw.q env ".ls-page-blocks [data-virtuoso-scroller]"))
        in
        let* () =
          iter_seq
            (fun position ->
              let* _ =
                Pw.eval_js_arg env
                  "position => { \
                   const scroller = Array.from(document.querySelectorAll( \
                   '.ls-page-blocks [data-virtuoso-scroller]' \
                   )).find((node) => node.getClientRects().length > 0); \
                   scroller.scrollTop = \
                   Math.max(0, (scroller.scrollHeight - scroller.clientHeight) * position); \
                   scroller.dispatchEvent(new Event('scroll')); \
                   }"
                  position
              in
              let* () = Util.wait_timeout env 100. in
              let* r =
                js_json env
                  "(() => { \
                   const blocks = Array.from( \
                   document.querySelectorAll('.ls-page-blocks .ls-block') \
                   ).filter((node) => { \
                   const rect = node.getBoundingClientRect(); \
                   return rect.bottom > 0 && rect.top < innerHeight; \
                   }); \
                   const rects = blocks.map((node) => node.getBoundingClientRect()); \
                   return { \
                   visibleCount: rects.length, \
                   overlap: rects.some( \
                   (rect, index) => index > 0 && rect.top < rects[index - 1].bottom \
                   ) \
                   }; \
                   })()"
              in
              Fest.deep_equal
                (Option.value ~default:0 (Api.get_int r "visibleCount") > 0)
                true Fest.expect;
              Fest.deep_equal (Api.get_bool r "overlap") (Some false)
                Fest.expect;
              Js.Promise.resolve ())
            [ 1.0; 0.0; 0.5; 0.9; 0.1 ]
        in
        Js.Promise.resolve ());

    t "journals-consecutive-input-test" (fun env ->
        let* () = Util.goto_journals env in
        let* () =
          B.new_blocks env
            [ "journal e2e first"; "journal e2e second"
            ; "journal e2e third" ]
        in
        let* _ = Assert.have_count env Util.editor_q 1 in
        let* c = Util.edit_content env in
        Fest.deep_equal c "journal e2e third" Fest.expect;
        let* () = Util.exit_edit env in
        let journal_selector =
          "#journals .journal-item:has-text('journal e2e third')"
        in
        let block_selector =
          journal_selector
          ^ " .ls-block:not(.block-add-button) .block-title-wrap"
        in
        let* () = Pw.wait_for env journal_selector in
        let* texts = Pw.all_text env block_selector in
        let last3 =
          let l = Array.to_list texts in
          let n = List.length l in
          List.filteri (fun i _ -> i >= n - 3) l
        in
        Fest.deep_equal last3
          [ "journal e2e first"; "journal e2e second"
          ; "journal e2e third" ]
          Fest.expect;
        Js.Promise.resolve ());

    t "worker-missing-read-is-recoverable-test" (fun env ->
        let missing_uuid = Util.random_uuid () in
        let* blk =
          Api.ls_api_call env "editor.getBlock" [| Api.str missing_uuid |]
        in
        Fest.deep_equal
          (Js.Nullable.toOption (Api.nullable blk) = None)
          true Fest.expect;
        let* _ = Assert.is_hidden env ".ui__loading, .loading-graph" in
        let* () = B.new_block env "worker recovery target" in
        let* container = Util.get_edit_block_container env in
        let* uuid = Pw.attr_l container "blockid" in
        let* () = Util.exit_edit env in
        Fest.deep_equal (uuid <> None) true Fest.expect;
        let* blk =
          Api.ls_api_call env "editor.getBlock"
            [| Api.str (Option.value ~default:"" uuid) |]
        in
        Fest.deep_equal (Api.get_string blk "content")
          (Some "worker recovery target") Fest.expect;
        Js.Promise.resolve ());

    t "enter-splits-block-at-cursor-test" (fun env ->
        let* () = B.new_block env "alphaomega" in
        let* () = K.press env "Home" in
        let* () =
          iter_seq (fun _ -> K.arrow_right env) (List.init 5 (fun i -> i))
        in
        let* () = K.enter env in
        let* () = Util.press_seq env "middle-" in
        let* _ = Assert.have_count env Util.editor_q 1 in
        let* c = Util.edit_content env in
        Fest.deep_equal c "middle-omega" Fest.expect;
        let* () = Util.exit_edit env in
        let* contents = Util.get_page_blocks_contents env in
        let l = Array.to_list contents in
        let n = List.length l in
        let last2 = List.filteri (fun i _ -> i >= n - 2) l in
        Fest.deep_equal last2 [ "alpha"; "middle-omega" ] Fest.expect;
        Js.Promise.resolve ());

    t "node-reference-autocomplete-test" (fun env ->
        let* source_page = Page.get_page_name env in
        let* () = B.new_block env "reference autocomplete unique target" in
        let* container = Util.get_edit_block_container env in
        let* target_uuid = Pw.attr_l container "blockid" in
        let* () = B.new_block env "" in
        let* () =
          Util.press_seq env "[[reference autocomplete unique"
        in
        let* _ = Assert.is_visible env ".ui__popover-content" in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".ui__popover-content .breadcrumb"
               ~has_text:source_page)
        in
        let* () =
          Pw.click_l
            (Playwright.locator_first
               (Loc.filter env ".ui__popover-content a"
                  ~has_text:"reference autocomplete unique target"))
        in
        let* () = Util.exit_edit env in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".page-reference"
               ~has_text:"reference autocomplete unique target")
        in
        let* () =
          B.jump_to_block env "reference autocomplete unique target"
        in
        let* () = K.press env "ControlOrMeta+a" in
        let* () =
          Util.press_seq env "reference autocomplete updated target"
        in
        let* () = Util.exit_edit env in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".page-reference"
               ~has_text:"reference autocomplete updated target")
        in
        let* name = Page.get_page_name env in
        Fest.deep_equal name source_page Fest.expect;
        let* () =
          Pw.click_l
            (Playwright.locator_first
               (Loc.filter env ".page-reference .page-ref"
                  ~has_text:"reference autocomplete updated target"))
        in
        let url = Playwright.page_url (Env.page env) in
        let sub = Option.value ~default:"" target_uuid in
        let n = String.length sub and h = String.length url in
        let rec go i =
          if i + n > h then false
          else if String.sub url i n = sub then true
          else go (i + 1)
        in
        Fest.deep_equal (n = 0 || go 0) true Fest.expect;
        Assert.is_visible_l
          (Loc.filter env ".ls-page-blocks .block-title-wrap"
             ~has_text:"reference autocomplete updated target"));

    t "quick-add-moves-all-blocks-to-today-test" (fun env ->
        let key = if Util.is_mac () then "Meta+e" else "Control+Alt+e" in
        let* () = K.press env key in
        let* _ = Assert.is_visible env ".ls-dialog-quick-add" in
        let* () = Pw.wait_for env Util.editor_q in
        let* () =
          B.new_blocks env [ "quick add first"; "quick add second" ]
        in
        let* () =
          Pw.click_l
            (Loc.filter env ".ls-dialog-quick-add button"
               ~has_text:"Add to today")
        in
        let* () = Pw.wait_for_hidden env ".ls-dialog-quick-add" in
        let* () = Util.goto_journals env in
        let* _ =
          Assert.have_count_l
            (Loc.filter env "#journals .block-title-wrap"
               ~has_text:"quick add first")
            1
        in
        Assert.have_count_l
          (Loc.filter env "#journals .block-title-wrap"
             ~has_text:"quick add second")
          1);

    t "external-property-update-preserves-edit-buffer-test" (fun env ->
        let* () = B.new_block env "active editor text" in
        let* container = Util.get_edit_block_container env in
        let* uuid = Pw.attr_l container "blockid" in
        let* () = Util.move_cursor_to_end env in
        let* () = Util.press_seq env " local draft" in
        let* _ =
          Api.ls_api_call env "editor.upsertBlockProperty"
            [| Api.str (Option.value ~default:"" uuid)
             ; Api.str "external-property"
             ; Api.str "updated"
            |]
        in
        let* _ =
          Api.ls_api_call env "editor.insertBlock"
            [| Api.str (Option.value ~default:"" uuid)
             ; Api.str "external child"
             ; Api.obj [ "sibling", Api.bool false ]
            |]
        in
        let* c = Util.edit_content env in
        Fest.deep_equal c "active editor text local draft" Fest.expect;
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".property-pair" ~has_text:"external-property")
        in
        Assert.is_visible_l
          (Loc.filter env ".ls-block" ~has_text:"external child"));

    t "operation-completion-restores-mounted-focus-test" (fun env ->
        let* page_name = Page.get_page_name env in
        let* inserted =
          Api.ls_api_call env "editor.appendBlockInPage"
            [| Api.str page_name; Api.str "completion inserted" |]
        in
        let uuid =
          Option.value ~default:"" (Api.get_string inserted "uuid")
        in
        let* _ = Assert.have_count env ("#ls-block-" ^ uuid) 1 in
        let* _ =
          Api.ls_api_call env "editor.updateBlock"
            [| Api.str uuid; Api.str "completion updated" |]
        in
        let* _ =
          Assert.is_visible env
            (Printf.sprintf
               "#ls-block-%s .block-title-wrap:text('completion updated')"
               uuid)
        in
        let* () =
          Pw.click env ("#ls-block-" ^ uuid ^ " .block-content")
        in
        let* () = Util.move_cursor_to_end env in
        let* () = Util.press_seq env " and focused" in
        let* c = Util.edit_content env in
        Fest.deep_equal c "completion updated and focused" Fest.expect;
        let* _ =
          Api.ls_api_call env "editor.removeBlock" [| Api.str uuid |]
        in
        Assert.have_count env ("#ls-block-" ^ uuid) 0);

    t "arrow-up-down-move-the-caret-inside-a-block-test" (fun env ->
        let* () = block_of_three_rows env in
        let* () = K.arrow_up env in
        let* () = Util.press_seq env "X" in
        let expected =
          String.concat "\n" [ caret_row; caret_row ^ "X"; caret_row ]
        in
        let* c = Util.edit_content env in
        Fest.deep_equal c expected Fest.expect;
        let* () = K.arrow_down env in
        let* () = Util.press_seq env "Y" in
        let expected2 =
          String.concat "\n"
            [ caret_row; caret_row ^ "X"; caret_row ^ "Y" ]
        in
        let* c2 = Util.edit_content env in
        Fest.deep_equal c2 expected2 Fest.expect;
        Js.Promise.resolve ());

    t "shift-arrow-up-selects-inside-a-block-test" (fun env ->
        let* () = block_of_three_rows env in
        let* () = K.shift_arrow_up env in
        let* () = Util.press_seq env "Z" in
        let expected =
          String.concat "\n" [ caret_row; caret_row ^ "Z" ]
        in
        let* c = Util.edit_content env in
        Fest.deep_equal c expected Fest.expect;
        Js.Promise.resolve ());

    t "heading-editor-shows-every-row-test" (fun env ->
        let title = String.concat " " (List.init 12 (fun _ -> "heading row")) in
        let* () = B.new_block env ("# " ^ title) in
        let* () = Util.exit_edit env in
        let* () =
          Pw.click_l
            (Loc.filter env ".block-title-wrap" ~has_text:"heading row")
        in
        let* () = Util.wait_editor_visible env in
        let* c = Util.edit_content env in
        Fest.deep_equal c title Fest.expect;
        let* heights = editor_box_heights env in
        let client =
          Option.value ~default:0 (Api.get_int heights "client")
        in
        let scroll =
          Option.value ~default:999 (Api.get_int heights "scroll")
        in
        Fest.deep_equal (scroll <= client) true Fest.expect;
        Js.Promise.resolve ());

    t "page-ref-navigate-persists-unsaved-edit-buffer-test" (fun env ->
        let target_page = "pageref-flush-target-" ^ Util.random_uuid () in
        let marker = "pageref-flush-marker-" ^ Util.random_uuid () in
        let* host_page = Page.get_page_name env in
        let* () = Page.new_page env target_page in
        let* () = Page.goto_page env host_page in
        let* () = B.new_block env ("See [[" ^ target_page ^ "]] here") in
        let* () = B.new_block env "" in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".page-reference .page-ref"
               ~has_text:target_page)
        in
        let* name = Page.get_page_name env in
        Fest.deep_equal name host_page Fest.expect;
        let* () = Pw.fill env Util.editor_q marker in
        let* c = Util.edit_content env in
        Fest.deep_equal c marker Fest.expect;
        let* () =
          Pw.click_l
            (Playwright.locator_first
               (Loc.filter env ".page-reference .page-ref"
                  ~has_text:target_page))
        in
        let* name2 = Page.wait_page_name env target_page in
        Fest.deep_equal name2 target_page Fest.expect;
        let* () = Page.goto_page env host_page in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".ls-page-blocks .block-title-wrap"
               ~has_text:marker)
        in
        let* contents = Util.get_page_blocks_contents env in
        Fest.deep_equal (List.mem marker (Array.to_list contents)) true
          Fest.expect;
        Js.Promise.resolve ());

    t "shift-click-select-persists-unsaved-edit-buffer-test" (fun env ->
        let marker = "shift-flush-marker-" ^ Util.random_uuid () in
        let shift_click text =
          Pw.click_l ~modifiers:[| "Shift" |]
            (Playwright.locator_first
               (Loc.filter env
                  ".ls-page-blocks .ls-block .block-content"
                  ~has_text:text))
        in
        let* () = B.new_block env "shift flush target one" in
        let* () = B.new_block env "shift flush target two" in
        let* () = Util.exit_edit env in
        let* () = B.new_block env "" in
        let* () = Pw.fill env Util.editor_q marker in
        let* c = Util.edit_content env in
        Fest.deep_equal c marker Fest.expect;
        let* () = shift_click "shift flush target one" in
        let* () = shift_click "shift flush target two" in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".ls-page-blocks .block-title-wrap"
               ~has_text:marker)
        in
        let* contents = Util.get_page_blocks_contents env in
        Fest.deep_equal (List.mem marker (Array.to_list contents)) true
          Fest.expect;
        Js.Promise.resolve ());

    t "page-ref-navigate-persists-edit-buffer-with-open-popup-test"
      (fun env ->
        let target_page = "pageref-popup-target-" ^ Util.random_uuid () in
        let marker = "pageref-popup-marker-" ^ Util.random_uuid () in
        let* host_page = Page.get_page_name env in
        let* () = Page.new_page env target_page in
        let* () = Page.goto_page env host_page in
        let* () = B.new_block env ("See [[" ^ target_page ^ "]] here") in
        let* () = B.new_block env "" in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".page-reference .page-ref"
               ~has_text:target_page)
        in
        let* name = Page.get_page_name env in
        Fest.deep_equal name host_page Fest.expect;
        let* () = Util.press_seq env (marker ^ " [[draft") in
        let* _ =
          Assert.is_visible env ".ui__popover-content a.menu-link"
        in
        let* () =
          Pw.click_l
            (Playwright.locator_first
               (Loc.filter env ".page-reference .page-ref"
                  ~has_text:target_page))
        in
        let* name2 = Page.wait_page_name env target_page in
        Fest.deep_equal name2 target_page Fest.expect;
        let* () = Page.goto_page env host_page in
        let* _ =
          Assert.is_visible_l
            (Loc.filter env ".ls-page-blocks .block-title-wrap"
               ~has_text:marker)
        in
        let* contents = Util.get_page_blocks_contents env in
        let starts_with_marker s =
          String.length s >= String.length marker
          && String.sub s 0 (String.length marker) = marker
        in
        Fest.deep_equal
          (List.exists starts_with_marker (Array.to_list contents))
          true Fest.expect;
        Js.Promise.resolve ()))
