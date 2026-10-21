open Fest.Promise
module Util = Util
module Pw = Pw
module K = Keyboard
module Assert = E2e_assert
module Playwright = Playwright

let env = Fixtures.shared_open_page ()

(* Opens the plugins dialog via the More menu *)
let open_plugins_dialog env =
  let* () = Util.double_esc env in
  let* () = Pw.click env ".toolbar-dots-btn" in
  let* () =
    Pw.click env ".ui__dropdown-menu-item:has-text('Plugins')"
  in
  Pw.wait_for env ".cp__plugins-page"

(* Switches to the Marketplace tab in the plugins dialog *)
let switch_to_marketplace env =
  let* () = Pw.click env "button:has-text('Marketplace')" in
  Pw.wait_for env ~timeout:15000. ".cp__plugins-marketplace-cnt"

(* Search for a plugin by name *)
let search_plugin env term =
  Pw.fill env ".cp__plugins-page input[placeholder*='Search']" term

(* Clicks the installation button for the first visible plugin card.
   [text-is] is exact match — [has-text] is substring and also matches the
   disabled "Installed" button once the plugin is already installed. *)
let click_install_button env =
  Pw.click_l
    (Playwright.locator_first
       (Pw.q env
          ".cp__plugins-item-card .ctl a.btn:text-is('Install')"))

(* Waits for the plugin to show as installed *)
let wait_for_plugin_installed env =
  Pw.wait_for env ~timeout:30000.
    ".cp__plugins-item-card .ctl a.btn:has-text('Installed')"

(* Switches to the Installed tab in the plugins dialog *)
let switch_to_installed env =
  let* () = Pw.click env "button:has-text('Installed')" in
  Pw.wait_for env ".cp__plugins-installed"

