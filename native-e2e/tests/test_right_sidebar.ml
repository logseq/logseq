open Yojson.Safe.Util

let create_page app name =
  ignore (Client.wait_for app ".ls-page-title .block-title-wrap");
  Client.press app "Mod+k";
  ignore (Client.wait_for app ".cp__cmdk-search-input");
  Client.fill app ".cp__cmdk-search-input" name;
  ignore (Client.wait_for ~text:name app
            "[data-cmdk-group-kind='create'] [data-cmdk-item]");
  Client.click ~text:name app
    "[data-cmdk-group-kind='create'] [data-cmdk-item]";
  ignore (Client.wait_for ~text:name app ".ls-page-title .block-title-wrap")

let validate_graph ctx app =
  let result = Client.validate app in
  Suite.equal ctx "Graph validation with fix=false has no errors"
    (Wire.get result "errors") (Some Wire.Nil);
  Suite.equal ctx "Graph validation has no invalid entity IDs"
    (Wire.get result "invalid-entity-ids") (Some (Wire.Array []))

let title app =
  List.hd (Client.wait_for app ".ls-page-title .block-title-wrap")
  |> Client.text_content

let open_sidebar app =
  Client.click app "#rs-toggle";
  ignore (Client.wait_for app ".cp__right-sidebar.open .item-type-contents")

let element app selector = List.hd (Client.wait_for app selector)

