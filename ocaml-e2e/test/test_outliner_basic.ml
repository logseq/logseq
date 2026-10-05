(** Port of outliner_basic_test.clj. *)

open Fest.Promise

module Util = Util
module B = Block
module Page = Ls_page
module K = Keyboard
module Assert = E2e_assert
module Json = Js.Json

let env = Fixtures.shared_open_page ()

(* --- helpers ------------------------------------------------------------ *)

let block_text_position env text =
  (* poll: the block list re-renders after ops; a one-shot query can hit
     the gap between remounts *)
  let deadline = Js.Date.now () +. 8000. in
  let rec poll () =
    let* found = Pw.find_one_by_text env "span" text in
    match found with
    | Some loc ->
        let* _ = Assert.is_visible_l loc in
        let* x, _ = Util.bounding_xy_l loc in
        Js.Promise.resolve x
    | None ->
        if Js.Date.now () > deadline then
          Js.Promise.reject (Failure ("span not found: " ^ text))
        else
          let* () = Util.wait_timeout env 150. in
          poll ()
  in
  poll ()

let block_q title =
  Printf.sprintf
    ".ls-block:has(> .block-main-container .block-title-wrap:text-is('%s'))"
    title

let collapse_block_by_arrow env title =
  let block = Playwright.locator_first (Pw.q env (block_q title)) in
  let* () = Pw.hover_l block in
  let* () =
    Pw.click_l
      (Playwright.locator_first (Pw.sub block ".block-control"))
  in
  let* _ =
    Assert.is_visible env
      (block_q title ^ " > .block-main-container .bullet-closed")
  in
  Js.Promise.resolve ()

let new_collapsed_parent_and_sibling env parent child sibling =
  let* () = B.new_blocks env [ parent; child ] in
  let* () = B.indent env in
  let* () = B.new_block env sibling in
  let* () = B.outdent env in
  let* () = Util.exit_edit env in
  collapse_block_by_arrow env parent

let assert_expanded_parent env parent child =
  let* _ =
    Assert.is_hidden env
      (block_q parent ^ " > .block-main-container .bullet-closed")
  in
  Assert.is_visible env
    (block_q parent
     ^ " .ls-block "
     ^ Printf.sprintf ".block-title-wrap:text-is('%s')" child)

let indent_into_collapsed_block_while_editing env =
  let* () =
    new_collapsed_parent_and_sibling env "collapsed parent" "hidden child"
      "indent me"
  in
  let* () = B.jump_to_block env "indent me" in
  let* () = K.tab env in
  let* _ = assert_expanded_parent env "collapsed parent" "hidden child" in
  let* _ =
    Assert.is_visible env
      (block_q "collapsed parent" ^ " .ls-block .editor-wrapper textarea")
  in
  let* content = Util.get_edit_content env in
  Fest.deep_equal content (Some "indent me") Fest.expect;
  Js.Promise.resolve ()

let zoom_in_shortcut env =
  K.press env (if Config.mac then "Meta+Shift+." else "Alt+ArrowRight")

let current_location_hash env = Pw.eval_js env "window.location.hash"

let current_editing_block_id env =
  Pw.eval_js env
    "(() => {\n\
    \  const editor = document.querySelector('.editor-wrapper textarea');\n\
    \  return editor?.closest('[blockid]')?.getAttribute('blockid') ?? null;\n\
    })();"

let block_tree env page_name =
  Api.ls_api_call env "editor.getPageBlocksTree"
    [| Json.string page_name |]

type tree = Node of string * tree list

let t title children = Node (title, children)

let rec content_tree nodes =
  let arr =
    match Js.Json.decodeArray nodes with Some a -> a | None -> [||]
  in
  Array.to_list
    (Array.map
       (fun node ->
         Node
           ( Api.get_string node "content"
             |> Option.value ~default:"",
             content_tree
               (match Js.Nullable.toOption (Api.get node "children") with
               | Some c -> c
               | None -> Json.null) ))
       arr)

let rec tree_equal a b =
  match (a, b) with
  | Node (s1, c1), Node (s2, c2) ->
      s1 = s2 && List.length c1 = List.length c2
      && List.for_all2 tree_equal c1 c2

let trees_equal xs ys =
  List.length xs = List.length ys && List.for_all2 tree_equal xs ys

let wait_for_block_content env block_id expected =
  let rec loop attempts =
    let* block =
      Api.ls_api_call env "editor.getBlock" [| Json.string block_id |]
    in
    let actual = Api.get_string block "content" in
    if actual = Some expected || attempts = 0 then (
      Fest.deep_equal actual (Some expected) Fest.expect;
      Js.Promise.resolve ())
    else
      let* () = Util.wait_timeout env 100. in
      loop (attempts - 1)
  in
  loop 40

(* clj [visible-outline-content-tree]: relations = [index, title, parentIdx],
   rebuilt into a [title children] tree. *)
