(** Port of rtc_basic_test.clj. *)

open Fest.Promise

let pages = Fixtures.shared_2_pages ()

let () =
  Fest.Promise.test "rtc-basic-test" (fun () ->
    let* env1, env2 = pages in
    let graph_name =
      Printf.sprintf "rtc-graph-%.0f-%04x"
        (Js.Date.getTime (Js.Date.make ()))
        (int_of_float (Js.Math.random () *. 65536.) land 0xffff)
    in
    let page_names =
      [ "rtc-test-page0"; "rtc-test-page1"; "rtc-test-page2"; "rtc-test-page3" ]
    in
    (* open 2 app instances, add a rtc graph, check this graph available on
       other instance *)
    let* _ =
      Js.Promise.all2
        (Util.login_test_account env1, Util.login_test_account env2)
    in
    (* remote graph refresh waits until the button is enabled *)
    let* () =
      let page = Env.page env2 in
      let* () = Graph.goto_all_graphs env2 in
      let* () =
        Pw.wait_for env2 ~timeout:30000.
          "button:not([disabled]):has-text(\"Refresh\")"
      in
      Playwright.set_default_timeout page 50.;
      let* _ =
        Pw.eval_js env2
          "(() => { const span = Array.from(document.querySelectorAll('span')) \
           .find((node) => node.textContent.trim() === 'Refresh'); const \
           button = span.closest('button'); button.disabled = true; \
           setTimeout(() => { button.disabled = false; }, 500); })()"
      in
      let* () =
        Js.Promise.catch
          (fun e ->
            Playwright.set_default_timeout page 10000.;
            Playwright.throw_error e)
          (Graph.refresh_all_remote_graphs env2)
      in
      Playwright.set_default_timeout page 10000.;
      Js.Promise.resolve ()
    in
    let* () =
      Graph.new_graph env1 graph_name ~enable_sync:true ~graph_e2ee:false ()
    in
    let* () =
      let* () = Graph.wait_for_remote_graph env2 graph_name in
      let* _v =
        Graph.switch_graph env2 graph_name ~wait_sync:true
          ~need_input_password:true
      in
      Js.Promise.resolve ()
    in
    (* logseq pages add/delete *)
    let rec add_pages = function
      | [] -> Js.Promise.resolve ()
      | page_name :: rest ->
          let* tx =
            Rtc.with_wait_tx_updated env1 (fun () ->
                Ls_page.new_page env1 page_name)
          in
          let* _ =
            Rtc.wait_tx_update_to env2
              (Option.value ~default:0 tx.Rtc.remote_tx)
          in
          let* () = Util.search_and_click env2 page_name in
          add_pages rest
    in
    let* () = add_pages page_names in
    let last_remote_tx = ref 0 in
    let rec del_pages = function
      | [] -> Js.Promise.resolve ()
      | page_name :: rest ->
          let* tx =
            Rtc.with_wait_tx_updated env1 (fun () ->
                Ls_page.delete_page env1 page_name)
          in
          last_remote_tx := Option.value ~default:0 tx.Rtc.remote_tx;
          del_pages rest
    in
    let* () = del_pages page_names in
    let* _ = Rtc.wait_tx_update_to env2 !last_remote_tx in
    let rec check_deleted = function
      | [] -> Js.Promise.resolve ()
      | page_name :: rest ->
          let* deleted_page =
            Api.ls_api_call env2 "editor.getPage" [| Api.str page_name |]
          in
          Fest.equal
            (Api.get_int deleted_page ":logseq.property/deleted-at" <> None)
            true Fest.expect;
          let parent = Js.Nullable.toOption (Api.get deleted_page "parent") in
          let parent_title =
            match parent with
            | Some p -> Api.get_string p "title"
            | None -> None
          in
          Fest.equal parent_title (Some "Recycle") Fest.expect;
          check_deleted rest
    in
    let* () = check_deleted page_names in
    (* Page reference created *)
    let* tx =
      Rtc.with_wait_tx_updated env1 (fun () ->
          Ls_page.new_page env1 "test-page-reference")
    in
    let* _ =
      Rtc.wait_tx_update_to env2 (Option.value ~default:0 tx.Rtc.remote_tx)
    in
    let test_page =
      Printf.sprintf "random page %.0f" (Js.Math.random () *. 1e12)
    in
    let block_title = Printf.sprintf "test ref [[%s]]" test_page in
    let* tx =
      Rtc.with_wait_tx_updated env1 (fun () ->
          let* () = Block.new_block env1 block_title in
          Block.new_block env1 "add new-block to ensure last block saved")
    in
    let* _ =
      Rtc.wait_tx_update_to env2 (Option.value ~default:0 tx.Rtc.remote_tx)
    in
    let* () = Util.search_and_click env2 test_page in
    let* () = Pw.wait_for env2 ".references .ls-block" in
    let* refs =
      Playwright.all_text_contents
        (Pw.q env2 ".references .ls-block .block-title-wrap")
    in
    Fest.deep_equal (Array.to_list refs) [ block_title ] Fest.expect;
    (* cleanup *)
    let* () = Graph.remove_remote_graph env2 graph_name in
    Rtc.validate_graphs_in_2_envs env1 env2)
