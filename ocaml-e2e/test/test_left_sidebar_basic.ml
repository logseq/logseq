(** Port of left_sidebar_basic_test.clj. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

let open_navigation_filter env =
  let* open_ = Pw.visible env "#left-sidebar.is-open" in
  let* () = if not open_ then Pw.click env "#left-menu" else Js.Promise.resolve () in
  let* () = Pw.hover_l (Pw.q env ".sidebar-header-container .sidebar-content-group .hd") in
  Pw.click env ".sidebar-header-container .as-edit"

let set_navigation env ~label ~checked =
  let* () = open_navigation_filter env in
  let item =
    Pw.q env
      (Printf.sprintf "[role='menuitemcheckbox']:text-is('%s')" label)
  in
  let* aria = Pw.attr_l item "aria-checked" in
  let* () =
    if aria <> Some (string_of_bool checked) then Pw.click_l item
    else Js.Promise.resolve ()
  in
  Keyboard.esc env

let assert_class_navigations env =
  let pairs = [ ("tasks", "Task"); ("assets", "Asset") ] in
  let rec go = function
    | [] -> Js.Promise.resolve ()
    | (nav, title) :: rest ->
        let selector = ".sidebar-navigations ." ^ nav in
        let* _ = E2e_assert.is_visible env selector in
        let* () = E2e_assert.have_count env selector 1 in
        let* () = Pw.click env selector in
        (* the click routes async; poll the title instead of reading once —
           clj's JVM latency covered the gap *)
        let deadline = Js.Date.now () +. 8000. in
        let rec wait_name () =
          let* name = Ls_page.get_page_name env in
          if name = title || Js.Date.now () > deadline then
            Js.Promise.resolve name
          else
            let* () = Util.wait_timeout env 150. in
            wait_name ()
        in
        let* name = wait_name () in
        Fest.equal name title Fest.expect;
        go rest
  in
  go pairs

let () =
  Fest.Promise.test
    "selected-class-navigations-survive-graph-lifecycle-test" (fun () ->
    let* env = env in
    (* :each new-logseq-page *)
    let* () = Fixtures.new_logseq_page env in
    let* () = set_navigation env ~label:"Tasks" ~checked:true in
    let* () = set_navigation env ~label:"Assets" ~checked:true in
    let* () = assert_class_navigations env in
    let* () =
      let rec go = function
        | [] -> Js.Promise.resolve ()
        | (label, nav) :: rest ->
            let* () = set_navigation env ~label ~checked:false in
            let* () =
              E2e_assert.have_count env (".sidebar-navigations ." ^ nav) 0
            in
            let* () = set_navigation env ~label ~checked:true in
            let* _ =
              E2e_assert.is_visible env (".sidebar-navigations ." ^ nav)
            in
            go rest
      in
      go [ ("Tasks", "tasks"); ("Assets", "assets") ]
    in
    let* _ = Util.refresh_until_graph_loaded env in
    let* () = assert_class_navigations env in
    let* () =
      Graph.new_graph env
        ("sidebar-navigation-" ^ Js.String.make (Js.Date.now ()))
        ~enable_sync:false ()
    in
    let* () = assert_class_navigations env in
    let* _ =
      Graph.switch_graph env "Demo" ~wait_sync:false ~need_input_password:false
    in
    let* () = assert_class_navigations env in
    let* () = set_navigation env ~label:"Tasks" ~checked:false in
    let* () = set_navigation env ~label:"Assets" ~checked:false in
    (* :each validate-graph *)
    Fixtures.validate_graph env)