let close_plugins_dialog env =
  (* esc only closes the top-most dialog and can be swallowed by focus state;
     the dialog's own close button is the deterministic path *)
  let* () =
    Pw.click_l
      (Playwright.locator_first (Pw.q env ".ui__dialog-close"))
  in
  let* () = Pw.wait_for_hidden env ".cp__plugins-page" in
  (* portal overlays linger in the DOM permanently; a selector wait only sees
     the first one — poll until NO overlay is data-state=open *)
  Playwright.wait_for_function (Env.page env)
    "document.querySelectorAll('.ui__dialog-overlay[data-state=\"open\"]').length === 0"

let ensure_journals_calendar_installed env =
  let* () = open_plugins_dialog env in
  let* () = switch_to_marketplace env in
  let* () = search_plugin env "Journals calendar" in
  let* () =
    Pw.wait_for env ~timeout:10000.
      ".cp__plugins-item-card h3:has-text('Journals calendar')"
  in
  let* visible =
    Pw.visible env
      ".cp__plugins-item-card .ctl a.btn:text-is('Install')"
  in
  let* () =
    if visible then
      let* () = click_install_button env in
      wait_for_plugin_installed env
    else Js.Promise.resolve ()
  in
  let* () = switch_to_installed env in
  let* () = search_plugin env "Journals calendar" in
  Pw.wait_for env ".cp__plugins-item-card h3:has-text('Journals calendar')"

let journals_calendar_card env =
  Playwright.locator_first
    (Pw.q env
       ".cp__plugins-item-card:has(h3:has-text('Journals calendar'))")

let set_journals_calendar_enabled env enabled =
  let card = journals_calendar_card env in
  let toggle =
    (* base-ui Switch renders <span role="switch">, not <button> *)
    Playwright.locator_locator card "[role='switch']"
  in
  let* checked = Pw.attr_l toggle "aria-checked" in
  let* () =
    if enabled <> (checked = Some "true") then Pw.click_l toggle
    else Js.Promise.resolve ()
  in
  Assert.is_visible_l card

  let () =
  Fest.Promise.test "marketplace-tabs-search-and-state-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
  let* () = open_plugins_dialog env in
  let* _ = Assert.is_visible env "button:has-text('Installed')" in
  let* _ = Assert.is_visible env "button:has-text('Marketplace')" in
  let* () = switch_to_marketplace env in
  let* _ = Assert.is_visible env "button:has-text('Plugins')" in
  let* _ = Assert.is_visible env "button:has-text('Themes')" in
  let* () = search_plugin env "Journals calendar" in
  let* () =
    Pw.wait_for env ~timeout:10000.
      ".cp__plugins-item-card h3:has-text('Journals calendar')"
  in
  let* () = Pw.click env "button:has-text('Themes')" in
  let* _ =
    Assert.is_hidden env
      ".cp__plugins-item-card h3:has-text('Journals calendar')"
  in
  let* () = Pw.click env "button:has-text('Plugins')" in
  let* _ =
    Assert.is_visible env
      ".cp__plugins-item-card h3:has-text('Journals calendar')"
  in
  let* () = switch_to_installed env in
  let* _ = Assert.is_visible env ".cp__plugins-installed" in
  let* () = switch_to_marketplace env in
  let* _ =
    Assert.is_visible env
      ".cp__plugins-item-card h3:has-text('Journals calendar')"
  in
  let* () = close_plugins_dialog env in
  let* _ = Assert.is_hidden env ".cp__plugins-page" in
  Js.Promise.resolve ()


  )

  let () =
  Fest.Promise.test "install-plugin-from-marketplace" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
  let* () = open_plugins_dialog env in
  let* () = switch_to_marketplace env in
  let* () = search_plugin env "Journals calendar" in
  let* () =
    Pw.wait_for env ~timeout:10000.
      ".cp__plugins-item-card h3:has-text('Journals calendar')"
  in
  let* () = click_install_button env in
  let* () = wait_for_plugin_installed env in
  let* _ =
    Assert.is_visible env
      ".cp__plugins-item-card .ctl a.btn.disabled:has-text('Installed')"
  in
  let* () = switch_to_installed env in
  let* _ =
    Assert.is_visible env
      ".cp__plugins-item-card h3:has-text('Journals calendar')"
  in
  let* () = close_plugins_dialog env in
  let* () = Pw.wait_for env ".toolbar-plugins-manager-trigger" in
  let* () = Pw.click env ".toolbar-plugins-manager-trigger" in
  let* _ =
    Assert.is_visible env "a.button[data-on-click=goToToday]"
  in
  let* () =
    Pw.click env ".ui__dropdown-menu-content a.button[data-on-click=goToToday]"
  in
  let* _ = Assert.is_visible env ".is-today-page" in
  Js.Promise.resolve ()


  )

  let () =
  Fest.Promise.test "plugin-command-registration-follows-lifecycle-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
  let go_to_today_count expected =
    Assert.have_count env
      ".ui__dropdown-menu-content a.button[data-on-click=goToToday]"
      expected
  in
  let* () = ensure_journals_calendar_installed env in
  let* () = set_journals_calendar_enabled env true in
  let* () = close_plugins_dialog env in
  let* () = Pw.click env ".toolbar-plugins-manager-trigger" in
  let* () = go_to_today_count 1 in
  let* () = K.esc env in

  let* () = open_plugins_dialog env in
  let* () = switch_to_installed env in
  let* () = search_plugin env "Journals calendar" in
  let* () = set_journals_calendar_enabled env false in
  let* () = close_plugins_dialog env in
  (* disabled plugins unregister their toolbar items, so with no other items
     the manager trigger unmounts entirely — assert unregistration directly *)
  let* () = go_to_today_count 0 in

  let* () = open_plugins_dialog env in
  let* () = switch_to_installed env in
  let* () = search_plugin env "Journals calendar" in
  let* () = set_journals_calendar_enabled env true in
  let* () = close_plugins_dialog env in
  let* () = Pw.click env ".toolbar-plugins-manager-trigger" in
  go_to_today_count 1


  )

  let () =
  Fest.Promise.test "plugin-disable-enable-and-reload-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
  let* () = ensure_journals_calendar_installed env in
  let* () = set_journals_calendar_enabled env false in
  let* () = close_plugins_dialog env in
  let* () =
    Assert.have_count env "a.button[data-on-click=goToToday]" 0
  in

  let* () = open_plugins_dialog env in
  let* () = switch_to_installed env in
  let* () = search_plugin env "Journals calendar" in
  let* () = set_journals_calendar_enabled env true in
  let* () = close_plugins_dialog env in
  let* () = Pw.click env ".toolbar-plugins-manager-trigger" in
  let* () =
    Assert.have_count env
      ".ui__dropdown-menu-content a.button[data-on-click=goToToday]"
      1
  in
  let* () = K.esc env in

  let* _ = Util.refresh_until_graph_loaded env in
  let* () = Pw.click env ".toolbar-plugins-manager-trigger" in
  Assert.have_count env
    ".ui__dropdown-menu-content a.button[data-on-click=goToToday]"
    1

  )