(** Port of rtc_extra_test.clj. *)

open Fest.Promise

module B = Block
module Page = Ls_page
module K = Keyboard
module Assert = E2e_assert
module Loc = Ls_locator
module Rtc = Rtc

let pages = Fixtures.shared_2_pages ()

(** :once fixture — like [prepare-rtc-graph-fixture] but the graph stays for
    the whole file; removal happens in the [after] hook. *)
let ready : (Env.t * Env.t) Js.Promise.t Lazy.t =
  lazy
    (let* env1, env2 = pages in
     let graph_name = "rtc-extra-test-graph-" ^ Fixtures.inst_string () in
     let* _ =
       Js.Promise.all2
         ( Env.with_page env1 (Env.page env1) (fun () ->
               let* _ = Settings.developer_mode env1 in
               let* _ = Settings.refresh_test_env env1 in
               Util.login_test_account env1)
         , Env.with_page env2 (Env.page env2) (fun () ->
               let* _ = Settings.developer_mode env2 in
               let* _ = Settings.refresh_test_env env2 in
               Util.login_test_account env2) )
     in
     let* () =
       let* () =
         Env.with_page env1 (Env.page env1) (fun () ->
             Graph.new_graph env1 graph_name ~enable_sync:true
               ~graph_e2ee:false ())
       in
       Env.with_page env2 (Env.page env2) (fun () ->
           let* () = Graph.wait_for_remote_graph env2 graph_name in
           let* _ =
             Graph.switch_graph env2 graph_name ~wait_sync:true
               ~need_input_password:true
           in
           Js.Promise.resolve ())
     in
     (* browsers may already be closed when this hook runs (after-hooks are
        FIFO and the shared pages' close is registered first): removing the
        remote graph is best-effort teardown *)
     Fixtures.after (fun () ->
         Js.Promise.catch
           (fun e ->
             ignore e;
             Js.Promise.resolve ())
           (Env.with_page env2 (Env.page env2) (fun () ->
                let* _ = Graph.remove_remote_graph env2 graph_name in
                Js.Promise.resolve ())));
     Js.Promise.resolve (env1, env2))

(* :each fixture *)
let new_rtc_page env page1 page2 = Fixtures.new_logseq_page_in_rtc env page1 page2 ()

(* - rtc stop on [stop_pages] in order
   - run [body]
   - rtc start and exec after-body in order *)
let with_stop_restart_rtc env stop_pages afters body =
  let rec stop = function
    | [] -> Js.Promise.resolve ()
    | p :: rest ->
        let* () = Env.with_page env p (fun () -> Rtc.rtc_stop env) in
        stop rest
  in
  let rec run_afters = function
    | [] -> Js.Promise.resolve ()
    | (p, after) :: rest ->
        let* () =
          Env.with_page env p (fun () ->
              let* () = Rtc.rtc_start env in
              after ())
        in
        run_afters rest
  in
  let* () = stop stop_pages in
  let* () = body () in
  run_afters afters

let status_icon_names =
  [ ("Backlog", "Backlog"); ("Todo", "Todo"); ("Doing", "InProgress50");
    ("In review", "InReview"); ("Done", "Done"); ("Canceled", "Cancelled") ]

let priorities = [ "No priority"; "Low"; "Medium"; "High"; "Urgent" ]

let validate_task_blocks env page1 page2 =
  let* icon_counts =
    Env.with_page env page2 (fun () ->
        let rec collect = function
          | [] -> Js.Promise.resolve []
          | (_, icon) :: rest ->
              let* n =
                Playwright.count (Pw.q env (".ls-icon-" ^ icon))
              in
              let* rest' = collect rest in
              Js.Promise.resolve ((icon, n) :: rest')
        in
        collect status_icon_names)
  in
  Env.with_page env page1 (fun () ->
      let rec check = function
        | [] -> Js.Promise.resolve ()
        | (icon, n) :: rest ->
            let* () = Assert.have_count env (".ls-icon-" ^ icon) n in
            check rest
      in
      check icon_counts)

let rec iter_seq f = function
  | [] -> Js.Promise.resolve ()
  | x :: rest ->
      let* () = f x in
      iter_seq f rest

let insert_task_blocks env title_prefix =
  iter_seq
    (fun (status, _) ->
      iter_seq
        (fun priority ->
          let* () =
            B.new_block env
              (Printf.sprintf "%s-%s-%s" title_prefix status priority)
          in
          let* () = Util.input_command env status in
          Util.input_command env priority)
        priorities)
    status_icon_names

let rand_nth l =
  let i = int_of_float (Js.Math.random () *. float_of_int (List.length l)) in
  List.nth l (min i (List.length l - 1))

let update_task_blocks env =
  let* blocks =
    Playwright.locator_all
      (Loc.filter env ~has:(Pw.q env ".ui__icon") ".ls-block")
  in
  let arr = Array.to_list blocks in
  (* process in partitions of 5 like clj *)
  let rec chunks = function
    | [] -> []
    | l ->
        let rec take n = function
          | [] -> ([], [])
          | x :: tl when n > 0 ->
              let a, b = take (n - 1) tl in
              (x :: a, b)
          | rest -> ([], rest)
        in
        let c, rest = take 5 l in
        c :: chunks rest
  in
  iter_seq
    (fun chunk ->
      iter_seq
        (fun q ->
          let* () = Pw.click_l q in
          let* () = Util.input_command env (rand_nth (List.map fst status_icon_names)) in
          Util.input_command env (rand_nth priorities))
        chunk)
    (chunks arr)

let validate_2 env p1 p2 = Rtc.validate_graphs_in_2_pages env p1 p2

let () =
  if Util.is_main "test_rtc_extra.js" then
  Fest.Promise.test "rtc-task-blocks-test" (fun () ->
    let* env1, env2 = Lazy.force ready in
    let env = env1 in
    let p1 = Env.page env1 in
    let p2 = Env.page env2 in
    let* () = new_rtc_page env1 p1 p2 in
    let insert_task_blocks_in_page2 latest =
      Env.with_page env p2 (fun () ->
          let* tx =
            Rtc.with_wait_tx_updated env (fun () ->
                insert_task_blocks env "t1")
          in
          latest := Option.value ~default:0 tx.Rtc.remote_tx;
          Util.exit_edit env)
    in
    let update_task_blocks_in_page2 latest =
      Env.with_page env p2 (fun () ->
          let* tx =
            Rtc.with_wait_tx_updated env (fun () ->
                update_task_blocks env)
          in
          latest := Option.value ~default:0 tx.Rtc.remote_tx;
          Js.Promise.resolve ())
    in
    (* add some task blocks while rtc disconnected on page1 *)
    let latest = ref 0 in
    let* () =
      with_stop_restart_rtc env [ p1 ]
        [ ( p1
          , fun () ->
              let* _ = Rtc.wait_tx_update_to env !latest in
              Js.Promise.resolve () ) ]
        (fun () -> insert_task_blocks_in_page2 latest)
    in
    let* () = validate_task_blocks env p1 p2 in
    let* () = validate_2 env p1 p2 in
    (* update task blocks while rtc disconnected on page1 *)
    let* () =
      with_stop_restart_rtc env [ p1 ]
        [ ( p1
          , fun () ->
              let* _ = Rtc.wait_tx_update_to env !latest in
              Js.Promise.resolve () ) ]
        (fun () -> update_task_blocks_in_page2 latest)
    in
    let* () = validate_task_blocks env p1 p2 in
    let* () = validate_2 env p1 p2 in

    let* _ = new_rtc_page env1 p1 p2 in
    (* perform same operations on page2 while keeping rtc connected *)
    let* () = insert_task_blocks_in_page2 latest in
    let* () =
      Env.with_page env p1 (fun () ->
          let* _ = Rtc.wait_tx_update_to env !latest in
          Js.Promise.resolve ())
    in
    let* () = validate_task_blocks env p1 p2 in
    let* () = validate_2 env p1 p2 in
    (* update task blocks while rtc connected *)
    let* () = update_task_blocks_in_page2 latest in
    let* () =
      Env.with_page env p1 (fun () ->
          let* _ = Rtc.wait_tx_update_to env !latest in
          Js.Promise.resolve ())
    in
    let* () = validate_task_blocks env p1 p2 in
    validate_2 env p1 p2)

let () =
  if Util.is_main "test_rtc_extra.js" then
  Fest.Promise.test "rtc-property-test" (fun () ->
    let* env1, env2 = Lazy.force ready in
    let env = env1 in
    let p1 = Env.page env1 in
    let p2 = Env.page env2 in
    let* () = new_rtc_page env1 p1 p2 in
    let insert_new_property_blocks_in_page2 latest title_prefix =
      Env.with_page env p2 (fun () ->
          let* tx =
            Rtc.with_wait_tx_updated env (fun () ->
                Test_property_basic.add_new_properties env title_prefix)
          in
          latest := Option.value ~default:0 tx.Rtc.remote_tx;
          Js.Promise.resolve ())
    in
    let latest = ref 0 in
    (* add different types user properties on page2 while rtc disconnected *)
    let* () =
      with_stop_restart_rtc env [ p1 ]
        [ ( p1
          , fun () ->
              let* _ = Rtc.wait_tx_update_to env !latest in
              Js.Promise.resolve () ) ]
        (fun () ->
          insert_new_property_blocks_in_page2 latest
            "rtc-property-test-1")
    in
    let* () = validate_2 env p1 p2 in
    let* _ = new_rtc_page env1 p1 p2 in
    (* same while rtc connected *)
    let* () =
      insert_new_property_blocks_in_page2 latest "rtc-property-test-2"
    in
    let* () =
      Env.with_page env p1 (fun () ->
          let* _ = Rtc.wait_tx_update_to env !latest in
          Js.Promise.resolve ())
    in
    validate_2 env p1 p2)

let () =
  if Util.is_main "test_rtc_extra.js" then
  Fest.Promise.test "rtc-property-update-rerenders-mounted-block" (fun () ->
    let* env1, env2 = Lazy.force ready in
    let env = env1 in
    let p1 = Env.page env1 in
    let p2 = Env.page env2 in
    let* () = new_rtc_page env1 p1 p2 in
    let title = "rtc live property block" in
    let property_name = "rtc-live-property" in
    let property_value = "rtc remote property value" in
    let block_uuid = ref "" in
    let* tx =
      Env.with_page env p1 (fun () ->
          Rtc.with_wait_tx_updated env (fun () ->
              let* block =
                Api.ls_api_call env "editor.appendBlockInPage"
                  [| Api.str title |]
              in
              block_uuid :=
                Option.value ~default:"" (Api.get_string block "uuid");
              Js.Promise.resolve ()))
    in
    let* () =
      Env.with_page env p2 (fun () ->
          let* _ =
            Rtc.wait_tx_update_to env
              (Option.value ~default:0 tx.Rtc.remote_tx)
          in
          Pw.wait_for env
            (Printf.sprintf "#ls-block-%s .block-title-wrap:text('%s')"
               !block_uuid title))
    in
    let* tx =
      Env.with_page env p2 (fun () ->
          Rtc.with_wait_tx_updated env (fun () ->
              let* _ =
                Api.ls_api_call env "editor.upsertBlockProperty"
                  [| Api.str !block_uuid; Api.str property_name;
                     Api.str property_value |]
              in
              Js.Promise.resolve ()))
    in
    let* () =
      Env.with_page env p1 (fun () ->
          let* _ =
            Rtc.wait_tx_update_to env
              (Option.value ~default:0 tx.Rtc.remote_tx)
          in
          let* () =
            Pw.wait_for env
              (Printf.sprintf "#ls-block-%s .property-k:text('%s')"
                 !block_uuid property_name)
          in
          Assert.is_visible_l
            (Pw.q env
               (Printf.sprintf "#ls-block-%s .property-value :text('%s')"
                  !block_uuid property_value)))
    in
    validate_2 env p1 p2)

let () =
  if Util.is_main "test_rtc_extra.js" then
  Fest.Promise.test "rtc-outliner-test" (fun () ->
    let* env1, env2 = Lazy.force ready in
    let env = env1 in
    let p1 = Env.page env1 in
    let p2 = Env.page env2 in
    iter_seq
      (fun test_fn ->
        let test_fn_in_page2 latest =
          Env.with_page env p2 (fun () ->
              let* tx =
                Rtc.with_wait_tx_updated env (fun () -> test_fn env)
              in
              latest := Option.value ~default:0 tx.Rtc.remote_tx;
              Js.Promise.resolve ())
        in
        let latest = ref 0 in
        let* _ = new_rtc_page env1 p1 p2 in
        let* () =
          with_stop_restart_rtc env [ p1 ]
            [ ( p1
              , fun () ->
                  let* _ = Rtc.wait_tx_update_to env !latest in
                  Js.Promise.resolve () ) ]
            (fun () -> test_fn_in_page2 latest)
        in
        validate_2 env p1 p2)
      [ Test_outliner_basic.create_test_page_and_insert_blocks
      ; Test_outliner_basic.indent_and_outdent
      ; Test_outliner_basic.move_up_down
      ; Test_outliner_basic.delete_blocks_scenario
      ; Test_outliner_basic.delete_test_with_children ])

let () =
  if Util.is_main "test_rtc_extra.js" then
  Fest.Promise.test "rtc-outliner-conflict-update-test" (fun () ->
    let* env1, env2 = Lazy.force ready in
    let env = env1 in
    let p1 = Env.page env1 in
    let p2 = Env.page env2 in
    let* () = new_rtc_page env1 p1 p2 in
    let title_prefix = "rtc-outliner-conflict-update-test" in
    let title i = Printf.sprintf "%s-%d" title_prefix i in
    (* add some blocks, ensure them synced *)
    let latest = ref 0 in
    let* () =
      Env.with_page env p1 (fun () ->
          let* tx =
            Rtc.with_wait_tx_updated env (fun () ->
                B.new_blocks env
                  (List.init 10 (fun i -> title i)))
          in
          latest := Option.value ~default:0 tx.Rtc.remote_tx;
          Js.Promise.resolve ())
    in
    let* () =
      Env.with_page env p2 (fun () ->
          let* _ = Rtc.wait_tx_update_to env !latest in
          Js.Promise.resolve ())
    in
    let* () = validate_2 env p1 p2 in
    (* page1: indent block1 as child of block0, page2: delete block0 *)
    let* () =
      with_stop_restart_rtc env [ p1; p2 ]
        [ ( p1
          , fun () ->
              let* _ =
                Rtc.with_wait_tx_updated env (fun () ->
                    let* () = K.esc env in
                    let* _ = Assert.in_normal_mode env in
                    B.new_block env "page1-done-1")
              in
              Js.Promise.resolve () )
        ; ( p2
          , fun () ->
              let* _ =
                Rtc.with_wait_tx_updated env (fun () ->
                    let* () = K.esc env in
                    let* _ = Assert.in_normal_mode env in
                    B.new_block env "page2-done-1")
              in
              Js.Promise.resolve () ) ]
        (fun () ->
          let* () =
            Env.with_page env p1 (fun () ->
                let* () =
                  Pw.click env
                    (Printf.sprintf ".ls-block :text('%s')" (title 1))
                in
                B.indent env)
          in
          Env.with_page env p2 (fun () ->
              let* () =
                Pw.click env
                  (Printf.sprintf ".ls-block :text('%s')" (title 0))
              in
              B.delete_blocks env))
    in
    let* () = validate_2 env p1 p2 in
    (* conflict update: indent chain vs delete *)
    let* () =
      with_stop_restart_rtc env [ p1; p2 ]
        [ ( p1
          , fun () ->
              let* _ =
                Rtc.with_wait_tx_updated env (fun () ->
                    B.new_block env "page1-done-2")
              in
              Js.Promise.resolve () )
        ; ( p2
          , fun () ->
              let* _ =
                Rtc.with_wait_tx_updated env (fun () ->
                    B.new_block env "page2-done-2")
              in
              Js.Promise.resolve () ) ]
        (fun () ->
          let* () =
            Env.with_page env p1 (fun () ->
                let* () =
                  Pw.click env
                    (Printf.sprintf ".ls-block :text('%s')" (title 3))
                in
                let* () = B.indent env in
                let* () = K.arrow_down env in
                let* () = B.indent env in
                B.indent env)
          in
          Env.with_page env p2 (fun () ->
              let* () =
                Pw.click env
                  (Printf.sprintf ".ls-block :text('%s')" (title 2))
              in
              let* () = B.delete_blocks env in
              let* () =
                Pw.click env
                  (Printf.sprintf ".ls-block :text('%s')" (title 3))
              in
              let* () = K.shift_arrow_down env in
              let* () = K.meta_shift_arrow_down env in
              let* () = Keyboard.enter_in_editor env in
              B.indent env))
    in
    validate_2 env p1 p2)

let () =
  if Util.is_main "test_rtc_extra.js" then
  Fest.Promise.test "rtc-page-test" (fun () ->
    let* env1, env2 = Lazy.force ready in
    let env = env1 in
    let p1 = Env.page env1 in
    let p2 = Env.page env2 in
    let* () = new_rtc_page env1 p1 p2 in
    let prefix = "rtc-page-test-" in
    (* create same name page in different clients while offline *)
    let* () =
      with_stop_restart_rtc env [ p1; p2 ]
        [ ( p1
          , fun () ->
              let* _ =
                Rtc.with_wait_tx_updated env (fun () ->
                    B.new_block env "pw1-done-1")
              in
              Js.Promise.resolve () )
        ; ( p2
          , fun () ->
              let* _ =
                Rtc.with_wait_tx_updated env (fun () ->
                    B.new_block env "pw2-done-1")
              in
              Js.Promise.resolve () ) ]
        (fun () ->
          let* () =
            Env.with_page env p1 (fun () ->
                Page.new_page env (prefix ^ "1"))
          in
          Env.with_page env p2 (fun () ->
              Page.new_page env (prefix ^ "1")))
    in
    let* () = validate_2 env p1 p2 in
    (* client1 adds blocks on page-2, client2 deletes page-2 *)
    let page_name = prefix ^ "2" in
    let latest = ref 0 in
    let* () =
      Env.with_page env p1 (fun () ->
          let* tx =
            Rtc.with_wait_tx_updated env (fun () ->
                Page.new_page env page_name)
          in
          latest := Option.value ~default:0 tx.Rtc.remote_tx;
          Js.Promise.resolve ())
    in
    let* () =
      Env.with_page env p2 (fun () ->
          let* _ = Rtc.wait_tx_update_to env !latest in
          Js.Promise.resolve ())
    in
    let* () = validate_2 env p1 p2 in
    let* () =
      with_stop_restart_rtc env [ p1; p2 ]
        [ ( p1
          , fun () ->
              let* _ =
                Rtc.with_wait_tx_updated env (fun () ->
                    B.new_block env "pw1-done-2")
              in
              Js.Promise.resolve () )
        ; ( p2
          , fun () ->
              let* _ =
                Rtc.with_wait_tx_updated env (fun () ->
                    B.new_block env "pw2-done-2")
              in
              Js.Promise.resolve () ) ]
        (fun () ->
          let* () =
            Env.with_page env p1 (fun () ->
                B.new_blocks env (List.init 5 (fun i -> "block-" ^ string_of_int i)))
          in
          Env.with_page env p2 (fun () -> Page.delete_page env page_name))
    in
    let* () = validate_2 env p1 p2 in
    (* page rename *)
    let page_name = prefix ^ "3" in
    let* _ =
      Fixtures.new_logseq_page_in_rtc env p1 p2 ~name:page_name ()
    in
    let* () = validate_2 env p1 p2 in
    let* () =
      with_stop_restart_rtc env [ p1; p2 ]
        [ ( p1
          , fun () ->
              let* _ =
                Rtc.with_wait_tx_updated env (fun () ->
                    B.new_block env "pw1-done-3")
              in
              Js.Promise.resolve () )
        ; ( p2
          , fun () ->
              let* _ =
                Rtc.with_wait_tx_updated env (fun () ->
                    B.new_block env "pw2-done-3")
              in
              Js.Promise.resolve () ) ]
        (fun () ->
          let* () =
            Env.with_page env p1 (fun () ->
                Page.rename_page env page_name (page_name ^ "-rename1"))
          in
          Env.with_page env p2 (fun () ->
              Page.rename_page env page_name (page_name ^ "-rename2")))
    in
    validate_2 env p1 p2)

let () =
  if Util.is_main "test_rtc_extra.js" then
  Fest.Promise.test "long-block-title-test" (fun () ->
    let* env1, env2 = Lazy.force ready in
    let env = env1 in
    let p1 = Env.page env1 in
    let p2 = Env.page env2 in
    let* () = new_rtc_page env1 p1 p2 in
    let long_block_title = String.make 5000 'a' in
    let* tx =
      Env.with_page env p1 (fun () ->
          Rtc.with_wait_tx_updated env (fun () ->
              let* () = B.new_block env "" in
              B.save_block env long_block_title))
    in
    let* () =
      Env.with_page env p2 (fun () ->
          let* _ =
            Rtc.wait_tx_update_to env
              (Option.value ~default:0 tx.Rtc.remote_tx)
          in
          Js.Promise.resolve ())
    in
    let* () = validate_2 env p1 p2 in
    Env.with_page env p2 (fun () ->
        Assert.is_visible_l
          (Loc.filter env ~has_text:long_block_title
             ".block-title-wrap")))