let visible_outline_content_tree env =
  let* (relations : Js.Json.t) =
    Pw.eval_js env
      "(() => {\n\
      \  const nodes = [...document.querySelectorAll('.ls-page-blocks \
       .ls-block')]\n\
      \    .filter(node => !node.closest('.is-comments-area, \
       .ls-comments-area, .ls-comment-row'));\n\
      \  return nodes\n\
      \    .map((node, index) => {\n\
      \      const own = selector => [...node.querySelectorAll(selector)]\n\
      \        .find(child => child.closest('.ls-block') === node);\n\
      \      const editor = own('.editor-wrapper textarea');\n\
      \      const content = own('.block-content');\n\
      \      const title = (editor && editor.offsetParent !== null\n\
      \                     ? editor.value\n\
      \                     : content?.innerText || node.dataset.blockTitle \
       || '').trim();\n\
      \      const parent = node.parentElement.closest('.ls-block');\n\
      \      return [index, title, parent ? nodes.indexOf(parent) : null];\n\
      \    })\n\
      \    .filter(([_index, title]) => title);\n\
      })()"
  in
  let rows =
    match Js.Json.decodeArray relations with
    | Some a ->
        Array.to_list
          (Array.map
             (fun row ->
               match Js.Json.decodeArray row with
               | Some [| i; title; parent |] ->
                   ( int_of_float
                       (Option.get (Js.Json.decodeNumber i)),
                     Option.get (Js.Json.decodeString title),
                     Js.Json.decodeNumber parent
                     |> Option.map int_of_float )
               | _ -> failwith "bad relation row")
             a)
    | None -> []
  in
  let children_of parent_idx =
    List.filter_map
      (fun (i, title, p) ->
        if p = parent_idx then Some (i, title) else None)
      rows
  in
  let rec build parent_idx =
    List.map
      (fun (i, title) -> Node (title, build (Some i)))
      (children_of parent_idx)
  in
  Js.Promise.resolve (build None)

let content_tree_matches env expected =
  (* non-asserting variant of wait_for_content_tree *)
  let* () = Util.wait_timeout env 300. in
  let rec loop attempts =
    let* actual = visible_outline_content_tree env in
    if trees_equal expected actual then Js.Promise.resolve true
    else if attempts = 0 then Js.Promise.resolve false
    else
      let* () = Util.wait_timeout env 100. in
      loop (attempts - 1)
  in
  loop 40

let wait_for_content_tree env expected =
  let* () = Util.wait_timeout env 300. in
  let rec loop attempts =
    let* actual = visible_outline_content_tree env in
    if trees_equal expected actual then (
      let* () = Util.wait_timeout env 250. in
      let* actual2 = visible_outline_content_tree env in
      Fest.deep_equal (trees_equal expected actual2) true Fest.expect;
      Js.Promise.resolve ())
    else if attempts = 0 then (
      Js.log2 "expected tree" (Pw.json_stringify expected);
      Fest.deep_equal (trees_equal expected actual) true Fest.expect;
      Js.Promise.resolve ())
    else
      let* () = Util.wait_timeout env 100. in
      loop (attempts - 1)
  in
  loop 40

let undo_and_wait_for_content_tree env expected =
  let* () = B.undo env in
  let* () = Util.wait_timeout env 1000. in
  wait_for_content_tree env expected

let redo_and_wait_for_content_tree env expected =
  let* () = B.redo env in
  let* () = Util.wait_timeout env 1000. in
  wait_for_content_tree env expected

let click_block_by_uuid env uuid =
  Pw.click_l
    (Playwright.locator_first
       (Pw.q env ("#block-content-" ^ uuid ^ ":visible")))

let click_block_by_title env title =
  let* (target_selector : string) =
    Pw.eval_js env
      (Printf.sprintf
         "(() => {\n\
         \  const root = document.querySelector(\".ls-block[data-block-title='%s']\");\n\
         \  const own = selector => [...root.querySelectorAll(selector)]\n\
         \    .find(node => node.closest('.ls-block') === root);\n\
         \  const editor = own('textarea');\n\
         \  const target = editor && editor.offsetParent !== null\n\
         \    ? editor\n\
         \    : own('.block-content');\n\
         \  return `#${CSS.escape(target.id)}`;\n\
         })()"
         title)
  in
  let* () = Pw.click env target_selector in
  let* _ =
    Pw.eval_js env
      (Printf.sprintf
         "(() => new Promise((resolve, reject) => {\n\
         \  let attempts = 40;\n\
         \  const waitForTarget = () => {\n\
         \    const root = document.querySelector(\".ls-block[data-block-title='%s']\");\n\
         \    const target = [...root.querySelectorAll('textarea')]\n\
         \      .find(node => node.closest('.ls-block') === root && \
          node.offsetParent !== null);\n\
         \    if (target) {\n\
         \      target.focus();\n\
         \      resolve(true);\n\
         \    } else if (attempts-- === 0) {\n\
         \      reject(new Error('Target block editor did not become active'));\n\
         \    } else {\n\
         \      setTimeout(waitForTarget, 50);\n\
         \    }\n\
         \  };\n\
         \  waitForTarget();\n\
         }))()"
         title)
  in
  Js.Promise.resolve ()

let editor_pick_js =
  "const editor = document.activeElement?.matches('.editor-wrapper textarea')\n\
  \  ? document.activeElement\n\
  \  : [...document.querySelectorAll('.editor-wrapper textarea')]\n\
  \    .find(node => node.offsetParent !== null);"

let move_editor_cursor_to_start env =
  Pw.eval_js env
    ("(() => {\n" ^ editor_pick_js
   ^ "\n  editor.focus();\n  editor.setSelectionRange(0, 0);\n})();")