let tests =
  [ Suite.test
      ~covers:["ocaml-e2e/test/test_right_sidebar.ml::contents-open-as-page-navigates-to-contents"]
      "contents-open-as-page-navigates-to-contents" (fun ctx ->
        Suite.with_app ctx (fun app ->
            create_page app "Sidebar navigation source";
            let source_page = title app in
            open_sidebar app;
            Suite.check ctx "Contents sidebar item is visible"
              (Client.query app ".cp__right-sidebar.open .item-type-contents" <> []);
            Client.click app "#sbi-more-contents";
            ignore (Client.wait_for ~text:"Open as page" app "menuitem");
            Suite.check ctx "Contents menu offers Open as page"
              (Client.query app "menuitem" |> List.exists (fun el ->
                   Client.text_content el = "Open as page"));
            Client.click ~text:"Open as page" app "menuitem";
            ignore (Client.wait_for ~text:"Contents" app ".ls-page-title .block-title-wrap");
            Suite.equal ctx "Main page navigates to Contents" (title app) "Contents";
            Suite.check ctx "Main page changes from source" (title app <> source_page);
            let page = Client.sdk_call app "get_current_page" [] in
            let uuid = page |> member "uuid" |> to_string in
            Suite.equal ctx "Contents route resolves to the persisted page"
              (Client.q ~inputs:[Wire.Uuid uuid] app
                 "[:find ?title :in $ ?uuid :where [?p :block/uuid ?uuid] [?p :block/title ?title]]")
              (Wire.Set [Wire.Array [Wire.String "Contents"]]);
            validate_graph ctx app;
            ignore (Client.screenshot ~name:"contents-open-as-page.png" app)))
  ; Suite.test
      ~covers:["ocaml-e2e/test/test_right_sidebar.ml::right-sidebar-uses-only-content-scrollbar"]
      "right-sidebar-uses-only-content-scrollbar" (fun ctx ->
        Suite.with_app ctx (fun app ->
            create_page app "Sidebar scroll source";
            let blocks = List.init 48 (fun i ->
                `Assoc ["content", `String (Printf.sprintf "Sidebar scroll row %02d" i)]) in
            ignore (Client.sdk_call app "insert_batch_block"
                      [`String "Contents"; `List blocks]);
            let query = "[:find ?title :where [?p :block/title \"Contents\"] [?b :block/page ?p] [?b :block/title ?title]]" in
            ignore (Client.poll "long Contents fixture persisted" (fun () ->
                if List.length (Wire.elems (Client.q app query)) = 48 then Some () else None));
            Suite.equal ctx "Long sidebar content is persisted by production SDK"
              (List.length (Wire.elems (Client.q app query))) 48;
            open_sidebar app;
            let topbar = ".cp__right-sidebar-topbar" in
            let content = ".sidebar-item-list" in
            let first = ".cp__right-sidebar .ls-block[data-block-title^='Sidebar']" in
            let before_topbar = Client.rect (element app topbar) in
            let before_first = Client.rect (element app first) in
            let viewport = Client.rect (element app content) in
            let state = Client.status app in
            let height = state |> member "height" |> to_int |> float_of_int in
            let x = int_of_float (viewport.x +. viewport.width /. 2.) in
            let y = int_of_float (Float.min (height -. 60.) (before_topbar.y +. 160.)) in
            ignore (Client.screenshot ~name:"sidebar-before-scroll.png" app);
            Client.move app x y;
            Client.wheel app (-12);
            let after_first = Client.poll "sidebar content moves after wheel" (fun () ->
                let r = Client.rect (element app first) in
                if r.y < before_first.y -. 10. then Some r else None) in
            let after_topbar = Client.rect (element app topbar) in
            Yojson.Safe.to_file
              (Filename.concat (Client.artifacts app) "sidebar-scroll-metrics.json")
              (`Assoc ["topbar_before_y", `Float before_topbar.y;
                       "topbar_after_y", `Float after_topbar.y;
                       "content_before_y", `Float before_first.y;
                       "content_after_y", `Float after_first.y]);
            ignore (Client.screenshot ~name:"sidebar-after-scroll.png" app);
            Suite.check ctx "Wheel scrolls real sidebar content"
              (after_first.y < before_first.y -. 10.);
            Suite.check ctx "Topbar stays fixed while content scrolls"
              (Float.abs (after_topbar.y -. before_topbar.y) < 1.);
            Suite.check ctx "Outer sidebar wrapper is not a scroll owner"
              (element app ".cp__right-sidebar-scrollable" |> member "tag" |> to_string <> "scroll");
            Suite.equal ctx "Content list is the native scroll owner"
              (element app content |> member "tag" |> to_string) "scroll";
            validate_graph ctx app))
  ; Suite.test
      ~covers:["ocaml-e2e/test/test_right_sidebar.ml::same-block-updates-in-main-and-right-sidebar"]
      "same-block-updates-in-main-and-right-sidebar" (fun ctx ->
        Suite.with_app ctx (fun app ->
            create_page app "Sidebar live source";
            let page_name = title app in
            let initial_title = "sidebar live block before" in
            let updated_title = "sidebar live block after" in
            let property_name = "sidebar-live-property" in
            let initial_value = "sidebar property before" in
            let updated_value = "sidebar property after" in
            let block = Client.sdk_call app "append_block_in_page"
              [`String initial_title;
               `Assoc ["properties", `Assoc [property_name, `String initial_value]]] in
            let uuid = block |> member "uuid" |> to_string in
            let main_block = ".ls-page-blocks #ls-block-" ^ uuid in
            let sidebar_block = ".cp__right-sidebar #ls-block-" ^ uuid in
            ignore (Client.wait_for ~text:initial_title app
              (main_block ^ " .block-title-wrap"));
            ignore (Client.sdk_call app "open_in_right_sidebar" [`String uuid]);
            ignore (Client.wait_for app sidebar_block);
            let breadcrumbs = Client.wait_for ~text:page_name app
              ".cp__right-sidebar .sidebar-item-header .breadcrumb" in
            Suite.check ctx "Sidebar breadcrumb contains the current source page"
              (breadcrumbs <> []);
            Suite.equal ctx "One UUID has main and sidebar instances"
              (List.length (Client.query app ("#ls-block-" ^ uuid))) 2;
            ignore (Client.sdk_call app "update_block"
              [`String uuid; `String updated_title]);
            ignore (Client.sdk_call app "upsert_block_property"
              [`String uuid; `String property_name; `String updated_value]);
            List.iter (fun block_selector ->
              let title_elements = Client.wait_for ~text:updated_title app
                (block_selector ^ " .block-title-wrap") in
              Suite.check ctx "View renders the updated block title"
                (List.exists (fun el -> Client.text_content el = updated_title) title_elements);
              let property_elements = Client.wait_for ~text:property_name app
                (block_selector ^ " .property-k") in
              Suite.check ctx "View renders the property key"
                (List.exists (fun el -> Client.text_content el = property_name) property_elements);
              let value_elements = Client.wait_for ~text:updated_value app
                (block_selector ^ " .property-value-container") in
              Suite.check ctx "View renders the updated property value"
                (List.exists (fun el -> Client.text_content el = updated_value) value_elements))
              [main_block; sidebar_block];
            Suite.check ctx "Neither view retains the old title"
              (not (Client.query app ("#ls-block-" ^ uuid ^ " .block-title-wrap")
                |> List.exists (fun el -> Client.text_content el = initial_title)));
            Suite.equal ctx "Worker retains one block with the updated title"
              (Client.q ~inputs:[Wire.Uuid uuid] app
                "[:find ?title :in $ ?uuid :where [?b :block/uuid ?uuid] [?b :block/title ?title]]")
              (Wire.Set [Wire.Array [Wire.String updated_title]]);
            validate_graph ctx app;
            ignore (Client.screenshot ~name:"sidebar-live-block.png" app)))
  ]
