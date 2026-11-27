(ns logseq.e2e.plugins-marketplace-test
  (:require [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.plugins :as plugins]
            [logseq.e2e.util :as util]
            [clojure.test :refer [deftest testing use-fixtures]]
            [wally.main :as w]))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each fixtures/new-logseq-page)

(deftest marketplace-tabs-search-and-state-test
  (testing "installed and marketplace tabs keep their own filters and visible results"
    (plugins/open-plugins-dialog)
    (assert/assert-is-visible "button:has-text('Installed')")
    (assert/assert-is-visible "button:has-text('Marketplace')")
    (plugins/switch-to-marketplace)
    (assert/assert-is-visible "button:has-text('Plugins')")
    (assert/assert-is-visible "button:has-text('Themes')")
    (plugins/search-plugin "Journals calendar")
    (w/wait-for
     ".cp__plugins-item-card h3:has-text('Journals calendar')"
     {:timeout 10000})
    (w/click "button:has-text('Themes')")
    (assert/assert-is-hidden
     ".cp__plugins-item-card h3:has-text('Journals calendar')")
    (w/click "button:has-text('Plugins')")
    (assert/assert-is-visible
     ".cp__plugins-item-card h3:has-text('Journals calendar')")
    (plugins/switch-to-installed)
    (assert/assert-is-visible ".cp__plugins-installed")
    (plugins/switch-to-marketplace)
    (assert/assert-is-visible
     ".cp__plugins-item-card h3:has-text('Journals calendar')")
    (plugins/close-plugins-dialog)
    (assert/assert-is-hidden ".cp__plugins-page")))

(deftest plugin-command-registration-follows-lifecycle-test
  (testing "a plugin command is registered once, removed on disable, and restored on enable"
    (plugins/ensure-journals-calendar-installed!)
    (plugins/set-journals-calendar-enabled! true)
    (plugins/close-plugins-dialog)
    (w/click ".toolbar-plugins-manager-trigger")
    (assert/assert-have-count
     ".ui__dropdown-menu-content a.button[data-on-click=goToToday]"
     1)
    (k/esc)

    (plugins/open-plugins-dialog)
    (plugins/switch-to-installed)
    (plugins/search-plugin "Journals calendar")
    (plugins/set-journals-calendar-enabled! false)
    (plugins/close-plugins-dialog)
    ;; The toolbar plugin trigger only renders while a plugin contributes toolbar items.
    (assert/assert-is-hidden ".toolbar-plugins-manager-trigger")

    (plugins/open-plugins-dialog)
    (plugins/switch-to-installed)
    (plugins/search-plugin "Journals calendar")
    (plugins/set-journals-calendar-enabled! true)
    (plugins/close-plugins-dialog)
    (w/click ".toolbar-plugins-manager-trigger")
    (assert/assert-have-count
     ".ui__dropdown-menu-content a.button[data-on-click=goToToday]"
     1)))

(deftest plugin-disable-enable-and-reload-test
  (testing "plugin UI contributions are completely removed and restored without duplicates"
    (plugins/ensure-journals-calendar-installed!)
    (plugins/set-journals-calendar-enabled! false)
    (plugins/close-plugins-dialog)
    (assert/assert-have-count "a.button[data-on-click=goToToday]" 0)

    (plugins/open-plugins-dialog)
    (plugins/switch-to-installed)
    (plugins/search-plugin "Journals calendar")
    (plugins/set-journals-calendar-enabled! true)
    (plugins/close-plugins-dialog)
    (w/click ".toolbar-plugins-manager-trigger")
    (assert/assert-have-count
     ".ui__dropdown-menu-content a.button[data-on-click=goToToday]"
     1)
    (k/esc)

    (util/refresh-until-graph-loaded)
    (w/click ".toolbar-plugins-manager-trigger")
    (assert/assert-have-count
     ".ui__dropdown-menu-content a.button[data-on-click=goToToday]"
     1)))
