open Fest.Promise

let wait env predicate =
  let* _ = Playwright.wait_for_function (Env.page env) predicate in
  Js.Promise.resolve ()

let text env selector expected =
  Playwright.expect_to_have_text
    (Playwright.expect (Pw.q env selector)) expected [%mel.obj { timeout = 5000. }]

let uuid block = Option.get (Api.get_string block "uuid")

let visit env page =
  let* () = Pw.eval_js_arg env "uuid => { location.hash = '#/page/' + uuid; }" (uuid page) in
  text env "[data-testid='page title'] .block-title-wrap"
    (Option.get (Api.get_string page "title"))

let create_page env prefix =
  let name = prefix ^ "-" ^ Util.random_uuid () in
  let* page = Api.ls_api_call env "editor.createPage" [| Api.str name |] in
  let* () = visit env page in
  Js.Promise.resolve page

let append env page content =
  Api.ls_api_call env "editor.appendBlockInPage"
    [| Api.str (uuid page); Api.str content |]

let edit env block =
  let* () = Pw.click env ("#block-content-" ^ uuid block) in
  wait env
    (Printf.sprintf
       "() => document.activeElement?.matches('.ed-input[data-block-id=\"%s\"]')"
       (uuid block))

let open_settings_editor env =
  let* () = Pw.click env "#toolbar-dots-btn" in
  let* () = Pw.click_l (Pw.get_by_role env "menuitem" ~name:"Settings") in
  let* () = Pw.click env ".settings-menu-item[data-id='editor']" in
  Pw.wait_for_l (Pw.q env "#settings .lui-select:not([disabled])")

let t name body =
  Fest.Promise.test name (fun () ->
      Fixtures.with_page_open (fun env ->
          let* _ = E2e_assert.graph_loaded env in
          body env))

