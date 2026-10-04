(** Port of graph_navigation_basic_test.clj. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

external random_uuid : unit -> string = "randomUUID"
  [@@mel.scope "crypto"]

let uuid = random_uuid

let has_text env text sel =
  Ls_locator.filter env ~has_text:text sel

let () =
  Fest.Promise.test "graph-empty-state-and-name-validation-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let graph_name = "sample-valid-graph-" ^ uuid () in
    let* () = Graph.goto_all_graphs env in
    let* _ =
      E2e_assert.is_visible_l (has_text env "Create a new graph" "#main-content-container")
    in
    let* () = Util.search_and_click env "Add a DB graph" in
    let input = Pw.q env "input[placeholder='your graph name']" in
    let* () = Pw.fill_l input "" in
    let* () = Pw.click env "button:text('Submit')" in
    let* _ = E2e_assert.is_visible env ".new-graph" in
    let rec try_invalid = function
      | [] -> Js.Promise.resolve ()
      | invalid_name :: rest ->
          let* () = Pw.fill_l input invalid_name in
          let* () = Pw.click env "button:text('Submit')" in
          let* _ =
            E2e_assert.is_visible env
              ".ui__toast.warning:has-text(\"Graph name can't contain\")"
          in
          let* () =
            Pw.click_l (Playwright.locator_last (Pw.q env ".ui__toast.warning button"))
          in
          try_invalid rest
    in
    let* () = try_invalid [ "bad/name"; "bad\\name" ] in
    let* () = Pw.fill_l input graph_name in
    let* () = Pw.click env "button:text('Submit')" in
    let* _ = E2e_assert.graph_loaded env in
    let* () = Graph.goto_all_graphs env in
    let* () = Util.search_and_click env "Add a DB graph" in
    let* () = Pw.fill env "input[placeholder='your graph name']" graph_name in
    let* () = Pw.click env "button:text('Submit')" in
    let* _ =
      E2e_assert.is_visible env ".ui__toast.error:has-text('already exists')"
    in
    let* () = Keyboard.esc env in
    let* _v =
      Graph.switch_graph env graph_name ~wait_sync:false
        ~need_input_password:false
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "graph-refresh-and-browser-history-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let page_a = "graph history a" in
    let page_b = "graph history b" in
    let* () = Ls_page.new_page env page_a in
    let* () = Block.new_block env "history a content" in
    let* () = Util.exit_edit env in
    let* () = Ls_page.new_page env page_b in
    let* () = Block.new_block env "history b content" in
    let* () = Util.exit_edit env in
    let* _ = Pw.go_back env in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env "history a content" "#main-content-container")
    in
    let* _ = Pw.go_forward env in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env "history b content" "#main-content-container")
    in
    let* _ = Util.refresh_until_graph_loaded env in
    let* name = Ls_page.get_page_name env in
    Fest.equal name page_b Fest.expect;
    let* _ =
      E2e_assert.is_visible_l
        (has_text env "history b content" "#main-content-container")
    in
    Fixtures.validate_graph env)

