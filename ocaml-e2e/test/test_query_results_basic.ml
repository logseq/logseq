(** Port of query_results_basic_test.clj. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

let edit_query env query =
  let* has_cm = Pw.visible env "pre.CodeMirror-line" in
  let* () =
    if not has_cm then Pw.click env ".ls-query-setting"
    else Js.Promise.resolve ()
  in
  let* () =
    Pw.click_l
      (Playwright.locator_first (Pw.q env "pre.CodeMirror-line"))
  in
  let* () = Keyboard.press env "ControlOrMeta+a" in
  let* () = Util.input env query in
  Keyboard.esc env

let create_query env query =
  let* () = Block.new_block env "" in
  let* () = Util.input_command env "advanced query" in
  edit_query env query

let journal_query a b =
  Printf.sprintf
    "{:title \"Journals - last 3 days\", :query [:find (pull ?p \
     [:block/journal-day]) :in $ ?start ?end :where [?p :block/journal-day ?d] \
     [(>= ?d ?start)] [(<= ?d ?end)]], :inputs [%s %s]}"
    a b

let journal_dates = [ "2020-01-01"; "2020-01-02"; "2020-01-03" ]

let seed_journals env =
  let rec go acc = function
    | [] -> Js.Promise.resolve (List.rev acc)
    | d :: rest ->
        let* j =
          Api.ls_api_call env "editor.createJournalPage"
            [| Api.str (d ^ "T12:00:00") |]
        in
        go (j :: acc) rest
  in
  go [] journal_dates

let journal_title j = Option.value ~default:"" (Api.get_string j "title")

let select_view env view =
  let* () = Pw.click env ".custom-query-results .view-action-type" in
  Pw.click_l (Util.get_by_text env view true)

let assert_query_count env n =
  (* live queries recompute on the worker; give the count a window *)
  Js.Promise.catch
    (fun e ->
       let* dump =
         Pw.eval_js env
           "(() => { const el = document.querySelector('.custom-query-results'); return el ? el.textContent.slice(0,200) : 'no-results' })()"
       in
       let* () = Js.Promise.resolve (Js.log2 "query-results-dump" dump) in
       Playwright.throw_error e)
    (E2e_assert.is_visible_l ~timeout:40000.
       (Ls_locator.filter env
          ~has_text:(Printf.sprintf "Live query (%d)" n)
          ".custom-query-results"))

let row_with env text =
  Ls_locator.filter env ~has_text:text
    ".custom-query-results .ls-table-row"

let block_with env text =
  Ls_locator.filter env ~has_text:text
    ".custom-query-results .ls-block"

let header_with env text =
  Ls_locator.filter env ~has_text:text
    ".custom-query-results .ls-table-header-cell"

let li_with env text =
  Ls_locator.filter env ~has_text:text
    ".custom-query-results li"

let () =
  Fest.Promise.test "partial-journal-query-table-list-and-reload-test"
    (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* journals = seed_journals env in
    let* () = create_query env (journal_query "20200101" "20200103") in
    let* _ = assert_query_count env 3 in
    let* () = select_view env "Table View" in
    let* () =
      List.fold_left
        (fun p j ->
          let* () = p in
          let* _ = E2e_assert.is_visible_l (row_with env (journal_title j)) in
          Js.Promise.resolve ())
        (Js.Promise.resolve ()) journals
    in
    let* () = select_view env "List View" in
    let* _ =
      E2e_assert.is_visible env
        ".custom-query-results .view-action-type .ls-icon-list"
    in
    let* () =
      List.fold_left
        (fun p j ->
          let* () = p in
          let* _ =
            E2e_assert.is_visible_l (block_with env (journal_title j))
          in
          Js.Promise.resolve ())
        (Js.Promise.resolve ()) journals
    in
    let* _ = Util.refresh_until_graph_loaded env in
    let* _ =
      E2e_assert.is_visible env
        ".custom-query-results .view-action-type .ls-icon-list"
    in
    let* () =
      List.fold_left
        (fun p j ->
          let* () = p in
          let* _ =
            E2e_assert.is_visible_l (block_with env (journal_title j))
          in
          Js.Promise.resolve ())
        (Js.Promise.resolve ()) journals
    in
    let* () = select_view env "Table View" in
    let* _ = assert_query_count env 3 in
    let* () =
      List.fold_left
        (fun p j ->
          let* () = p in
          let* _ = E2e_assert.is_visible_l (row_with env (journal_title j)) in
          Js.Promise.resolve ())
        (Js.Promise.resolve ()) journals
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "partial-query-edit-empty-and-live-update-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* _journals = seed_journals env in
    let* () = create_query env (journal_query "20200101" "20200103") in
    let* _ = assert_query_count env 3 in
    (* editing the query updates its result set *)
    let* () = edit_query env (journal_query "20200102" "20200103") in
    let* _ = assert_query_count env 2 in
    (* empty results recover when matching data is added *)
    let* () = edit_query env (journal_query "20200104" "20200104") in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env
           ~has_text:"No matched result"
           ".custom-query-results")
    in
    let* journal =
      Api.ls_api_call env "editor.createJournalPage"
        [| Api.str "2020-01-04T12:00:00" |]
    in
    let* _ = assert_query_count env 1 in
    let* () = select_view env "Table View" in
    let* _ =
      E2e_assert.is_visible_l (row_with env (journal_title journal))
    in
    let* _ =
      Api.ls_api_call env "editor.deletePage"
        [| Api.str
             (Option.value ~default:"" (Api.get_string journal "name")) |]
    in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env
           ~has_text:"No matched result"
           ".custom-query-results")
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "scalar-and-multiple-column-query-results-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* _journals = seed_journals env in
    let* () =
      create_query env
        "{:query [:find ?day :where [?p :block/journal-day ?day] [(= ?day \
         20200101)]]}"
    in
    let* _ = E2e_assert.is_visible_l (li_with env "20200101") in
    let* () =
      E2e_assert.have_count env ".custom-query-results .view-action-type" 0
    in
    let* () =
      edit_query env
        "{:query [:find ?day (pull ?p [:block/journal-day]) :where [?p \
         :block/journal-day ?day] [(= ?day 20200101)]]}"
    in
    let* _ =
      E2e_assert.is_visible_l (li_with env ":block/journal-day")
    in
    let* () =
      E2e_assert.have_count env ".custom-query-results .view-action-type" 0
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "partial-query-result-transform-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* _journals = seed_journals env in
    let* () =
      create_query env
        "{:query [:find (pull ?p [:block/journal-day]) :where [?p \
         :block/journal-day ?day] [(<= 20200101 ?day 20200103)]] \
         :result-transform (fn [rows] (filter (fn [row] (= 20200102 \
         (:block/journal-day row))) rows))}"
    in
    let* _ = assert_query_count env 1 in
    let* () = select_view env "Table View" in
    let* () =
      E2e_assert.have_count env ".custom-query-results .ls-table-row" 1
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "query-set-literals-do-not-create-tags-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* _journals = seed_journals env in
    let is_nullish : 'a -> bool = [%raw "v => v == null"] in
    let* tag0 =
      Api.ls_api_call env "editor.getTag" [| Api.str "{" |]
    in
    Fest.equal (is_nullish tag0) true Fest.expect;
    let* () =
      create_query env
        "{:query [:find (pull ?p [:block/journal-day]) :where [?p \
         :block/journal-day ?day] [(contains? #{ 20200101 20200102} ?day)]]}"
    in
    let* tag1 =
      Api.ls_api_call env "editor.getTag" [| Api.str "{" |]
    in
    Fest.equal (is_nullish tag1) true Fest.expect;
    let* _ = E2e_assert.is_visible env ".CodeMirror" in
    let* _ = assert_query_count env 2 in
    let* () =
      edit_query env
        "{:query [:find (pull ?p [:block/journal-day]) :where [?p \
         :block/journal-day ?day] [(contains? #{20200103} ?day)]]}"
    in
    let* _ = assert_query_count env 1 in
    let* tag2 =
      Api.ls_api_call env "editor.getTag" [| Api.str "{" |]
    in
    let* tag3 =
      Api.ls_api_call env "editor.getTag" [| Api.str "{20200103" |]
    in
    Fest.equal (is_nullish tag2) true Fest.expect;
    Fest.equal (is_nullish tag3) true Fest.expect;
    let* _ = Util.refresh_until_graph_loaded env in
    let* _ = assert_query_count env 1 in
    let* tag4 =
      Api.ls_api_call env "editor.getTag" [| Api.str "{" |]
    in
    let* tag5 =
      Api.ls_api_call env "editor.getTag" [| Api.str "{20200103" |]
    in
    Fest.equal (is_nullish tag4) true Fest.expect;
    Fest.equal (is_nullish tag5) true Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "partial-query-uses-requested-columns-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* _journals = seed_journals env in
    let* () =
      create_query env
        "{:query [:find (pull ?p [:block/title :block/created-at]) :where [?p \
         :block/journal-day 20200101]]}"
    in
    let* _ = assert_query_count env 1 in
    let* () = select_view env "Table View" in
    let* _ =
      E2e_assert.is_visible_l (header_with env "Created At")
    in
    let* () =
      E2e_assert.have_count_l (header_with env "Updated At") 0
    in
    let* () =
      edit_query env
        "{:query [:find (pull ?p [:block/title :block/updated-at]) :where [?p \
         :block/journal-day 20200101]]}"
    in
    let* _ =
      E2e_assert.is_visible_l (header_with env "Updated At")
    in
    let* () =
      E2e_assert.have_count_l (header_with env "Created At") 0
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "simple-query-builder-views-and-live-results-test"
    (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let reference = "simple-query-ux-reference" in
    let empty_reference = "simple-query-ux-empty-reference" in
    let seed_title = "[[" ^ reference ^ "]] query seed" in
    let candidate_title = "Simple query candidate" in
    let* () =
      Block.new_blocks env [ seed_title; candidate_title; "" ]
    in
    let* candidate_uuid =
      Playwright.get_attribute
        (Pw.q env
           (Printf.sprintf ".ls-block[data-block-title='%s']" candidate_title))
        "blockid"
    in
    let candidate_uuid = Option.value ~default:"" candidate_uuid in
    let* () = Util.input_command env "query" in
    let* () =
      Pw.click_l (Util.query_last env "button:text('filter')")
    in
    let* () = Util.input env "page reference" in
    let* () =
      Pw.click env "a.menu-link:has-text('page reference')"
    in
    let* () =
      Pw.click_l
        (Ls_locator.filter env ~has_text:reference
           ".cp__select-results a.menu-link")
    in
    let* _ = assert_query_count env 1 in
    let* () = select_view env "Table View" in
    let* _ =
      E2e_assert.is_visible_l (row_with env "query seed")
    in
    let* _ =
      Api.ls_api_call env "editor.updateBlock"
        [| Api.str candidate_uuid;
           Api.str ("[[" ^ reference ^ "]] " ^ candidate_title) |]
    in
    let* _ = assert_query_count env 2 in
    let* _ =
      E2e_assert.is_visible_l (row_with env candidate_title)
    in
    let* () = select_view env "List View" in
    let* _ =
      E2e_assert.is_visible_l (block_with env candidate_title)
    in
    let* _ = Util.refresh_until_graph_loaded env in
    let* _ =
      E2e_assert.is_visible env
        ".custom-query-results .view-action-type .ls-icon-list"
    in
    let* _ =
      E2e_assert.is_visible_l (block_with env candidate_title)
    in
    let* _ =
      Api.ls_api_call env "editor.updateBlock"
        [| Api.str candidate_uuid; Api.str candidate_title |]
    in
    let* () =
      E2e_assert.have_count_l (block_with env candidate_title) 0
    in
    let* () = select_view env "Table View" in
    let* _ = assert_query_count env 1 in
    (* editing a simple query can produce an empty result and recover live *)
    let* _ =
      Api.ls_api_call env "editor.createPage"
        [| Api.str empty_reference;
           Api.obj [];
           Api.obj [ ("redirect", Api.bool false) ] |]
    in
    let* () =
      Pw.click_l
        (Ls_locator.filter env ~has_text:reference
           ".cp__query-builder .query-clause")
    in
    let* () = Pw.click_l (Util.get_by_text env "Delete" true) in
    let* () =
      Pw.click_l (Util.query_last env "button:text('filter')")
    in
    let* () = Util.input env "page reference" in
    let* () =
      Pw.click env "a.menu-link:has-text('page reference')"
    in
    let* () =
      Pw.click_l
        (Ls_locator.filter env ~has_text:empty_reference
           ".cp__select-results a.menu-link")
    in
    let* _ = assert_query_count env 0 in
    let* () =
      E2e_assert.have_count env ".custom-query-results .ls-table-row" 0
    in
    let* _ =
      Api.ls_api_call env "editor.updateBlock"
        [| Api.str candidate_uuid;
           Api.str ("[[" ^ empty_reference ^ "]] " ^ candidate_title) |]
    in
    let* _ = assert_query_count env 1 in
    let* _ =
      E2e_assert.is_visible_l (row_with env candidate_title)
    in
    let* _ = Util.refresh_until_graph_loaded env in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env ~has_text:empty_reference
           ".cp__query-builder .query-clause")
    in
    let* _ = assert_query_count env 1 in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "advanced-query-relative-journal-inputs-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* (dates : string array) =
      Pw.eval_js env
        "(() => { const f = n => new Date(Date.now() - n * 864e5).toISOString().slice(0,10); return [f(0), f(1), f(2)]; })()"
    in
    let* journals =
      let rec go acc = function
        | [] -> Js.Promise.resolve (List.rev acc)
        | d :: rest ->
            let* j =
              Api.ls_api_call env "editor.createJournalPage"
                [| Api.str (d ^ "T12:00:00") |]
            in
            go (j :: acc) rest
      in
      go [] (Array.to_list dates)
    in
    let* () = create_query env (journal_query ":-2d" ":today") in
    let* _ = assert_query_count env 3 in
    let* () = select_view env "Table View" in
    let* () =
      List.fold_left
        (fun p j ->
          let* () = p in
          let* _ = E2e_assert.is_visible_l (row_with env (journal_title j)) in
          Js.Promise.resolve ())
        (Js.Promise.resolve ()) journals
    in
    Fixtures.validate_graph env)
