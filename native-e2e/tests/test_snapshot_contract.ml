open Yojson.Safe.Util

let open_page app page =
  Client.press app "Mod+k";
  ignore (Client.wait_for app ".cp__cmdk-search-input");
  Client.fill app ".cp__cmdk-search-input" page;
  Client.click app ("[data-cmdk-item][data-item-key='create-" ^ page ^ "']");
  ignore (Client.wait_for ~text:page app ".ls-page-title .block-title-wrap")

let tests =
  [ Suite.test ~additional:true "native-rendered-placeholder-contract" (fun ctx ->
        Suite.with_app ctx (fun app ->
            open_page app "Native Property Snapshot";
            Client.click app ".block-add-button";
            ignore (Client.wait_for app ".block-editor");
            Client.text app "Property snapshot target";
            Client.press app "Mod+p";
            ignore (Client.wait_for app ".ls-property-dialog");
            let inside_dialog el =
              el |> member "ancestors" |> to_list |> List.exists (fun ancestor ->
                  ancestor |> member "class" |> to_string |> String.split_on_char ' '
                  |> List.mem "ls-property-dialog") in
            let input = Client.poll "Real property-picker Text_field" (fun () ->
                Client.query app "input" |> List.find_opt inside_dialog) in
            Suite.equal ctx "Rendered picker placeholder is preserved exactly"
              (Client.attr input "placeholder") (Some "Add or change property");
            Suite.check ctx "Placeholder selector resolves the actual rendered input"
              (Client.query app "input[placeholder='Add or change property']"
               |> List.exists (fun el -> member "node-id" el = member "node-id" input))));
    Suite.test ~additional:true "native-rendered-heading-contract" (fun ctx ->
        Suite.with_app ctx (fun app ->
            open_page app "Native Heading Snapshot";
            Client.click app ".block-add-button";
            ignore (Client.wait_for app ".block-editor");
            Client.text app "## Snapshot heading text";
            Client.press app "Escape";
            let heading = Client.poll "Real rendered level-two heading" (fun () ->
                Client.query app "heading" |> List.find_opt (fun el ->
                    Client.text_content el = "Snapshot heading text")) in
            Suite.equal ctx "Actual HeadingLevel is available as typed metadata"
              (member "heading-level" heading) (`Int 2);
            Suite.equal ctx "Explicit source As value is retained"
              (member "as" heading) (`String "h2");
            Suite.equal ctx "Native heading remains a native kind, not fake HTML"
              (member "tag" heading) (`String "heading"))) ]
