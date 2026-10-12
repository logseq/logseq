let tests =
  [ Suite.test ~additional:true "native-boot-create-edit-persist-smoke" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let name = "Native Harness Smoke" in
            Suite.check ctx "Real daemon is ready" (let _, _, repo = Client.daemon app in repo = "logseq_db_Demo");
            Client.press app "Mod+k";
            ignore (Client.wait_for app ".cp__cmdk-search-input");
            Client.fill app ".cp__cmdk-search-input" name;
            ignore (Client.wait_for ~text:name app ".cp__cmdk-search-input");
            ignore (Client.wait_for ~text:"Create" app ".cp__cmdk-item-main-text text");
            Client.click app "[data-cmdk-item]";
            ignore (Client.wait_for ~text:name app ".ls-page-title .block-title-wrap");
            Suite.check ctx "Page opened through native Cmd+K" (Client.query app ".ls-page-title .block-title-wrap" |> List.exists (fun el -> Client.text_content el = name));
            Client.click app ".block-add-button";
            ignore (Client.wait_for app ".block-editor");
            let content = "Native persisted editor block 中文" in
            Client.text app content;
            ignore (Client.poll "native editor text" (fun () -> if Client.query app ".ls-page-blocks .ls-block" |> List.exists (fun el -> Client.attr el "data-block-title" = Some content) then Some () else None));
            Client.press app "Escape";
            let query = "[:find ?title :where [?b :block/title ?title] [?b :block/page ?p] [?p :block/title \"Native Harness Smoke\"]]" in
            let expected = Wire.Set [Wire.Array [Wire.String content]] in
            ignore (Client.poll "persisted block via real daemon" (fun () -> if Client.q app query = expected then Some () else None));
            Suite.equal ctx "Exact edited text persisted" (Client.q app query) expected;
            ignore (Client.screenshot app ~name:"edited.png");
            let pid, _, _ = Client.daemon app in
            Client.restart app ();
            let new_pid, _, _ = Client.daemon app in
            Suite.check ctx "Daemon restarted rather than reused" (new_pid <> pid);
            Suite.equal ctx "Exact text survives full host and daemon restart" (Client.q app query) expected;
            Client.press app "Mod+k";
            ignore (Client.wait_for app ".cp__cmdk-search-input");
            Client.fill app ".cp__cmdk-search-input" name;
            ignore (Client.wait_for ~text:name app ".cp__cmdk-item-main-text");
            Client.click ~text:name app ".cp__cmdk-item-main-text";
            ignore (Client.wait_for ~text:content app ".ls-page-blocks .block-title-wrap");
            Suite.check ctx "Persisted content renders after restart" (Client.query app ".ls-page-blocks .block-title-wrap" |> List.exists (fun el -> Client.text_content el = content));
            ignore (Client.screenshot app ~name:"persisted.png"))) ]
