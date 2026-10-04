(** Port of multi_tabs_basic_test.clj. *)

open Fest.Promise

let ctx_browser = Fixtures.shared_new_context

let env_cell = ref None

(** A single env whose [page] is swapped across the shared context's tabs —
    mirrors clj's [w/with-page]. *)
let env_of first_page =
  match !env_cell with
  | Some e -> e
  | None ->
      let e = Env.make first_page in
      env_cell := Some e;
      e

let add_blocks_and_check_on_other_tabs env new_blocks add_tab check_tabs =
  let* () =
    Env.with_page env add_tab (fun () -> Block.new_blocks env new_blocks)
  in
  let rec go = function
    | [] -> Js.Promise.resolve ()
    | p :: rest ->
        let* () =
          Env.with_page env p (fun () ->
              Block.assert_blocks_visible env new_blocks)
        in
        go rest
  in
  go check_tabs

let () =
  Fest.Promise.test "multi-tabs-test" (fun () ->
    let* context, _browser = ctx_browser () in
    let* _ = Fixtures.open_pages context 3 in
    let pages = Array.to_list (Fixtures.context_pages context) in
    match pages with
    | [ p1; p2; p3 ] ->
        let env = env_of p1 in
        let blocks_to_add = List.init 10 (fun i -> "b" ^ string_of_int i) in
        let* () =
          add_blocks_and_check_on_other_tabs env blocks_to_add p1 [ p2; p3 ]
        in
        let switch_to_graph_then_edit_and_check graph_name =
          let* _g2 =
            Env.with_page env p2 (fun () ->
                let* () = Util.goto_journals env in
                let* _ok = E2e_assert.in_normal_mode env in
                Graph.switch_graph env graph_name ~wait_sync:false
                  ~need_input_password:false)
          in
          let* _g3 =
            Env.with_page env p3 (fun () ->
                let* () = Util.goto_journals env in
                let* _ok = E2e_assert.in_normal_mode env in
                Graph.switch_graph env graph_name ~wait_sync:false
                  ~need_input_password:false)
          in
          let* _g1 =
            Env.with_page env p1 (fun () ->
                let* () = Util.goto_journals env in
                let* _ok = E2e_assert.in_normal_mode env in
                Graph.switch_graph env graph_name ~wait_sync:false
                  ~need_input_password:false)
          in
          let graph_new_blocks =
            List.init 5 (fun i ->
                graph_name ^ "-b1-" ^ string_of_int i)
          in
          add_blocks_and_check_on_other_tabs env graph_new_blocks p1 [ p2; p3 ]
        in
        let* () =
          Env.with_page env p1 (fun () ->
              let* () = Graph.new_graph env "graph1" ~enable_sync:false () in
              let* () = Graph.new_graph env "graph2" ~enable_sync:false () in
              Graph.new_graph env "graph3" ~enable_sync:false ())
        in
        let* () =
          Env.with_page env p2 (fun () ->
              let* _ = Util.refresh_until_graph_loaded env in
              Js.Promise.resolve ())
        in
        let* () =
          Env.with_page env p3 (fun () ->
              let* _ = Util.refresh_until_graph_loaded env in
              Js.Promise.resolve ())
        in
        let* () = switch_to_graph_then_edit_and_check "graph1" in
        let* () = switch_to_graph_then_edit_and_check "graph2" in
        switch_to_graph_then_edit_and_check "graph3"
    | _ ->
        Js.Promise.reject
          (Failure "multi-tabs: expected exactly 3 pages"))