let move_editor_cursor_to env position =
  Pw.eval_js env
    (Printf.sprintf
       "(() => {\n%s\n  editor.focus();\n  editor.setSelectionRange(%d, %d);\n})();"
       editor_pick_js position position)

let move_editor_cursor_to_end env =
  Pw.eval_js env
    ("(() => {\n" ^ editor_pick_js
   ^ "\n  editor.focus();\n  editor.setSelectionRange(editor.value.length, \
      editor.value.length);\n})();")

let drag_block env source_title target_title placement =
  let source_block =
    Pw.q env
      (Printf.sprintf ".ls-page-blocks .ls-block[data-block-title='%s']"
         source_title)
  in
  let target_block =
    Pw.q env
      (Printf.sprintf ".ls-page-blocks .ls-block[data-block-title='%s']"
         target_title)
  in
  let* box = Playwright.bounding_box target_block in
  let target_height =
    match Js.Nullable.toOption box with
    | Some b -> Playwright.box_height b
    | None -> failwith "drag target not visible"
  in
  let target_x = if placement = "inside" then 80. else 30. in
  let target_y =
    match placement with
    | "before" -> 2.
    | "after" -> target_height -. 2.
    | "inside" -> target_height -. 2.
    | _ -> target_height -. 2.
  in
  let* () =
    Pw.drag_to
      ~target_x ~target_y ~steps:12
      (Playwright.locator_first (Pw.sub source_block ".bullet-container"))
      target_block
  in
  Util.wait_timeout env 250.

let block_visible env uuid =
  let* n = Pw.count env ("#ls-block-" ^ uuid) in
  Js.Promise.resolve (n > 0)

let rec iter_two f = function
  | [] -> Js.Promise.resolve ()
  | x :: xs ->
      let* () = f x in
      iter_two f xs

let rec repeat n f =
  if n <= 0 then Js.Promise.resolve ()
  else
    let* () = f () in
    repeat (n - 1) f

(* --- shared scenarios ---------------------------------------------------- *)

let create_test_page_and_insert_blocks env =
  let* n = Util.blocks_count env in
  Fest.deep_equal n 2 Fest.expect;
  let* () = B.new_blocks env [ "first block"; "second block" ] in
  let* () = Util.exit_edit env in
  let* n = Util.blocks_count env in
  Fest.deep_equal n 3 Fest.expect;
  Js.Promise.resolve ()

let indent_and_outdent env =
  let* () = B.new_blocks env [ "b1"; "b2" ] in
  let* () = B.indent env in
  let* () = B.outdent env in
  (* indent a block with its children *)
  let* () = B.new_block env "b3" in
  let* () = B.indent env in
  let* () = K.arrow_up env in
  let* () = B.indent env in
  let* () = Util.exit_edit env in
  let* x1 = block_text_position env "b1" in
  let* x2 = block_text_position env "b2" in
  let* x3 = block_text_position env "b3" in
  Fest.deep_equal (x1 < x2 && x2 < x3) true Fest.expect;
  (* unindent a block with its children *)
  let* () = B.open_last_block env in
  let* () = B.new_blocks env [ "b4"; "b5" ] in
  let* () = B.indent env in
  let* () = K.arrow_up env in
  let* () = B.outdent env in
  let* () = Util.exit_edit env in
  let* x2 = block_text_position env "b2" in
  let* x3 = block_text_position env "b3" in
  let* x4 = block_text_position env "b4" in
  let* x5 = block_text_position env "b5" in
  Fest.deep_equal (x2 = x4 && x3 = x5 && x2 < x3) true Fest.expect;
  Js.Promise.resolve ()

let indent_outdent_embed_page env =
  let* () = Page.new_page env "Page embed" in
  let* () = B.new_blocks env [ "b1"; "b2" ] in
  let* () = Page.new_page env "Page testing" in
  let* () = B.new_blocks env [ "b3"; "" ] in
  let* () = Util.input_command env "Node embed" in
  let* () = Util.press_seq env ~delay:60. "Page embed" in
  let* _ =
    Pw.wait_for env "#ac-0.menu-link:has-text('Page embed')"
  in
  let* () = K.press env ~delay:60. "Enter" in
  let* () = Util.exit_edit env in
  let* () = B.new_blocks env [ "b4" ] in
  let* () = B.outdent env in
  let* () = B.indent env in
  let* () = Util.exit_edit env in
  let* x2 = block_text_position env "b2" in
  let* x3 = block_text_position env "b3" in
  let* x4 = block_text_position env "b4" in
  Fest.deep_equal (x2 = x4) true Fest.expect;
  Fest.deep_equal (x3 < x2) true Fest.expect;
  Js.Promise.resolve ()

