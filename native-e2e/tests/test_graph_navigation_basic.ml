let command app label =
  Client.press app "Mod+k";
  ignore (Client.wait_for app ".cp__cmdk-search-input");
  Client.fill app ".cp__cmdk-search-input" label;
  Client.click ~text:label app "[data-cmdk-group-kind='commands'] [data-cmdk-item]"

let create_page app title =
  ignore (Client.wait_for app ".ls-page-title .block-title-wrap");
  Client.press app "Mod+k";
  ignore (Client.wait_for app ".cp__cmdk-search-input");
  Client.fill app ".cp__cmdk-search-input" title;
  ignore (Client.wait_for ~text:title app "[data-cmdk-group-kind='create'] [data-cmdk-item]");
  Client.click ~text:title app
    "[data-cmdk-group-kind='create'] [data-cmdk-item]";
  ignore (Client.wait_for ~text:title app ".ls-page-title .block-title-wrap")

let validate_graph ctx app =
  let result = Client.validate app in
  Suite.equal ctx "Graph validation with fix=false has no errors"
    (Wire.get result "errors") (Some Wire.Nil);
  Suite.equal ctx "Graph validation has no invalid entity IDs"
    (Wire.get result "invalid-entity-ids") (Some (Wire.Array []))

let tests =
  [ Suite.test
      ~covers:["ocaml-e2e/test/test_graph_navigation_basic.ml::graph-refresh-and-browser-history-test"]
      "graph-refresh-and-browser-history-test" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let create_block page_name content =
              create_page app page_name;
              Client.click app ".block-add-button";
              ignore (Client.wait_for app ".block-editor");
              Client.text app content;
              Client.press app "Escape";
              let query =
                "[:find ?title :in $ ?page :where [?p :block/title ?page] [?b :block/page ?p] [?b :block/title ?title]]"
              in
              ignore (Client.poll "exact page content saved by real worker" (fun () ->
                  let titles = Client.q ~inputs:[Wire.String page_name] app query in
                  if titles = Wire.Set [Wire.Array [Wire.String content]] then Some ()
                  else None))
            in
            let page_a = "graph history a" in
            let page_b = "graph history b" in
            create_block page_a "history a content";
            create_block page_b "history b content";
            command app "Backwards";
            ignore (Client.wait_for ~text:page_a app ".ls-page-title .block-title-wrap");
            ignore (Client.wait_for ~text:"history a content" app
              ".ls-page-blocks .block-title-wrap");
            Suite.equal ctx "History back returns to the original page"
              (Client.text_content (List.hd (Client.query app ".ls-page-title .block-title-wrap")))
              page_a;
            command app "Forwards";
            ignore (Client.wait_for ~text:page_b app ".ls-page-title .block-title-wrap");
            ignore (Client.wait_for ~text:"history b content" app
              ".ls-page-blocks .block-title-wrap");
            let worker, _, _ = Client.daemon app in
            Client.reload app;
            let worker_after_reload, _, _ = Client.daemon app in
            Suite.equal ctx "Reload retains the real daemon" worker_after_reload worker;
            ignore (Client.wait_for ~text:page_b app ".ls-page-title .block-title-wrap");
            Suite.equal ctx "Reload retains the current page"
              (Client.text_content (List.hd (Client.query app ".ls-page-title .block-title-wrap")))
              page_b;
            ignore (Client.wait_for ~text:"history b content" app
              ".ls-page-blocks .block-title-wrap");
            Suite.equal ctx "Reload preserves the persisted page block"
              (Client.q ~inputs:[Wire.String page_b] app
                 "[:find ?title :in $ ?page :where [?p :block/title ?page] [?b :block/page ?p] [?b :block/title ?title]]")
              (Wire.Set [Wire.Array [Wire.String "history b content"]]);
            validate_graph ctx app;
            ignore (Client.screenshot ~name:"graph-history-and-refresh.png" app)))
  ; Suite.test
      ~covers:["ocaml-e2e/test/test_graph_navigation_basic.ml::restoring-graph-gates-and-recovers-interaction-test"]
      "restoring-graph-gates-and-recovers-interaction-test" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let page = "restore interaction page" in
            let content = "restore interaction target" in
            let query =
              "[:find ?title :in $ ?page :where [?p :block/title ?page] [?b :block/page ?p] [?b :block/title ?title]]"
            in
            create_page app page;
            Client.click app ".block-add-button";
            ignore (Client.wait_for app ".block-editor");
            Client.text app content;
            Client.press app "Escape";
            ignore (Client.poll "restore fixture saved" (fun () ->
                if Client.q ~inputs:[Wire.String page] app query =
                   Wire.Set [Wire.Array [Wire.String content]]
                then Some () else None));
            Client.reload app;
            let visible selector =
              Client.query app selector |> List.filter (fun el ->
                  let rect = Client.rect el in
                  rect.width > 0. && rect.height > 0.)
            in
            let loading = Client.poll "restoring gate or restored page" (fun () ->
                let loading = visible ".loading-graph" @ visible ".ui__loading" in
                if loading <> [] || visible ".ls-page-title .block-title-wrap" <> []
                then Some loading else None)
            in
            if loading <> [] then
              Suite.check ctx "Loading graph gates block creation"
                (List.for_all (fun el -> Client.attr el "disabled" = Some "true")
                   (visible ".block-add-button"));
            ignore (Client.wait_for ~text:page app ".ls-page-title .block-title-wrap");
            ignore (Client.wait_for app ".toolbar-dots-btn");
            Client.click app ".toolbar-dots-btn";
            ignore (Client.wait_for app ".ls-dots-menu menuitem");
            Suite.check ctx "Restored toolbar opens its actual menu"
              (Client.query app ".ls-dots-menu menuitem" <> []);
            Client.press app "Escape";
            ignore (Client.poll "toolbar menu dismissed" (fun () ->
                if Client.query app ".ls-dots-menu menuitem" = [] then Some () else None));
            Client.click ~text:content app ".ls-page-blocks .block-title-wrap";
            ignore (Client.wait_for app ".block-editor");
            Client.press app "End";
            Client.text app " after restore";
            let expected = content ^ " after restore" in
            ignore (Client.poll "edited restored block" (fun () ->
                if Client.sdk_call app "get_editing_block_content" [] = `String expected
                then Some () else None));
            Suite.equal ctx "Restored block accepts exact appended content"
              (Client.sdk_call app "get_editing_block_content" []) (`String expected);
            Client.press app "Escape";
            ignore (Client.poll "restored edit persisted" (fun () ->
                if Client.q ~inputs:[Wire.String page] app query =
                   Wire.Set [Wire.Array [Wire.String expected]]
                then Some () else None));
            Suite.equal ctx "Worker stores exact post-restore edit"
              (Client.q ~inputs:[Wire.String page] app query)
              (Wire.Set [Wire.Array [Wire.String expected]]);
            validate_graph ctx app;
            ignore (Client.screenshot ~name:"graph-restored-interaction.png" app)))
  ]
