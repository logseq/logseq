(ns logseq.e2e.settings-basic-test
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [logseq.e2e.api :refer [ls-api-call!]]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.locator :as loc]
            [logseq.e2e.page :as page]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each fixtures/new-logseq-page fixtures/validate-graph)

(def ^:private preferred-format "yyyy-MM-dd")

(defn- open-settings-editor!
  []
  (w/click ".toolbar-dots-btn")
  (w/click (loc/filter "[role='menuitem']" :has-text "Settings"))
  (w/wait-for "#settings")
  (w/click ".settings-menu-item[data-id='editor']")
  (w/wait-for ".panel-wrap.is-editor select.form-select"))

(defn- date-format-select
  []
  (w/-query ".panel-wrap.is-editor select.form-select"))

(defn- preferred-date-format
  []
  (get (ls-api-call! :app.getUserConfigs) "preferredDateFormat"))

(deftest preferred-date-format-survives-reload-test
  (testing "Settings > Editor preferred date format is restored on startup"
    (open-settings-editor!)
    (is (not= preferred-format (preferred-date-format))
        "The test graph must start on a different date format than the one we persist.")
    (.selectOption (date-format-select) preferred-format)
    (assert/assert-is-visible
     (w/get-by-text "Please refresh the app for this change to take effect"))
    (assert/assert-is-hidden "#settings")
    (is (= preferred-format (preferred-date-format)))
    (util/refresh-until-graph-loaded)
    (is (= preferred-format (preferred-date-format))
        "Startup restore must load the persisted format into UI state.")
    (open-settings-editor!)
    (is (= preferred-format (.inputValue (date-format-select)))
        "The Settings dropdown must keep the persisted format after reload.")
    (ls-api-call! :editor.createJournalPage "2026-01-15")
    (page/goto-page "2026-01-15")
    (is (= "2026-01-15" (page/get-page-name))
        "A journal created after reload must use the persisted title format."))))
