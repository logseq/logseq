open Yojson.Safe.Util

let command app label =
  Client.press app "Mod+k";
  ignore (Client.wait_for app ".cp__cmdk-search-input");
  Client.fill app ".cp__cmdk-search-input" label;
  Client.click ~text:label app
    "[data-cmdk-group-kind='commands'] [data-cmdk-item]"

let current_repo app =
  Client.sdk_call app "get_current_graph" [] |> member "url" |> to_string

let assert_blocks ctx app contents =
  ignore (Client.poll "other native host receives all journal block changes"
    (fun () ->
      let visible = Client.query app ".ls-page-blocks .block-title-wrap"
        |> List.map Client.text_content in
      if List.for_all (fun content -> List.mem content visible) contents
      then Some () else None));
  let visible = Client.query app ".ls-page-blocks .block-title-wrap"
    |> List.map Client.text_content in
  Suite.check ctx "All expected blocks are rendered without a spectator reload"
    (List.for_all (fun content -> List.mem content visible) contents);
  let actual =
    Client.q ~repo:(current_repo app) app
      "[:find ?title :where [?p :block/journal-day] [?b :block/page ?p] [?b :block/title ?title]]"
    |> Wire.elems
    |> List.map (function
      | Wire.Array [Wire.String title] -> title
      | _ -> failwith "Invalid journal block title query result")
    |> List.sort String.compare
  in
  Suite.equal ctx "Selected graph's journal contents match the real worker"
    actual (List.sort String.compare contents)

let add_blocks app contents =
  List.iter (fun content ->
    Client.click app ".ls-page-blocks .block-add-button";
    ignore (Client.wait_for app ".block-editor");
    Client.text app content;
    Client.press app "Escape";
    ignore (Client.wait_for ~text:content app
      ".ls-page-blocks .block-title-wrap")) contents

let graph_loaded ctx app name =
  let repo = "logseq_db_" ^ name in
  ignore (Client.poll "expected graph is selected" (fun () ->
    if current_repo app = repo then Some () else None));
  ignore (Client.wait_for app ".ls-page-title .block-title-wrap");
  let _, _, actual = Client.daemon ~repo app in
  Suite.equal ctx "Window attaches to the selected graph's real worker"
    actual repo

let create_graph ctx app name =
  command app "Add a DB graph";
  Client.fill app ".new-graph input" name;
  Client.click ~text:"Submit" app ".new-graph button";
  graph_loaded ctx app name

let switch_graph ctx app name =
  command app "Go to journals";
  ignore (Client.wait_for app "#journals");
  Suite.equal ctx "Window is in normal mode before switching"
    (Client.query app ".block-editor") [];
  command app "Go to all graphs";
  Client.click app ("[aria-label='logseq/graphs/" ^ name ^ "']");
  graph_loaded ctx app name

let tests =
  [ Suite.test
      ~covers:["ocaml-e2e/test/test_multi_tabs.ml::multi-tabs-test"]
      "multi-tabs-test" (fun ctx ->
        Suite.with_app ctx (fun first ->
          Suite.with_app ~root:(Client.root first) ctx (fun second ->
            Suite.with_app ~root:(Client.root first) ctx (fun third ->
              let apps = [first; second; third] in
              let pids = List.map (fun app ->
                Client.status app |> member "pid" |> to_int) apps in
              Suite.equal ctx "Exactly three distinct native host processes"
                (List.length (List.sort_uniq Int.compare pids)) 3;
              let workers = List.map (fun app ->
                let pid, _, _ = Client.daemon ~repo:"logseq_db_Demo" app in pid) apps in
              let worker = List.hd workers in
              Suite.equal ctx "All three hosts share one real graph worker"
                workers [worker; worker; worker];
              let initial = List.init 10 (fun i -> "b" ^ string_of_int i) in
              add_blocks first initial;
              List.iter (fun app -> assert_blocks ctx app initial) [second; third];
              List.iter (create_graph ctx first) ["graph1"; "graph2"; "graph3"];
              Client.reload second;
              Client.reload third;
              List.iter (fun name ->
                List.iter (fun app -> switch_graph ctx app name)
                  [second; third; first];
                let contents = List.init 5 (fun i ->
                  name ^ "-b1-" ^ string_of_int i) in
                add_blocks first contents;
                List.iter (fun app -> assert_blocks ctx app contents)
                  [second; third];
                Test_right_sidebar.validate_graph ctx first)
                ["graph1"; "graph2"; "graph3"];
              ignore (Client.screenshot ~name:"multi-window-shared-graph.png" third)))))
  ]
