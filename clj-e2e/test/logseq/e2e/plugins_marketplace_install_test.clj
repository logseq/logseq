(ns logseq.e2e.plugins-marketplace-install-test
  "Kept apart from plugins-marketplace-test so the install starts from a fresh
  browser profile where Journals calendar is not installed yet."
  (:require [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.plugins :as plugins]
            [clojure.test :refer [deftest testing use-fixtures]]
            [wally.main :as w]))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each fixtures/new-logseq-page)

(deftest install-plugin-from-marketplace
  (testing "Install a plugin from the marketplace"
    (plugins/open-plugins-dialog)
    (plugins/switch-to-marketplace)

    ;; Journals calendar is a well-known plugin
    (plugins/search-plugin "Journals calendar")
    (w/wait-for ".cp__plugins-item-card h3:has-text('Journals calendar')" {:timeout 10000})

    (plugins/click-install-button)
    (plugins/wait-for-plugin-installed)
    (assert/assert-is-visible ".cp__plugins-item-card .ctl a.btn.disabled:has-text('Installed')")

    (plugins/switch-to-installed)
    (assert/assert-is-visible ".cp__plugins-item-card h3:has-text('Journals calendar')")

    (plugins/close-plugins-dialog)

    ;; The plugin's toolbar contribution is active in the main UI
    (w/wait-for ".toolbar-plugins-manager-trigger")
    (w/click ".toolbar-plugins-manager-trigger")
    (assert/assert-is-visible "a.button[data-on-click=goToToday]")
    (w/click ".ui__dropdown-menu-content a.button[data-on-click=goToToday]")
    (assert/assert-is-visible ".is-today-page")))