let move_up_down env =
  let* () = B.new_blocks env [ "b1"; "b2"; "b3"; "b4" ] in
  let* () = Util.repeat_keyboard env 2 "Shift+ArrowUp" in
  let* contents =
    Util.wait_page_blocks_contents env [ "b1"; "b2"; "b3"; "b4" ]
  in
  Fest.deep_equal
    (Array.to_list contents)
    [ "b1"; "b2"; "b3"; "b4" ] Fest.expect;
  (* a second move chord pressed while the first move's remount is in
     flight loses its modifier/target — let the move commit first *)
  let* () =
    K.press env ((if Config.mac then "Meta" else "Alt") ^ "+Shift+ArrowUp")
  in
  let* () = Util.wait_timeout env 300. in
  let* () =
    K.press env ((if Config.mac then "Meta" else "Alt") ^ "+Shift+ArrowUp")
  in
  let* contents =
    Util.wait_page_blocks_contents env [ "b3"; "b4"; "b1"; "b2" ]
  in
  Fest.deep_equal
    (Array.to_list contents)
    [ "b3"; "b4"; "b1"; "b2" ] Fest.expect;
  let* () =
    K.press env ((if Config.mac then "Meta" else "Alt") ^ "+Shift+ArrowDown")
  in
  let* () = Util.wait_timeout env 300. in
  let* () =
    K.press env ((if Config.mac then "Meta" else "Alt") ^ "+Shift+ArrowDown")
  in
  let* contents =
    Util.wait_page_blocks_contents env [ "b1"; "b2"; "b3"; "b4" ]
  in
  Fest.deep_equal
    (Array.to_list contents)
    [ "b1"; "b2"; "b3"; "b4" ] Fest.expect;
  Js.Promise.resolve ()

let delete_blocks_scenario env =
  let* () = B.new_blocks env [ "b1"; "b2"; "b3"; "b4" ] in
  let* () = B.delete_blocks env in
  let* _ = Util.wait_edit_content env "b3" in
  let* () = Util.repeat_keyboard env 2 "Shift+ArrowUp" in
  let* () = B.delete_blocks env in
  let* _ = Util.wait_edit_content env "b1" in
  let* n = Util.page_blocks_count env in
  Fest.deep_equal n 1 Fest.expect;
  Js.Promise.resolve ()

let delete_end env =
  let* () = B.new_blocks env [ "b1"; "b2"; "b3" ] in
  let* () = K.arrow_up env in
  (* ArrowUp is delivered to whatever element had focus; under load the
     focus move to b2's editor lags the keypress and Delete lands on a
     detached element. Wait until the focused editor actually shows b2
     before pressing Delete. *)
  let* _ = Util.wait_edit_content env "b2" in
  let* () = K.delete env in
  let* _ = Util.wait_edit_content env "b2b3" in
  let* n = Util.page_blocks_count env in
  Fest.deep_equal n 2 Fest.expect;
  Js.Promise.resolve ()

let delete_test_with_children env =
  let* () = B.new_blocks env [ "b1"; "b2"; "b3"; "b4" ] in
  let* () = B.indent env in
  let* () = K.arrow_up env in
  let* () = B.indent env in
  let* () = K.arrow_up env in
  let* () = B.delete_blocks env in
  let* _ = Util.wait_edit_content env "b1" in
  let* n = Util.page_blocks_count env in
  Fest.deep_equal n 1 Fest.expect;
  Js.Promise.resolve ()

