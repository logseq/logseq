let tests =
  [ Suite.test ~additional:true "native-semantic-locator-contract" (fun ctx ->
        Suite.with_app ctx (fun app ->
            let name = "Native Locator Contract, [quoted]" in
            let key = "create-" ^ name in
            let selector = "[data-cmdk-item][data-item-key='" ^ key ^ "']" in
            Client.press app "Mod+k";
            ignore (Client.wait_for app ".cp__cmdk-search-input");
            Client.fill app ".cp__cmdk-search-input" name;
            ignore (Client.poll "Retained candidate has the exact semantic item key"
                      (fun () -> if Client.snapshot app |> List.exists
                          (fun el -> Client.attr el "data-item-key" = Some key)
                        then Some () else None));
            Suite.check ctx "Quoted attribute delimiters resolve one intended native row"
              (List.length (Client.query app selector) = 1);
            Client.click app selector;
            ignore (Client.wait_for ~text:name app ".ls-page-title .block-title-wrap");
            Suite.check ctx "Semantic click opened exactly the intended page"
              (Client.query app ".ls-page-title .block-title-wrap" |> List.exists
                 (fun el -> Client.text_content el = name));
            ignore (Client.screenshot app ~name:"locator-created.png"))) ]
