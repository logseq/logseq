(ns logseq.e2e.plugins-marketplace-test
  (:require [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.util :as util]
            [clojure.test :refer [deftest testing use-fixtures]]
            [wally.main :as w]))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each fixtures/new-logseq-page)

(defn- open-plugins-dialog
  "Opens the plugins dialog via the More menu"
  []
  (util/double-esc)
  (w/click "button[title='More'] .ls-icon-dots")
  (w/click ".ui__dropdown-menu-item:has-text('Plugins')")
  (w/wait-for ".cp__plugins-page"))

(defn- switch-to-marketplace
  "Switches to the Marketplace tab in the plugins dialog"
  []
  (w/click "button:has-text('Marketplace')")
  ;; Wait for plugins to load from marketplace
  (w/wait-for ".cp__plugins-marketplace-cnt" {:timeout 15000}))

(defn- search-plugin
  "Search for a plugin by name"
  [search-term]
  (w/fill ".cp__plugins-page input[placeholder*='Search']" search-term))

(defn- click-install-button
  "Clicks the installation button for the first visible plugin card"
  []
  (let [install-btn (.first (w/-query ".cp__plugins-item-card .ctl a.btn:has-text('Install')"))]
    (w/click install-btn)))

(defn- wait-for-plugin-installed
  "Waits for the plugin to show as installed"
  []
  (w/wait-for ".cp__plugins-item-card .ctl a.btn:has-text('Installed')" {:timeout 30000}))

(defn- switch-to-installed
  "Switches to the Installed tab in the plugins dialog"
  []
  (w/click "button:has-text('Installed')")
  ;; Wait for installed plugins view
  (w/wait-for ".cp__plugins-installed"))

(defn- close-plugins-dialog
  "Closes the plugins dialog"
  []
  (k/esc))

(deftest install-plugin-from-marketplace
  (testing "Install a plugin from the marketplace"
    ;; Open plugins dialog
    (open-plugins-dialog)

    ;; Switch to marketplace tab
    (switch-to-marketplace)

    ;; Search for a specific plugin (using Journals calendar as it's a well-known plugin)
    (search-plugin "Journals calendar")

    ;; Wait for search results
    (w/wait-for ".cp__plugins-item-card h3:has-text('Journals calendar')" {:timeout 10000})

    ;; Click install on the plugin
    (click-install-button)

    ;; Wait for installation to complete
    (wait-for-plugin-installed)

    ;; Verify the plugin is now marked as installed in marketplace
    (assert/assert-is-visible ".cp__plugins-item-card .ctl a.btn.disabled:has-text('Installed')")

    ;; Switch to installed tab and verify plugin appears there
    (switch-to-installed)
    (assert/assert-is-visible ".cp__plugins-item-card h3:has-text('Journals calendar')")

    ;; Close the dialog
    (close-plugins-dialog)

    ;; Check that the plugin is active in the main UI (e.g., check for a UI element added by the plugin
    (w/wait-for ".toolbar-plugins-manager-trigger")
    (w/click ".toolbar-plugins-manager-trigger")
    (assert/assert-is-visible "a.button[data-on-click=goToToday]")
    (w/click ".ui__dropdown-menu-content a.button[data-on-click=goToToday]")
    (assert/assert-is-visible ".is-today-page")))
