(ns logseq.e2e.left-sidebar-basic-test
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.graph :as graph]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.page :as page]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each fixtures/new-logseq-page fixtures/validate-graph)

(defn- open-navigation-filter!
  []
  (when-not (w/visible? "#left-sidebar.is-open")
    (w/click "#left-menu"))
  (.hover (w/-query ".sidebar-header-container .sidebar-content-group .hd"))
  (w/click ".sidebar-header-container .as-edit"))

(defn- set-navigation!
  [label checked?]
  (open-navigation-filter!)
  (let [item (w/-query (format "[role='menuitemcheckbox']:text-is('%s')" label))]
    (when-not (= (str checked?) (.getAttribute item "aria-checked"))
      (w/click item)))
  (k/esc))

(defn- assert-class-navigations!
  []
  (doseq [[nav title] [["tasks" "Task"] ["assets" "Asset"]]]
    (let [selector (str ".sidebar-navigations ." nav)]
      (assert/assert-is-visible selector)
      (assert/assert-have-count selector 1)
      (w/click selector)
      (is (= title (page/get-page-name))))))

(deftest selected-class-navigations-survive-graph-lifecycle-test
  (testing "selected Tasks and Assets appear after toggling, reload, and graph changes"
    (set-navigation! "Tasks" true)
    (set-navigation! "Assets" true)
    (assert-class-navigations!)
    (doseq [[label nav] [["Tasks" "tasks"] ["Assets" "assets"]]]
      (set-navigation! label false)
      (assert/assert-have-count (str ".sidebar-navigations ." nav) 0)
      (set-navigation! label true)
      (assert/assert-is-visible (str ".sidebar-navigations ." nav)))
    (util/refresh-until-graph-loaded)
    (assert-class-navigations!)
    (graph/new-graph (str "sidebar-navigation-" (random-uuid)) false)
    (assert-class-navigations!)
    (graph/switch-graph "Demo" false false)
    (assert-class-navigations!)
    (set-navigation! "Tasks" false)
    (set-navigation! "Assets" false)))