(* --- tests --------------------------------------------------------------- *)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test "create-test-page-and-insert-blocks-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = create_test_page_and_insert_blocks env in
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test "indent-and-outdent-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = indent_and_outdent env in
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test "indent-outdent-embed-page-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = indent_outdent_embed_page env in
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test
    "focused-root-block-cannot-indent-or-move-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = B.new_blocks env [ "focused-root"; "focused-child" ] in
    let* () = K.arrow_up env in
    let* (root_id : string Js.Nullable.t) =
      current_editing_block_id env
    in
    let root_id =
      Option.get (Js.Nullable.toOption root_id)
    in
    (* zoom-in routes async and the chord can land during a remount; retry
       until the hash reflects the focused block (bounded) *)
    let rec zoom_until_root tries =
      let* () = zoom_in_shortcut env in
      let* () = Util.wait_timeout env 500. in
      let* (hash : string) = current_location_hash env in
      if Util.contains_sub hash root_id then Js.Promise.resolve ()
      else if tries <= 1 then
        Js.Promise.reject (Failure "zoom-in did not focus root block")
      else zoom_until_root (tries - 1)
    in
    let* () = zoom_until_root 4 in
    let* () =
      Js.Promise.catch
        (fun _ ->
           (* editing state can be dropped across the zoom route under
              load. In the focused view the root block's title renders
              only inside the breadcrumb's ancestor list — there is no
              clickable row for it. Un-zoom one level via the last
              breadcrumb ancestor, reopen its editor on the page, then
              zoom back in: same end state the assertion checks. *)
           let* () =
             Js.Promise.catch
               (fun _ -> Pw.click env ".breadcrumb a >> nth=-1")
               (B.jump_to_block env "focused-root")
           in
           let* () =
             Js.Promise.catch
               (fun e ->
                  let* dump =
                    Pw.eval_js env
                      "(() => JSON.stringify({url: location.hash, crumbs: [...document.querySelectorAll('.breadcrumb a')].map(a => a.textContent), blocks: [...document.querySelectorAll('.ls-block .block-title-wrap, .ls-block .block-content')].map(e => e.textContent).slice(0,10), main: (document.querySelector('main')?.innerText || '').slice(0,300)}))()"
                  in
                  let* (tree : Js.Json.t) =
                    Api.ls_api_call env "editor.getPageBlocksTree"
                      [| Api.str "page 1" |]
                  in
                  let* () =
                    Js.Promise.resolve
                      (Js.log2 "focused-dom" dump)
                  in
                  let* () =
                    Js.Promise.resolve
                      (Js.log2 "focused-tree" (Js.Json.stringify tree))
                  in
                  Playwright.throw_error e)
               (B.jump_to_block env "focused-root")
           in
           let* () = zoom_until_root 3 in
           Util.wait_editor_visible env)
        (Util.wait_editor_visible env)
    in
    let* content = Util.get_edit_content env in
    Fest.deep_equal content (Some "focused-root") Fest.expect;
    let* (before_hash : string) = current_location_hash env in
    let* before_blocks = Util.get_page_blocks_contents env in
    let* () = K.tab env in
    let* () = Util.wait_timeout env 100. in
    let* () = K.shift_tab env in
    let* () = Util.wait_timeout env 100. in
    let* () = K.meta_shift_arrow_up env in
    let* () = Util.wait_timeout env 100. in
    let* () = K.meta_shift_arrow_down env in
    let* () = Util.wait_timeout env 100. in
    let* content = Util.get_edit_content env in
    Fest.deep_equal content (Some "focused-root") Fest.expect;
    let* (hash : string) = current_location_hash env in
    Fest.deep_equal hash before_hash Fest.expect;
    let* blocks = Util.get_page_blocks_contents env in
    Fest.deep_equal blocks before_blocks Fest.expect;
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test
    "indent-into-collapsed-block-expands-it-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = indent_into_collapsed_block_while_editing env in
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test
    "indent-into-collapsed-block-on-journals-expands-it-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Util.goto_journals env in
    let* _ =
      Pw.wait_for env "#journals .journal-item .ls-page-blocks"
    in
    let* () = B.open_last_block env in
    let* () = indent_into_collapsed_block_while_editing env in
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test
    "indent-selected-block-into-collapsed-block-expands-it-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () =
      new_collapsed_parent_and_sibling env "collapsed parent" "hidden child"
        "select me"
    in
    let* () = B.jump_to_block env "select me" in
    let* () = K.esc env in
    let* _ = Assert.selected_block_text env "select me" in
    let* () = K.tab env in
    let* _ =
      assert_expanded_parent env "collapsed parent" "hidden child"
    in
    let* _ =
      Assert.is_visible env
        (block_q "collapsed parent"
         ^ " .ls-block.selected :text('select me')")
    in
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test
    "enter-then-tab-on-collapsed-block-expands-it-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = B.new_blocks env [ "collapsed parent"; "hidden child" ] in
    let* () = B.indent env in
    let* () = Util.exit_edit env in
    let* () = collapse_block_by_arrow env "collapsed parent" in
    let* () = B.jump_to_block env "collapsed parent" in
    let* () = Util.move_cursor_to_end env in
    let* () = K.enter env in
    let* () = K.tab env in
    let* () = Util.type_in_editor env "new child" in
    let* _ =
      assert_expanded_parent env "collapsed parent" "hidden child"
    in
    let* _ =
      Assert.is_visible env
        (block_q "collapsed parent" ^ " .ls-block .editor-wrapper textarea")
    in
    let* content = Util.get_edit_content env in
    Fest.deep_equal content (Some "new child") Fest.expect;
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test "move-up-down-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = move_up_down env in
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test "delete-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = delete_blocks_scenario env in
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test "delete-end-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = delete_end env in
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test "delete-test-with-children-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = delete_test_with_children env in
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test "delete-concat-test-2-blocks" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = B.new_blocks env [ ""; "b2" ] in
    let* () = B.indent env in
    let* () = K.arrow_up env in
    let* () = K.delete env in
    let* _ = Util.wait_edit_content env "b2" in
    let* () = Util.exit_edit env in
    let* contents = Util.get_page_blocks_contents env in
    Fest.deep_equal (Array.to_list contents) [ "b2" ] Fest.expect;
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test "delete-concat-test-3-blocks" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = B.new_blocks env [ ""; "b2"; "b3" ] in
    let* () = B.indent env in
    let* () = K.arrow_up env in
    let* () = K.arrow_up env in
    let* () = K.delete env in
    let* _ = Util.wait_edit_content env "b2" in
    let* () = Util.exit_edit env in
    let* contents = Util.get_page_blocks_contents env in
    Fest.deep_equal (Array.to_list contents) [ "b2"; "b3" ] Fest.expect;
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test "delete-concat-test-with-children" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = B.new_blocks env [ ""; "b2"; "b3" ] in
    let* () = B.indent env in
    let* () = K.arrow_up env in
    let* () = B.indent env in
    let* () = K.arrow_up env in
    let* () = K.delete env in
    let* _ = Util.wait_edit_content env "" in
    let* n = Util.page_blocks_count env in
    Fest.deep_equal n 3 Fest.expect;
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test "delete-concat-test-with-tag" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = B.new_blocks env [ ""; "b2" ] in
    let* () = B.indent env in
    let* () = Util.set_tag env "tag1" in
    let* () = K.arrow_up env in
    let* () = K.delete env in
    let* _ = Util.wait_edit_content env "b2" in
    let* () = Util.exit_edit env in
    let* _ =
      Assert.is_visible env ".ls-block a.tag:has-text('tag1')"
    in
    let* contents = Util.get_page_blocks_contents env in
    Fest.deep_equal (Array.to_list contents) [ "b2" ] Fest.expect;
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test
    "backspace-empty-first-child-keeps-empty-parent-subtree-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Page.new_page env "backspace empty first child" in
    let* page_obj =
      Api.ls_api_call env "editor.getBlock"
        [| Json.string "backspace empty first child" |]
    in
    let page_uuid = Option.get (Api.get_string page_obj "uuid") in
    let children =
      Json.array
        [| Api.obj [ ("content", Json.string "") ];
           Api.obj [ ("content", Json.string "child2") ];
           Api.obj [ ("content", Json.string "child3") ] |]
    in
    let* blocks =
      Api.ls_api_call env "editor.insertBatchBlock"
        [| Json.string page_uuid;
           Json.array
             [| Api.obj
                  [ ("content", Json.string ""); ("children", children) ]
             |] |]
    in
    let at i = (Js.Json.decodeArray blocks |> Option.get).(i) in
    let parent = at 0 in
    let first_child = at 1 in
    let child2 = at 2 in
    let child3 = at 3 in
    let first_child_uuid = Option.get (Api.get_string first_child "uuid") in
    let* () =
      Pw.click env ("#ls-block-" ^ first_child_uuid ^ " .block-content")
    in
    let* () = Util.wait_editor_visible env in
    let* content = Util.get_edit_content env in
    Fest.deep_equal content (Some "") Fest.expect;
    let* () = K.backspace env in
    let* () = Util.wait_timeout env 100. in
    let* v = block_visible env first_child_uuid in
    Fest.deep_equal v false Fest.expect;
    let* v = block_visible env (Option.get (Api.get_string parent "uuid")) in
    Fest.deep_equal v true Fest.expect;
    let* v = block_visible env (Option.get (Api.get_string child2 "uuid")) in
    Fest.deep_equal v true Fest.expect;
    let* v = block_visible env (Option.get (Api.get_string child3 "uuid")) in
    Fest.deep_equal v true Fest.expect;
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test
    "backspace-at-parent-start-keeps-children-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () =
      iter_two
        (fun (page_name, parent_content) ->
          let* () = Page.new_page env page_name in
          let* page_obj =
            Api.ls_api_call env "editor.getBlock"
              [| Json.string page_name |]
          in
          let page_uuid = Option.get (Api.get_string page_obj "uuid") in
          let children =
            Json.array [| Api.obj [ ("content", Json.string "b") ] |]
          in
          let* blocks =
            Api.ls_api_call env "editor.insertBatchBlock"
              [| Json.string page_uuid;
                 Json.array
                   [| Api.obj
                        [ ("content", Json.string parent_content);
                          ("children", children) ] |] |]
          in
          let at i = (Js.Json.decodeArray blocks |> Option.get).(i) in
          let parent_uuid =
            Option.get (Api.get_string (at 0) "uuid")
          in
          let child_uuid = Option.get (Api.get_string (at 1) "uuid") in
          let* () =
            Pw.click env ("#block-content-" ^ parent_uuid)
          in
          let* () = Util.wait_editor_visible env in
          let* _ =
            Pw.eval_js env
              "(() => {\n\
              \  const editor = document.querySelector('.editor-wrapper \
               textarea');\n\
              \  editor.focus();\n\
              \  editor.setSelectionRange(0, 0);\n\
              })();"
          in
          let* () = K.backspace env in
          let* () = Util.wait_timeout env 200. in
          let* content = Util.get_edit_content env in
          Fest.deep_equal content (Some parent_content) Fest.expect;
          let* v = block_visible env parent_uuid in
          Fest.deep_equal v true Fest.expect;
          let* v = block_visible env child_uuid in
          Fest.deep_equal v true Fest.expect;
          Js.Promise.resolve ())
        [ ("backspace non-empty parent start", "a");
          ("backspace empty parent start", "") ]
    in
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test
    "consecutive-backspace-does-not-restore-deleted-blocks-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Page.new_page env "consecutive backspace deletion" in
    let* page_obj =
      Api.ls_api_call env "editor.getBlock"
        [| Json.string "consecutive backspace deletion" |]
    in
    let page_uuid = Option.get (Api.get_string page_obj "uuid") in
    let* blocks =
      Api.ls_api_call env "editor.insertBatchBlock"
        [| Json.string page_uuid;
           Json.array
             [| Api.obj [ ("content", Json.string "a") ];
                Api.obj [ ("content", Json.string "b") ] |] |]
    in
    let b = (Js.Json.decodeArray blocks |> Option.get).(1) in
    let b_uuid = Option.get (Api.get_string b "uuid") in
    let editor_state () =
      Pw.eval_js env
        "(() => {\n\
        \  const editor = document.querySelector('.editor-wrapper textarea');\n\
        \  return [\n\
        \    editor?.value ?? null,\n\
        \    Array.from(document.querySelectorAll(\n\
        \      '.ls-page-blocks .block-title-wrap'))\n\
        \      .map((node) => node.textContent.trim())\n\
        \      .filter(Boolean)\n\
        \  ];\n\
        })();"
    in
    let* () = Pw.click env ("#block-content-" ^ b_uuid) in
    let* () = Util.wait_editor_visible env in
    let* _ =
      Pw.eval_js env
        "(() => {\n\
        \  const editor = document.querySelector('.editor-wrapper textarea');\n\
        \  editor.focus();\n\
        \  editor.setSelectionRange(editor.value.length, editor.value.length);\n\
        })();"
    in
    let* () = repeat 4 (fun () -> K.backspace env) in
    let* () = Util.wait_timeout env 50. in
    let* (immediate : Js.Json.t) = editor_state () in
    let titles =
      match Js.Json.decodeArray immediate with
      | Some [| _; t |] -> (
          match Js.Json.decodeArray t with
          | Some a -> Array.length a
          | None -> -1)
      | _ -> -1
    in
    Fest.deep_equal titles 0 Fest.expect;
    let* () = Util.wait_timeout env 500. in
    let* (later : Js.Json.t) = editor_state () in
    Fest.deep_equal immediate later Fest.expect;
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test
    "held-backspace-does-not-duplicate-merged-content-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Page.new_page env "held backspace merge" in
    let* () =
      B.new_blocks env [ "Foo"; ""; "Foo"; ""; "Foo"; "" ]
    in
    let* () = Util.repeat_keyboard env 75 "Backspace" in
    let* () = Util.wait_timeout env 500. in
    let* editor_content = Util.get_edit_content env in
    let* block_contents = Util.get_page_blocks_contents env in
    Fest.deep_equal (editor_content <> Some "FooFoo") true Fest.expect;
    Fest.deep_equal
      (Array.exists (fun s -> s = "FooFoo") block_contents)
      false Fest.expect;
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test "rapid-retype-before-enter-keeps-the-edit-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = B.open_last_block env in
    let* () = K.press env "a" in
    let* () = K.backspace env in
    let* () = K.press env "a" in
    let* () = K.enter env in
    let* () = Util.wait_timeout env 700. in
    let* () = Util.exit_edit env in
    let* contents = Util.get_page_blocks_contents env in
    Fest.deep_equal
      (Array.to_list contents
       |> List.filter (fun s -> String.trim s <> ""))
      [ "a" ] Fest.expect;
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test
    "boundary-delete-and-backspace-merge-contract-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let page_name = "boundary edit history" in
    let* () = Page.new_page env page_name in
    let* page_obj =
      Api.ls_api_call env "editor.getBlock" [| Json.string page_name |]
    in
    let page_uuid = Option.get (Api.get_string page_obj "uuid") in
    let cd = Api.obj [ ("content", Json.string "d") ] in
    let ef = Api.obj [ ("content", Json.string "f") ] in
    let* blocks =
      Api.ls_api_call env "editor.insertBatchBlock"
        [| Json.string page_uuid;
           Json.array
             [| Api.obj [ ("content", Json.string "b") ];
                Api.obj
                  [ ("content", Json.string "c");
                    ("children", Json.array [| cd |]) ];
                Api.obj
                  [ ("content", Json.string "e");
                    ("children", Json.array [| ef |]) ];
                Api.obj [ ("content", Json.string "g") ] |] |]
    in
    let at i = (Js.Json.decodeArray blocks |> Option.get).(i) in
    let right = at 1 in
    let leaf = at 5 in
    let initial =
      [ t "b" []; t "c" [ t "d" [] ]; t "e" [ t "f" [] ]; t "g" [] ]
    in
    let after_backspace =
      [ t "bc" [ t "d" [] ]; t "e" [ t "f" [] ]; t "g" [] ]
    in
    let after_enter =
      [ t "b" [ t "c" []; t "d" [] ]; t "e" [ t "f" [] ]; t "g" [] ]
    in
    let after_delete =
      [ t "b" [ t "c" []; t "d" [] ]; t "e" [ t "fg" [] ] ]
    in
    let assert_tree expected = wait_for_content_tree env expected in
    let* () =
      click_block_by_uuid env (Option.get (Api.get_string right "uuid"))
    in
    let* () = Util.wait_editor_visible env in
    let* _ = move_editor_cursor_to_start env in
    let* () = K.backspace env in
    let* () = assert_tree after_backspace in
    let* _ = Util.wait_edit_content env "bc" in
    let* (sel_start : int) =
      Pw.eval_js env
        "(() => document.querySelector('.editor-wrapper \
         textarea').selectionStart)()"
    in
    Fest.deep_equal sel_start 1 Fest.expect;
    let* () = undo_and_wait_for_content_tree env initial in
    let* () = redo_and_wait_for_content_tree env after_backspace in
    let* () = click_block_by_title env "bc" in
    let* () = Util.wait_editor_visible env in
    let* _ = move_editor_cursor_to env 1 in
    let* (state : Js.Json.t) =
      Pw.eval_js env
        "(() => {\n\
        \  const editor = document.activeElement;\n\
        \  return [editor.value, editor.selectionStart];\n\
        })();"
    in
    let got =
      match Js.Json.decodeArray state with
      | Some [| v; s |] ->
          ( Option.get (Js.Json.decodeString v),
            int_of_float (Option.get (Js.Json.decodeNumber s)) )
      | _ -> ("?", -1)
    in
    Fest.deep_equal got ("bc", 1) Fest.expect;
    let* () = K.enter env in
    let* () = Util.wait_timeout env 1000. in
    let* () = assert_tree after_enter in
    let* () = undo_and_wait_for_content_tree env after_backspace in
    let* () = redo_and_wait_for_content_tree env after_enter in
    let* () = click_block_by_title env "e" in
    let* () = Util.wait_editor_visible env in
    let* _ = move_editor_cursor_to_start env in
    let* () = K.backspace env in
    let* () = assert_tree after_enter in
    let* () = click_block_by_title env "d" in
    let* () = Util.wait_editor_visible env in
    let* _ = move_editor_cursor_to_end env in
    let* () = K.delete env in
    let* () = assert_tree after_enter in
    let* () = click_block_by_title env "f" in
    let* () = Util.wait_editor_visible env in
    let* _ = move_editor_cursor_to_end env in
    let* () = K.delete env in
    let* () = assert_tree after_delete in
    let* gone =
      Api.ls_api_call env "editor.getBlock"
        [| Json.string (Option.get (Api.get_string leaf "uuid")) |]
    in
    Fest.deep_equal
      (Js.Nullable.toOption gone |> Option.is_some)
      false Fest.expect;
    let* () = undo_and_wait_for_content_tree env after_enter in
    let* () = redo_and_wait_for_content_tree env after_delete in
    let* () = undo_and_wait_for_content_tree env after_enter in
    let* () = undo_and_wait_for_content_tree env after_backspace in
    let* () = undo_and_wait_for_content_tree env initial in
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test "drag-reorders-once-and-is-undoable-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* _ = Page.get_page_name env in
    let initial =
      [ t "drag first" []; t "drag second" []; t "drag third" [] ]
    in
    let reordered =
      [ t "drag third" []; t "drag first" []; t "drag second" [] ]
    in
    let* () =
      B.new_blocks env [ "drag first"; "drag second"; "drag third" ]
    in
    let* () = Util.exit_edit env in
    let* () = wait_for_content_tree env initial in
    (* a drop can miss the before-zone under load; the same drag is
       idempotent so retry until the tree reflects it *)
    let rec drag_until tries =
      let* () = drag_block env "drag third" "drag first" "before" in
      let* ok = content_tree_matches env reordered in
      if ok then Js.Promise.resolve ()
      else if tries <= 1 then wait_for_content_tree env reordered
      else drag_until (tries - 1)
    in
    let* () = drag_until 3 in
    (* let the drag's tx reach the undo stack before undoing — an early
       undo pops the previous op and the tree never returns to initial *)
    let* () = Util.wait_timeout env 500. in
    let* () = undo_and_wait_for_content_tree env initial in
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test "drag-indents-and-outdents-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let initial =
      [ t "drag parent" [];
        t "drag child candidate" [];
        t "drag tail" [] ]
    in
    let indented =
      [ t "drag parent" [ t "drag child candidate" [] ]; t "drag tail" [] ]
    in
    let outdented =
      [ t "drag parent" [];
        t "drag tail" [];
        t "drag child candidate" [] ]
    in
    let* () =
      B.new_blocks env [ "drag parent"; "drag child candidate"; "drag tail" ]
    in
    let* () = Util.exit_edit env in
    let* () = wait_for_content_tree env initial in
    let* () =
      drag_block env "drag child candidate" "drag parent" "inside"
    in
    let* () = wait_for_content_tree env indented in
    let* () =
      drag_block env "drag child candidate" "drag tail" "after"
    in
    let* () = wait_for_content_tree env outdented in
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test "drag-rejects-parent-into-descendant-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* page_name = Page.get_page_name env in
    let* () = B.new_blocks env [ "cycle parent"; "cycle child" ] in
    let* () = B.indent env in
    let* () = Util.exit_edit env in
    let* tree = block_tree env page_name in
    let before = content_tree tree in
    let* () = drag_block env "cycle parent" "cycle child" "inside" in
    let* tree = block_tree env page_name in
    Fest.deep_equal (trees_equal (content_tree tree) before) true Fest.expect;
    Fixtures.validate_graph env)

