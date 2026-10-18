(** Port of query_builder_basic_test.clj. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

let status_choices =
  [ "Backlog"; "Todo"; "Doing"; "In Review"; "Done"; "Canceled" ]

let priority_choices = [ "Low"; "Medium"; "High"; "Urgent" ]

let start_query_filter env =
  let* () = Block.new_block env "" in
  let* () = Util.input_command env "query" in
  let* () = Pw.wait_for env ".cp__query-builder" in
  let* () =
    Pw.click_l (Util.query_last env "button:text('filter')")
  in
  Pw.wait_for env ".query-builder-picker .cp__select-input"

let choose_select_item env label =
  let* () = Pw.wait_for env ".cp__select-input" in
  let* () = Pw.click env ".cp__select-input" in
  let* () = Util.input env label in
  Pw.click_l
    (Ls_locator.filter env ~has_text:label
       ".cp__select-results a.menu-link")

let select_choice_texts env =
  let* texts =
    Playwright.all_text_contents
      (Pw.q env ".query-builder-picker .cp__select-results a.menu-link")
  in
  Js.Promise.resolve
    (texts |> Array.to_list
    |> List.map String.trim
    |> List.filter (fun s -> s <> ""))

let assert_select_choices env expected =
  let* () =
    Pw.wait_for_l
      (Ls_locator.filter env
         ~has_text:(List.hd expected)
         ".query-builder-picker .cp__select-results a.menu-link")
  in
  let* texts = select_choice_texts env in
  List.iter
    (fun choice ->
      Fest.equal (List.mem choice texts) true Fest.expect)
    expected;
  Js.Promise.resolve ()

let () =
  Fest.Promise.test "query-builder-task-filter-shows-all-status-choices-test"
    (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = start_query_filter env in
    let* () = choose_select_item env "Task" in
    let* () = assert_select_choices env status_choices in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test
    "query-builder-priority-filter-shows-all-priority-choices-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = start_query_filter env in
    let* () = choose_select_item env "Priority" in
    let* () = assert_select_choices env priority_choices in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test
    "query-builder-property-filter-shows-all-status-choices-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = start_query_filter env in
    let* () = choose_select_item env "Property" in
    let* () = Pw.wait_for env ".query-builder-picker" in
    let* () =
      Pw.click_l (Util.get_by_text env "Show built-in properties" true)
    in
    let* () =
      Pw.wait_for_l
        (Ls_locator.filter env ~has_text:"Status"
           ".cp__select-results a.menu-link")
    in
    let* () = choose_select_item env "Status" in
    let* () = assert_select_choices env status_choices in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "query-builder-task-tag-shows-title-not-uuid-test"
    (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = start_query_filter env in
    let* () = choose_select_item env "Tags" in
    let* () = choose_select_item env "Task" in
    let* () = Pw.wait_for env ".cp__query-builder .query-clause" in
    let* clause = Util.get_text env ".cp__query-builder .query-clause" in
    let contains s sub =
      let ls = String.length s and lsub = String.length sub in
      let rec go i =
        if i + lsub > ls then false
        else if String.sub s i lsub = sub then true
        else go (i + 1)
      in
      lsub = 0 || go 0
    in
    Fest.equal (contains clause "Task") true Fest.expect;
    let uuid_re =
      Js.Re.fromStringWithFlags
        ~flags:"i"
        "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
    in
    Fest.equal (Js.Re.test ~str:clause uuid_re) false Fest.expect;
    Fixtures.validate_graph env)