let () =
  t "typed-block-command-preserves-source-test" (fun env ->
      let rec commands = function
        | [] -> Js.Promise.resolve ()
        | command :: rest ->
            let* page = create_page env "typed-command" in
            let* source = append env page "alpha beta" in
            let* () = edit env source in
            let* () = Pw.press env "End" in
            let* () = Playwright.press_sequentially (Pw.q env ".ed-input") (" /" ^ command) in
            let* () = Pw.click env "#ui__ac-inner .menu-link.chosen" in
            let* _ = Pw.wait_for env "[data-node-type='code']" in
            let* original = Api.ls_api_call env "editor.getBlock" [| Api.str (uuid source) |] in
            let* inserted = Api.ls_api_call env "editor.getNextSiblingBlock" [| Api.str (uuid source) |] in
            Fest.equal (Api.get_string original "content") (Some "alpha beta") Fest.expect;
            Fest.equal (Api.get_string inserted "content") (Some "") Fest.expect;
            let parent_id block = Option.get (Api.get_int (Api.get_raw block "parent") "id") in
            Fest.equal (parent_id inserted) (parent_id original) Fest.expect;
            Fest.equal (parent_id inserted) (Option.get (Api.get_int page "id")) Fest.expect;
            Fest.equal (Api.get_string inserted ":logseq.property.node/display-type") (Some "code") Fest.expect;
            let* () = Pw.press env "Escape" in
            commands rest
      in
      commands [ "code block"; "calculator" ]);

  t "move-across-parents-keeps-selection-test" (fun env ->
      let* page = create_page env "move-selection" in
      let block ?(children = [||]) content =
        Api.obj [ "content", Api.str content; "children", Api.arr children ]
      in
      let* blocks = Api.ls_api_call env "editor.insertBatchBlock"
          [| Api.str (uuid page);
             Api.arr [| block "parent-a" ~children:[| block "item" |];
                        block "parent-b"; block "parent-c";
                        block "parent-d" ~children:[| block "tail" |] |] |] in
      let find title = Array.find_opt (fun b -> Api.get_string b "content" = Some title) blocks |> Option.get in
      let item = find "item" and parent = find "parent-d" in
      let* () = edit env item in
      let* () = Pw.press env "Escape" in
      let chord = (if Config.mac then "Meta" else "Alt") ^ "+Shift+ArrowDown" in
      let* () = Pw.press_all env [ chord; chord; chord ] in
      let* _ = Pw.wait_for env (Printf.sprintf "#ls-block-%s #ls-block-%s" (uuid parent) (uuid item)) in
      let* () = Pw.press env "Shift+ArrowDown" in
      let* () = wait env
          "async () => (await logseq.api.get_selected_blocks()).map(b => b.content).join('|') === 'item|tail'" in
      let* selected = Api.ls_api_call env "editor.getSelectedBlocks" [||] in
      Fest.deep_equal (Array.to_list (Array.map (fun b -> Api.get_string b "content") selected))
        [ Some "item"; Some "tail" ] Fest.expect;
      Js.Promise.resolve ());

  t "page-self-mentions-are-excluded-from-references" (fun env ->
      let* page = create_page env "self-ref-page" in
      let name = Option.get (Api.get_string page "title") in
      let* _ = append env page ("self-linked-mention-block [[" ^ name ^ "]]") in
      let* _ = append env page ("self-unlinked-mention-block " ^ name) in
      let* () = visit env page in
      let* () = E2e_assert.have_count_l (Ls_locator.filter env ".references" ~has_text:"self-linked-mention-block") 0 in
      let* () = E2e_assert.have_count_l (Ls_locator.filter env ".unlinked-references" ~has_text:"self-unlinked-mention-block") 0 in
      let* other = create_page env "self-ref-other" in
      let* _ = append env other ("other-linked-mention-block [[" ^ name ^ "]]") in
      let* _ = append env other ("other-unlinked-mention-block " ^ name) in
      let* () = visit env page in
      let* () = E2e_assert.is_visible_l (Ls_locator.filter env ".references" ~has_text:"other-linked-mention-block") in
      let* () = E2e_assert.is_visible_l (Ls_locator.filter env ".references" ~has_text:(Option.get (Api.get_string other "title"))) in
      let* () = E2e_assert.have_count_l (Ls_locator.filter env ".references" ~has_text:"self-linked-mention-block") 0 in
      let* () = Pw.click env ".unlinked-references .ls-foldable-title-control" in
      let* () = E2e_assert.is_visible_l (Ls_locator.filter env ".unlinked-references" ~has_text:"other-unlinked-mention-block") in
      let* () = E2e_assert.is_visible_l (Ls_locator.filter env ".unlinked-references" ~has_text:(Option.get (Api.get_string other "title"))) in
      E2e_assert.have_count_l (Ls_locator.filter env ".unlinked-references" ~has_text:"self-unlinked-mention-block") 0);

  t "tagged-page-show-hidden-when-all-tag-props-hide-empty-test" (fun env ->
      let* page = create_page env "hidden-tag-properties" in
      let property_name = "hide-empty-" ^ Util.random_uuid () in
      let* property = Api.ls_api_call env "editor.upsertProperty"
          [| Api.str property_name; Api.obj [ "type", Api.str "default" ] |] in
      let* _ = Api.ls_api_call env "editor.upsertBlockProperty"
          [| Api.str (uuid property); Api.str "logseq.property/hide-empty-value"; Api.bool true |] in
      let* tag = Api.ls_api_call env "editor.createTag"
          [| Api.str ("Hidden Tag " ^ Util.random_uuid ());
             Api.obj [ "tagProperties", Api.arr [| Api.obj [ "name", Api.str property_name ] |] ] |] in
      let* _ = Api.ls_api_call env "editor.upsertBlockProperty"
          [| Api.str (uuid page); Api.str "block/tags"; Api.num (float_of_int (Option.get (Api.get_int tag "id"))) |] in
      let* () = visit env page in
      let row = Ls_locator.filter env ".ls-page-properties .property-pair" ~has_text:property_name in
      let toggle = Ls_locator.filter env ".hidden-properties-toggle-key" ~has_text:"Show hidden properties" in
      let* () = E2e_assert.have_count_l row 0 in
      let* () = E2e_assert.is_visible_l toggle in
      let* () = Pw.click_l toggle in
      E2e_assert.is_visible_l row);

  t "preferred-date-format-survives-reload-test" (fun env ->
      let* _ = create_page env "journal-format" in
      let preferred = "yyyy-MM-dd" in
      let format_query = Api.str "[:find ?format . :where [?journal :db/ident :logseq.class/Journal] [?journal :logseq.property.journal/title-format ?format]]" in
      let* original = Api.ls_api_call env "datascript_query" [| format_query |] in
      Fest.equal (original <> preferred) true Fest.expect;
      let* () = open_settings_editor env in
      let* () = Pw.click env "#settings .lui-select" in
      let* () = Pw.click_l (Playwright.locator_get_by_text ~exact:true (Pw.q env ".ls-select-content") preferred) in
      let* _ = E2e_assert.is_visible env ".lui-toast:has-text('Please refresh the app')" in
      let* () = Pw.wait_for_hidden_l (Pw.q env "#settings") in
      let* saved = Api.ls_api_call env "datascript_query" [| format_query |] in
      Fest.equal saved preferred Fest.expect;
      let* _ = Pw.refresh env in
      let* _ = E2e_assert.graph_loaded env in
      let* persisted = Api.ls_api_call env "datascript_query" [| format_query |] in
      Fest.equal persisted preferred Fest.expect;
      let* () = open_settings_editor env in
      let* () = text env "#settings .lui-select" preferred in
      let* () = Pw.click_l (Pw.get_by_role env "button" ~name:"Close") in
      let* journal = Api.ls_api_call env "editor.createJournalPage" [| Api.str "2026-01-15" |] in
      let* () = visit env journal in
      text env "[data-testid='page title'] .block-title-wrap" "2026-01-15")
