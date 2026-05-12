(ns logseq.e2e.right-sidebar-basic-test
  (:require
   [clojure.string :as string]
   [clojure.test :refer [deftest is testing use-fixtures]]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.util :as util]
   [wally.main :as w]))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each fixtures/new-logseq-page fixtures/validate-graph)

(defn- use-dark-neutral-theme!
  []
  (w/eval-js
   "window.logseq.api.set_theme_mode('dark');
    window.logseq.api.set_state_from_store(['ui/system-theme?'], false);
    window.logseq.api.set_state_from_store(['ui/radix-color'], 'none');")
  (util/wait-timeout 100))

(defn- right-sidebar-backgrounds
  []
  (-> (w/eval-js
       "(() => {
          const topbar = document.querySelector('.cp__right-sidebar-topbar');
          const inner = document.querySelector('.cp__right-sidebar-inner');
          return [
            getComputedStyle(topbar).backgroundColor,
            getComputedStyle(inner).backgroundColor,
            document.documentElement.dataset.theme,
            document.documentElement.dataset.color
          ].join('|');
        })()")
      (string/split #"\|")))

(deftest right-sidebar-topbar-uses-dark-neutral-background
  (testing "right sidebar header stays dark with neutral accent color"
    (use-dark-neutral-theme!)
    (w/click ".toggle-right-sidebar")
    (assert/assert-is-visible ".cp__right-sidebar.open .cp__right-sidebar-topbar")
    (assert/assert-is-visible ".cp__right-sidebar .sidebar-item")
    (let [[topbar-bg inner-bg theme color] (right-sidebar-backgrounds)]
      (is (= "dark" theme))
      (is (= "none" color))
      (is (= inner-bg topbar-bg)))))
