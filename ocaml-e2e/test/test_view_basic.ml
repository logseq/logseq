(** Port of view_basic_test.clj. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

let has_text env text sel =
  Ls_locator.filter env ~has_text:text sel

let select_view_type env view_type =
  let* () = Pw.click env ".view-action-type" in
  Pw.click_l (Util.get_by_text env view_type true)

let seed_table_view env tag_name =
  let* container_page = Ls_page.get_page_name env in
  let* _ =
    Api.ls_api_call env "editor.createTag"
      [| Api.str tag_name
       ; Api.obj
           [ ( "tagProperties"
             , Api.arr
                 [| Api.obj [ "name", Api.str "Status" ]
                  ; Api.obj
                      [ "name", Api.str "Priority"
                      ; "schema", Api.obj [ "type", Api.str "number" ] ]
                 |] ) ]
      |]
  in
  let rec go = function
    | [] -> Js.Promise.resolve ()
    | (title, status, priority) :: rest ->
        let* _ =
          Api.ls_api_call env "editor.insertBlock"
            [| Api.str container_page
             ; Api.str (title ^ " #" ^ tag_name)
             ; Api.obj
                 [ ( "properties"
                   , Api.obj
                       [ "Status", Api.str status
                       ; "Priority", Api.num priority ] ) ]
            |]
        in
        go rest
  in
  let* () =
    go [ "Alpha table object", "Open", 2.; "Beta table object", "Closed", 1. ]
  in
  let* () = Ls_page.goto_page env tag_name in
  let* _ =
    E2e_assert.is_visible env ".ls-view-body .ls-table-header-cell"
  in
  let* () = Pw.click env ".views button[title='Add new view']" in
  let* _ =
    E2e_assert.is_visible_l (has_text env "New view" ".views > button")
  in
  let* () = select_view_type env "List View" in
  let* _ = E2e_assert.is_visible env ".view-action-type .ls-icon-list" in
  let* () = select_view_type env "Table View" in
  let* _ = E2e_assert.is_visible env ".view-action-type .ls-icon-table" in
  let* _ =
    E2e_assert.is_visible_l
      (has_text env "Alpha table object" ".ls-view-body .ls-table-row")
  in
  E2e_assert.is_visible_l
    (has_text env "Beta table object" ".ls-view-body .ls-table-row")

let regex_quote s =
  (* escape regex metacharacters (JS syntax; \Q\E is Java-only) *)
  let buf = Buffer.create (String.length s * 2) in
  String.iter
    (fun c ->
      if String.contains "-/^$*+?.()|[]{}\\" c then Buffer.add_char buf '\\';
      Buffer.add_char buf c)
    s;
  Buffer.contents buf

let contains_sub s sub =
  let n = String.length s and m = String.length sub in
  let rec go i =
    if i + m > n then false
    else if String.sub s i m = sub then true
    else go (i + 1)
  in
  go 0

let assert_body_text_order env before after =
  let re =
    Js.Re.fromString
      (regex_quote before ^ "[\\s\\S]*" ^ regex_quote after)
  in
  E2e_assert.to_have_text_re (Pw.q env ".ls-view-body") re

let view_action_button env icon =
  Playwright.locator_first
    (Pw.q env
       (Printf.sprintf ".view-actions button:has(.ls-icon-%s)" icon))

let open_view_more_actions env = Pw.click_l (view_action_button env "dots")

let open_view_submenu env label =
  let item_index =
    match label with
    | "Columns visibility" -> 0
    | "Group by" -> 1
    | "Sort groups by" -> 2
    | "Sort groups order" -> 3
    | _ -> failwith ("open_view_submenu: unknown " ^ label)
  in
  let* () = Keyboard.press env "Home" in
  let* () =
    Keyboard.press_all env (List.init item_index (fun _ -> "ArrowDown"))
  in
  (* the submenu opens async and the ArrowRight can land mid-remount;
     verify a second menu appeared before returning, retrying once *)
  let submenu_item =
    Playwright.locator_last
      (Pw.q env "[role='menu'] >> [role='menuitemcheckbox']")
  in
  let opened () =
    Js.Promise.catch
      (fun _ -> Js.Promise.resolve false)
      (let* _ = E2e_assert.is_visible_l ~timeout:5000. submenu_item in
       Js.Promise.resolve true)
  in
  let* () = Keyboard.arrow_right env in
  let* ok = opened () in
  if ok then Js.Promise.resolve ()
  else begin
    let* () = Keyboard.arrow_right env in
    let* _ = opened () in
    Js.Promise.resolve ()
  end

let () =
  Fest.Promise.test "table-row-selection-shows-action-bar-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* _ = seed_table_view env "table-row-selection-actions" in
    let rec go = function
      | [] -> Js.Promise.resolve ()
      | title :: rest ->
          let* () =
            Pw.click_l
              (Playwright.locator_locator
                 (has_text env title ".ls-view-body .ls-table-row")
                 "[data-table-row-select]")
          in
          go rest
    in
    let* () = go [ "Alpha table object"; "Beta table object" ] in
    let* _ = E2e_assert.is_visible env ".ls-table-actions" in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env "2" ".ls-table-actions .selection-count")
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test
    "all-pages-delete-confirm-stays-open-on-pointer-release-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* page_name = Ls_page.get_page_name env in
    let* () = Util.search_and_click env "Go to all pages" in
    let* _ = E2e_assert.is_visible env ".ls-all-pages" in
    let* () =
      Pw.click_l
        (Playwright.locator_locator
           (has_text env page_name ".ls-view-body .ls-table-row")
           "[data-table-row-select]")
    in
    let* _ = E2e_assert.is_visible env ".ls-table-actions" in
    let* () =
      Playwright.click ~timeout:10000.
        (Playwright.locator_first
           (Pw.q env ".ls-table-actions button:has(.ls-icon-trash)"))
    in
    let* _ = E2e_assert.is_visible env ".ui__dialog-content" in
    let* _ = E2e_assert.is_visible env "#modal-headline" in
    let* () =
      Pw.click_l (has_text env "Cancel" ".ui__dialog-content button")
    in
    let* _ = E2e_assert.is_hidden env ".ui__dialog-content" in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "view-lifecycle-and-display-type-persistence-test"
    (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let tag_name = "view-lifecycle" in
    let* container_page = Ls_page.get_page_name env in
    let object_title = "view lifecycle object" in
    let view_title = "Persistent view" in
    let* _ = Api.ls_api_call env "editor.createTag" [| Api.str tag_name |] in
    let* _ =
      Api.ls_api_call env "editor.insertBlock"
        [| Api.str container_page
         ; Api.str (object_title ^ " #" ^ tag_name)
         ; Api.obj [ "properties", Api.obj [] ] |]
    in
    let* () = Ls_page.goto_page env tag_name in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env object_title ".ls-view-body")
    in
    let* () = Pw.click env ".views button[title='Add new view']" in
    let* () =
      Pw.click_l (has_text env "New view" ".views > button")
    in
    let* () =
      Pw.click_l (has_text env "Rename" "[role='menuitem']")
    in
    let* () = Pw.click env "[role='menu'] .block-title-wrap" in
    let* () = Util.press_seq env view_title in
    let* () = Keyboard.enter env in
    let* _ =
      E2e_assert.is_visible_l (has_text env view_title ".views > button")
    in
    let* () = Util.double_esc env in
    let* () = select_view_type env "List View" in
    let* _ = E2e_assert.is_visible env ".view-action-type .ls-icon-list" in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env object_title ".ls-view-body .ls-block")
    in
    let* () = select_view_type env "Gallery View" in
    let* _ =
      E2e_assert.is_visible env ".view-action-type .ls-icon-layout-grid"
    in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env object_title ".ls-card-item")
    in
    let* _ = Util.refresh_until_graph_loaded env in
    let* _ =
      E2e_assert.is_visible_l (has_text env view_title ".views > button")
    in
    let* _ = E2e_assert.is_visible env ".view-action-type .ls-icon-table" in
    let* () = Pw.click_l (has_text env view_title ".views > button") in
    let* _ =
      E2e_assert.is_visible env ".view-action-type .ls-icon-layout-grid"
    in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env object_title ".ls-card-item")
    in
    let* () = Pw.click_l (has_text env view_title ".views > button") in
    let* () = Pw.click_l (has_text env "Delete" "[role='menuitem']") in
    let* () =
      E2e_assert.have_count_l (has_text env view_title ".views > button") 0
    in
    let* _ = E2e_assert.is_visible_l (has_text env "All" ".views > button") in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "table-view-search-filter-and-new-record-actions-test"
    (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* _ = seed_table_view env "table-search-filter-actions" in
    let* () = Pw.click_l (view_action_button env "search") in
    let* () = Pw.fill env "input[placeholder='Type to search']" "Alpha" in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env "Alpha table object" ".ls-view-body .ls-table-row")
    in
    let* () =
      E2e_assert.have_count_l
        (has_text env "Beta table object" ".ls-view-body .ls-table-row")
        0
    in
    let* () = Pw.click_l (view_action_button env "search") in
    let* () = Pw.fill env "input[placeholder='Type to search']" "" in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env "Beta table object" ".ls-view-body .ls-table-row")
    in
    let* () = Pw.click_l (view_action_button env "filter") in
    let* () =
      Pw.click_l (has_text env "Status" ".cp__select-results a")
    in
    let* _ =
      E2e_assert.is_visible env ".cp__select-input[placeholder='Status']"
    in
    let* () = Pw.click_l (Util.get_by_text env "Is Not Empty" true) in
    let* _ = E2e_assert.is_visible env ".filters-row" in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env "Alpha table object" ".ls-view-body .ls-table-row")
    in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env "Beta table object" ".ls-view-body .ls-table-row")
    in
    let* () = Util.double_esc env in
    let* () =
      Pw.click env ".filters-row button:has(.ls-icon-x)"
    in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env "Alpha table object" ".ls-view-body .ls-table-row")
    in
    let* () = Pw.click_l (view_action_button env "plus") in
    let* _ = E2e_assert.is_visible env ".cp__right-sidebar.open" in
    let* () = Util.wait_editor_visible env in
    let* () = Util.press_seq env "New table object" in
    let* () = Util.exit_edit env in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env "New table object" ".ls-view-body .ls-table-row")
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "table-view-column-visibility-action-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* _ = seed_table_view env "table-column-actions" in
    let* () = open_view_more_actions env in
    let* () = open_view_submenu env "Columns visibility" in
    let* () =
      Pw.click_l
        (has_text env "Status" "[role='menuitemcheckbox']")
    in
    let* () =
      E2e_assert.have_count_l
        (has_text env "Status" ".ls-table-header-cell")
        0
    in
    let* () = Util.double_esc env in
    let* () = open_view_more_actions env in
    let* () = open_view_submenu env "Columns visibility" in
    let* () =
      Pw.click_l
        (has_text env "Status" "[role='menuitemcheckbox']")
    in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env "Status" ".ls-table-header-cell")
    in
    let* () = Util.double_esc env in
    let* _ = Util.refresh_until_graph_loaded env in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env "Status" ".ls-table-header-cell")
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "table-view-group-and-export-actions-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* _ = seed_table_view env "table-group-export-actions" in
    let* () = open_view_more_actions env in
    let* () = open_view_submenu env "Group by" in
    let* () =
      Pw.click_l
        (has_text env "Status" "[role='menuitemcheckbox']")
    in
    (* the menu closes on toggle — verify the grouping took effect via the
       group bodies, not menu state *)
    let* _ =
      E2e_assert.is_visible_l ~timeout:30000.
        (has_text env "Open" ".ls-view-body")
    in
    let* _ =
      E2e_assert.is_visible_l ~timeout:30000.
        (has_text env "Closed" ".ls-view-body")
    in
    let* () = Util.double_esc env in
    let* () = open_view_more_actions env in
    let* () = open_view_submenu env "Sort groups by" in
    let* () =
      Pw.click_l
        (has_text env "Page name" "[role='menuitemcheckbox']")
    in
    let* () = Util.double_esc env in
    let* () = open_view_more_actions env in
    let* () = open_view_submenu env "Sort groups by" in
    let* _ =
      E2e_assert.is_visible_l ~timeout:15000.
        (has_text env "Page name"
           "[role='menuitemcheckbox'][aria-checked='true']")
    in
    let* () = Util.double_esc env in
    let* () = open_view_more_actions env in
    let* () = open_view_submenu env "Sort groups order" in
    let* () =
      Pw.click_l
        (has_text env "Descending" "[role='menuitemcheckbox']")
    in
    let* () = Util.double_esc env in
    let* () = assert_body_text_order env "Open" "Closed" in
    let* () = open_view_more_actions env in
    let* () =
      Pw.click_l
        (Playwright.locator_last
           (has_text env "Export EDN" "[role='menuitem']"))
    in
    let* _ =
      E2e_assert.is_visible_l (Util.get_by_text env "Copied view nodes" false)
    in
    let* (content : string) =
      Pw.eval_js env "navigator.clipboard.readText()"
    in
    Fest.equal (contains_sub content "Alpha table object") true Fest.expect;
    Fest.equal (contains_sub content "Beta table object") true Fest.expect;
    Fixtures.validate_graph env)

let sort_table_column env column_name direction =
  let* () =
    Pw.click_l
      (has_text env column_name ".ls-view-body .ls-table-header-cell")
  in
  let* () = Pw.click_l (has_text env direction "[role='menuitem']") in
  E2e_assert.is_visible_l
    (has_text env "Alpha table object" ".ls-view-body .ls-table-row")

let () =
  Fest.Promise.test "table-view-column-sort-does-not-crash-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* _ = seed_table_view env "table-column-sort" in
    let* _v = sort_table_column env "Name" "Sort ascending" in
    let* () =
      assert_body_text_order env "Alpha table object" "Beta table object"
    in
    let* _v = sort_table_column env "Priority" "Sort ascending" in
    let* () =
      assert_body_text_order env "Beta table object" "Alpha table object"
    in
    let* _v = sort_table_column env "Created At" "Sort descending" in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env "Alpha table object" ".ls-view-body .ls-table-row")
    in
    let* _ =
      E2e_assert.is_visible_l
        (has_text env "Beta table object" ".ls-view-body .ls-table-row")
    in
    Fixtures.validate_graph env)
