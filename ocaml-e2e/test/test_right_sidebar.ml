(** Port of right_sidebar_basic_test.clj. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

let use_dark_neutral_theme env =
  let* _ =
    Pw.eval_js env
      "window.logseq.api.set_theme_mode('dark');\n\
      \    window.logseq.api.set_state_from_store(['ui/system-theme?'], \
       false);\n\
      \    window.logseq.api.set_state_from_store(['ui/radix-color'], \
       'none');"
  in
  Util.wait_timeout env 100.

let right_sidebar_backgrounds env =
  Pw.eval_js env
    "(() => {\n\
    \          const topbar = \
     document.querySelector('.cp__right-sidebar-topbar');\n\
    \          const inner = \
     document.querySelector('.cp__right-sidebar-inner');\n\
    \          return [\n\
    \            getComputedStyle(topbar).backgroundColor,\n\
    \            getComputedStyle(inner).backgroundColor,\n\
    \            document.documentElement.dataset.theme,\n\
    \            document.documentElement.dataset.color\n\
    \          ].join('|');\n\
    \        })()"

let () =
  Fest.Promise.test "right-sidebar-topbar-uses-dark-neutral-background"
    (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = use_dark_neutral_theme env in
    let* () = Pw.click env ".toggle-right-sidebar" in
    let* _ =
      E2e_assert.is_visible env
        ".cp__right-sidebar.open .cp__right-sidebar-topbar"
    in
    let* _ = E2e_assert.is_visible env ".cp__right-sidebar .sidebar-item" in
    let* (bgs : string) = right_sidebar_backgrounds env in
    (match String.split_on_char '|' bgs with
     | [ topbar_bg; inner_bg; theme; color ] ->
         Fest.equal theme "dark" Fest.expect;
         Fest.equal color "none" Fest.expect;
         Fest.equal inner_bg topbar_bg Fest.expect
     | _ -> failwith ("unexpected backgrounds string: " ^ bgs));
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "right-sidebar-uses-only-content-scrollbar" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () = Pw.click env ".toggle-right-sidebar" in
    let* _ =
      E2e_assert.is_visible env ".cp__right-sidebar.open .sidebar-item-list"
    in
    let* (outer_overflow : string) =
      Pw.eval_js env
        "getComputedStyle(document.querySelector('.cp__right-sidebar-scrollable')).overflowY"
    in
    let* (content_overflow : string) =
      Pw.eval_js env
        "getComputedStyle(document.querySelector('.sidebar-item-list')).overflowY"
    in
    Fest.equal outer_overflow "visible" Fest.expect;
    Fest.equal content_overflow "auto" Fest.expect;
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "same-block-updates-in-main-and-right-sidebar" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* page_name = Ls_page.get_page_name env in
    let initial_title = "sidebar live block before" in
    let updated_title = "sidebar live block after" in
    let property_name = "sidebar-live-property" in
    let initial_property_value = "sidebar property before" in
    let updated_property_value = "sidebar property after" in
    let* block =
      Api.ls_api_call env "editor.appendBlockInPage"
        [| Api.str initial_title
         ; Api.obj
             [ ( "properties"
               , Api.obj
                   [ property_name, Api.str initial_property_value ] ) ]
        |]
    in
    let block_uuid = Option.get (Api.get_uuid block ()) in
    let main_block =
      Printf.sprintf ".ls-page-blocks #ls-block-%s" block_uuid
    in
    let sidebar_block =
      Printf.sprintf ".cp__right-sidebar #ls-block-%s" block_uuid
    in
    let* () =
      Pw.wait_for env
        (Printf.sprintf "%s .block-title-wrap:text('%s')" main_block
           initial_title)
    in
    let* _ =
      Api.ls_api_call env "editor.openInRightSidebar"
        [| Api.str block_uuid |]
    in
    let* () = Pw.wait_for env sidebar_block in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env ~has_text:page_name
           ".cp__right-sidebar .sidebar-item-header .breadcrumb")
    in
    let* () =
      E2e_assert.have_count env
        (Printf.sprintf "#ls-block-%s" block_uuid)
        2
    in
    let* _ =
      Api.ls_api_call env "editor.updateBlock"
        [| Api.str block_uuid; Api.str updated_title |]
    in
    let* _ =
      Api.ls_api_call env "editor.upsertBlockProperty"
        [| Api.str block_uuid
         ; Api.str property_name
         ; Api.str updated_property_value |]
    in
    let rec go = function
      | [] -> Js.Promise.resolve ()
      | block_selector :: rest ->
          let* () =
            Pw.wait_for env
              (Printf.sprintf "%s .block-title-wrap:text('%s')"
                 block_selector updated_title)
          in
          let* () =
            Pw.wait_for env
              (Printf.sprintf "%s .property-k:text('%s')" block_selector
                 property_name)
          in
          let* () =
            Pw.wait_for env
              (Printf.sprintf "%s .property-value :text('%s')"
                 block_selector updated_property_value)
          in
          go rest
    in
    let* () = go [ main_block; sidebar_block ] in
    let* () =
      Pw.wait_for_hidden env
        (Printf.sprintf "#ls-block-%s .block-title-wrap:text('%s')"
           block_uuid initial_title)
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "contents-open-as-page-navigates-to-contents" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* source_page = Ls_page.get_page_name env in
    let* () = Pw.click env ".toggle-right-sidebar" in
    let* _ =
      E2e_assert.is_visible env
        ".cp__right-sidebar.open .sidebar-item.item-type-contents"
    in
    let* () =
      Pw.click env
        ".cp__right-sidebar .item-type-contents \
         [data-testid='sidebar-item-more']"
    in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env ~has_text:"Open as page"
           "[role='menuitem']")
    in
    let* () =
      Pw.click_l
        (Ls_locator.filter env ~has_text:"Open as page"
           "[role='menuitem']")
    in
    let* () =
      Pw.wait_for env
        "div[data-testid='page title'] .block-title-wrap:text('Contents')"
    in
    let* name = Ls_page.get_page_name env in
    Fest.equal name "Contents" Fest.expect;
    Fest.equal (name <> source_page) true Fest.expect;
    Fixtures.validate_graph env)