let () =
  if Util.is_main "test_outliner_basic.js" then
  Fest.Promise.test "undo-history-is-scoped-to-current-graph-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let graph_a = "undo-a-" ^ Util.random_uuid () in
    let graph_b = "undo-b-" ^ Util.random_uuid () in
    let* _ = Graph.new_graph env graph_a ~enable_sync:false () in
    let* () = Page.new_page env "undo graph a page" in
    let* () = B.new_block env "graph a history" in
    let* (graph_a_block_id : string Js.Nullable.t) =
      current_editing_block_id env
    in
    let graph_a_block_id = Option.get (Js.Nullable.toOption graph_a_block_id) in
    let* () =
      wait_for_block_content env graph_a_block_id "graph a history"
    in
    let* _ = Graph.new_graph env graph_b ~enable_sync:false () in
    let* () = Page.new_page env "undo graph b page" in
    let* () = B.new_block env "graph b history" in
    let* (graph_b_block_id : string Js.Nullable.t) =
      current_editing_block_id env
    in
    let graph_b_block_id = Option.get (Js.Nullable.toOption graph_b_block_id) in
    let* () =
      wait_for_block_content env graph_b_block_id "graph b history"
    in
    let* () = B.undo env in
    let* () = wait_for_block_content env graph_b_block_id "" in
    let* _ =
      Graph.switch_graph env graph_a ~wait_sync:false
        ~need_input_password:false
    in
    let* () =
      wait_for_block_content env graph_a_block_id "graph a history"
    in
    Fixtures.validate_graph env)
