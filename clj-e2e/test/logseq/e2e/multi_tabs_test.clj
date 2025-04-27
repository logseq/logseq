(ns logseq.e2e.multi-tabs-test
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.block :as b]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.graph :as graph]
            [logseq.e2e.playwright-page :as pw-page]
            [logseq.e2e.util :as util]
            [wally.main :as w]
            [wally.repl :as repl]))

(use-fixtures :once fixtures/open-new-context)

(defn- add-blocks-and-check-on-other-tabs
  [new-blocks add-blocks-tab check-blocks-tabs]
  (w/with-page add-blocks-tab
    (b/new-blocks new-blocks))
  (run!
   #(w/with-page %
      (b/assert-blocks-visible new-blocks))
   check-blocks-tabs))

(deftest multi-tabs-test
  (testing "edit on one tab, check all tab's blocks are same"
    (pw-page/open-pages fixtures/*pw-ctx* 3)
    (let [[p1 p2 p3 :as pages] (pw-page/get-pages fixtures/*pw-ctx*)
          blocks-to-add (map #(str "b" %) (range 10))]
      (is (= 3 (count pages)))
      (add-blocks-and-check-on-other-tabs blocks-to-add p1 [p2 p3])))

  (comment
    ;; this test is failing, produce err:
    ;;Error caught by UI!
    ;;Error: Assert failed: (db/db? db)
    ;; ...
    (testing "add new graphs, and do switching graphs on tabs"
      (let [[p1 p2 p3 :as pages] (pw-page/get-pages fixtures/*pw-ctx*)]
        (w/with-page p1
          (graph/new-graph "graph1" false)
          (graph/new-graph "graph2" false)
          (graph/new-graph "graph3" false))
        (w/with-page p2
          ;; FIXME: since all-graphs isn't auto-update when other tabs add new graphs, so refresh here
          (w/refresh)
          (util/goto-journals)
          (assert/assert-in-normal-mode?)
          (graph/switch-graph "graph1"))
        (w/with-page p3
          ;; FIXME: since all-graphs isn't auto-update when other tabs add new graphs, so refresh here
          (w/refresh)
          (util/goto-journals)
          (assert/assert-in-normal-mode?)
          (graph/switch-graph "graph1"))
        (w/with-page p1
          (util/goto-journals)
          (assert/assert-in-normal-mode?)
          (graph/switch-graph "graph1"))
        (let [graph1-new-blocks1 (map #(str "graph1-b1-" %) (range 5))
              graph1-new-blocks2 (map #(str "graph1-b2-" %) (range 5))
              graph1-new-blocks3 (map #(str "graph1-b3-" %) (range 5))]
          (add-blocks-and-check-on-other-tabs graph1-new-blocks1 p1 [p2 p3]))))))