let graph_base_and_id env =
  let current_url = Pw.url env in
  let base =
    (* [?#].*$ — strip at the earliest of '?' or '#'; a bare '?' inside the
       hash (e.g. ?graph-id=) must not truncate the base. *)
    let cut =
      List.fold_left
        (fun acc c ->
          match String.index_opt current_url c with
          | Some i -> (match acc with None -> Some i | Some j -> Some (min i j))
          | None -> acc)
        None [ '?'; '#' ]
    in
    let b =
      match cut with
      | Some i -> String.sub current_url 0 i
      | None -> current_url
    in
    if String.length b > 0 && b.[String.length b - 1] = '/' then
      String.sub b 0 (String.length b - 1)
    else b
  in
  let graph_id =
    let re = Js.Re.fromString "[?&]graph-id=([^&]+)" in
    match Js.Re.exec ~str:current_url re with
    | Some r ->
        (match Js.Re.captures r with
         | [| _; id |] -> Js.Nullable.toOption id
         | _ -> None)
    | None -> None
  in
  (base, graph_id)

let () =
  Fest.Promise.test "direct-page-and-block-route-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let suffix = uuid () in
    let page_name = "direct-route-page-" ^ suffix in
    let block_content = "direct route block " ^ suffix in
    let* () = Ls_page.new_page env page_name in
    let* () = Block.new_block env block_content in
    let* container = Util.get_edit_block_container env in
    let* block_uuid = Playwright.get_attribute container "blockid" in
    let block_uuid = Option.value ~default:"" block_uuid in
    let* () = Util.exit_edit env in
    let* _ = Util.refresh_until_graph_loaded env in
    let* page =
      Api.ls_api_call env "editor.getPage" [| Api.str page_name |]
    in
    let page_uuid = Option.value ~default:"" (Api.get_uuid page ()) in
    let* block =
      Api.ls_api_call env "editor.getBlock" [| Api.str block_uuid |]
    in
    Fest.equal (Api.get_string block "content") (Some block_content)
      Fest.expect;
    Fest.equal (block_uuid <> "") true Fest.expect;
    let base, graph_id = graph_base_and_id env in
    let graph_id = Option.value ~default:"" graph_id in
    Fest.equal (graph_id <> "") true Fest.expect;
    let direct_url kind u =
      Printf.sprintf "%s/#/%s/%s?graph-id=%s" base kind u graph_id
    in
    let navigate_direct url =
      let* _ = Pw.navigate env "about:blank" in
      Pw.navigate env url
    in
    let* _ = navigate_direct (direct_url "page" page_uuid) in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env page_name "[data-testid='page title']")
    in
    let* name = Ls_page.get_page_name env in
    Fest.equal name page_name Fest.expect;
    let* _ =
      E2e_assert.is_visible_l
        (has_text env block_content "#main-content-container")
    in
    let* block' =
      Api.ls_api_call env "editor.getBlock" [| Api.str block_uuid |]
    in
    Fest.equal (Api.get_string block' "content") (Some block_content)
      Fest.expect;
    let* _ = navigate_direct (direct_url "block" block_uuid) in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env block_content "#main-content-container")
    in
    let* _ = navigate_direct (direct_url "page" (uuid ())) in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env "Page not found" "#main-content-container")
    in
    let* () = Util.goto_journals env in
    let* _ = E2e_assert.is_visible env "#journals" in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "local-graph-delete-and-list-metadata-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let graph_name = "graph-delete-" ^ uuid () in
    let* _ =
      Graph.new_graph env graph_name ~enable_sync:false ~graph_e2ee:false ()
    in
    let* () = Ls_page.new_page env "local graph deletion page" in
    let* () = Block.new_block env "local graph deletion content" in
    let* () = Graph.goto_all_graphs env in
    let card =
      Pw.q env (Printf.sprintf "div[data-testid='logseq_db_%s']" graph_name)
    in
    let* _ = E2e_assert.is_visible_l card in
    let* _ =
      E2e_assert.is_visible_l
        (Playwright.locator_filter card ~has_text:"Last opened at:")
    in
    let* () =
      Pw.click_l (Playwright.locator_locator card ".graph-action-btn")
    in
    let* () = Pw.click env ".delete-local-graph-menu-item" in
    let* () =
      Pw.click env "div[role='alertdialog'] button:text('Confirm')"
    in
    let* () = E2e_assert.have_count_l card 0 in
    let* () =
      E2e_assert.have_count_l
        (has_text env "local graph deletion content" "#main-content-container")
        0
    in
    let* _v =
      Graph.switch_graph env "Demo" ~wait_sync:false
        ~need_input_password:false
    in
    let* () = Ls_page.new_page env "post deletion validation" in
    let* () = Util.exit_edit env in
    let* _ = Util.refresh_until_graph_loaded env in
    let* _ = E2e_assert.is_visible env "#search-button" in
    Fixtures.validate_graph env)

let set_default_home env page_name =
  let arg =
    Api.obj
      [ ( "default-home",
          match page_name with
          | Some p -> Api.obj [ ("page", Api.str p) ]
          | None -> Api.obj [] ) ]
  in
  let* _ =
    Api.ls_api_call env "app.setCurrentGraphConfigs" [| arg |]
  in
  let rec loop remaining =
    let* stored_page =
      Api.ls_api_call env "app.getCurrentGraphConfigs"
        [| Api.str "default-home"; Api.str "page" |]
    in
    let stored = Js.Nullable.toOption stored_page in
    if stored = page_name then Js.Promise.resolve ()
    else if remaining <= 0 then
      Js.Promise.reject
        (Failure
           (Printf.sprintf
              "Default home config did not persist: expected=%s actual=%s"
              (Option.value ~default:"<nil>" page_name)
              (Option.value ~default:"<nil>" stored)))
    else
      let* () = Util.wait_timeout env 250. in
      loop (remaining - 1)
  in
  loop 40

let () =
  Fest.Promise.test "default-home-route-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Ls_page.new_page env "sample default home" in
    let* () = Block.new_block env "default home content" in
    let* () = Util.exit_edit env in
    let base, graph_id = graph_base_and_id env in
    let graph_id = Option.value ~default:"" graph_id in
    Fest.equal (graph_id <> "") true Fest.expect;
    let home_url = Printf.sprintf "%s/#/?graph-id=%s" base graph_id in
    let navigate_home () =
      let* _ = Pw.navigate env "about:blank" in
      Pw.navigate env home_url
    in
    let* () = set_default_home env (Some "sample default home") in
    let* _ = navigate_home () in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env "sample default home" "[data-testid='page title']")
    in
    let* name = Ls_page.get_page_name env in
    Fest.equal name "sample default home" Fest.expect;
    let* () = set_default_home env (Some "missing sample home") in
    let* _ = navigate_home () in
    let* _ = E2e_assert.is_visible env "#journals" in
    let* _ = E2e_assert.is_hidden env ".loading-graph" in
    let* () = set_default_home env None in
    let* () = Ls_page.new_page env "post default home validation" in
    let* () = Util.exit_edit env in
    let* _ = Util.refresh_until_graph_loaded env in
    let* _ = E2e_assert.is_visible env "#search-button" in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "graph-view-mode-settings-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let rec seed = function
      | [] -> Js.Promise.resolve ()
      | title :: rest ->
          let* () = Ls_page.new_page env title in
          let* () = Block.new_block env "[[graph view alpha]]" in
          let* () = Util.set_tag env title in
          let* () = Util.exit_edit env in
          seed rest
    in
    let* () =
      seed [ "graph view alpha"; "graph view beta"; "graph view gamma" ]
    in
    let* () = Util.search_and_click env "Go to graph view" in
    let* _ = E2e_assert.is_visible env "#global-graph.graph-root" in
    let* _ =
      E2e_assert.is_visible env
        "[role='application'][aria-label='Graph canvas']"
    in
    let* () = Pw.click env ".graph-settings-toggle" in
    let* () =
      Pw.click_l (has_text env "Tags" ".graph-mode-tab")
    in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env "Tags" ".graph-mode-tab[aria-selected='true']")
    in
    let* () =
      Pw.click_l (has_text env "All pages" ".graph-mode-tab")
    in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env "All pages" ".graph-mode-tab[aria-selected='true']")
    in
    let* _ = Pw.refresh env in
    let* _ = E2e_assert.is_visible env "#global-graph.graph-root" in
    let* _ =
      E2e_assert.is_visible env
        "[role='application'][aria-label='Graph canvas']"
    in
    let* _ = E2e_assert.is_hidden env ".graph-error" in
    let* () = Ls_page.goto_page env "graph view beta" in
    let* _ = E2e_assert.graph_loaded env in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "graph-time-travel-playback-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Ls_page.new_page env "time travel old" in
    let* () = Util.wait_timeout env 20. in
    let* () = Ls_page.new_page env "time travel new" in
    let* () = Util.search_and_click env "Go to graph view" in
    let* () =
      Pw.click env "button[title*='Time'], button:has-text('Time travel')"
    in
    let slider = Pw.q env "input[type='range']" in
    let* _ = E2e_assert.is_visible_l slider in
    let* full_count = Util.count_elements env ".graph-node, [data-node-id]" in
    let* () = Pw.click_l slider in
    let* () = Keyboard.press env "Home" in
    let* count = Util.count_elements env ".graph-node, [data-node-id]" in
    Fest.equal (count <= full_count) true Fest.expect;
    let* () = Pw.click env ".graph-time-travel-reset[title='Now']" in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env "Now" ".graph-time-travel-label")
    in
    let* count' = Util.count_elements env ".graph-node, [data-node-id]" in
    Fest.equal count' full_count Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "restoring-graph-gates-and-recovers-interaction-test"
    (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Block.new_block env "restore interaction target" in
    let* () = Util.exit_edit env in
    let* _ = Pw.refresh env in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.or_ env ".loading-graph, .ui__loading"
           "[data-testid='page title']")
    in
    let* loading = Pw.visible env ".loading-graph, .ui__loading" in
    let* () =
      if loading then
        let* add_visible = Pw.visible env ".block-add-button" in
        let* disabled =
          if add_visible then
            Pw.eval_js env
              "document.querySelector('.block-add-button').disabled"
          else Js.Promise.resolve true
        in
        Fest.equal ((not add_visible) || disabled) true Fest.expect;
        Js.Promise.resolve ()
      else Js.Promise.resolve ()
    in
    let* _ = E2e_assert.graph_loaded env in
    let* _ = E2e_assert.is_visible env ".toolbar-dots-btn" in
    let* () = Pw.click env ".toolbar-dots-btn" in
    let* _ = E2e_assert.is_visible env "[role='menuitem']" in
    let* () = Keyboard.esc env in
    let* () = Block.jump_to_block env "restore interaction target" in
    let* () = Util.move_cursor_to_end env in
    let* () = Util.press_seq env " after restore" in
    let* content = Util.get_edit_content env in
    Fest.equal content (Some "restore interaction target after restore")
      Fest.expect;
    Fixtures.validate_graph env)
