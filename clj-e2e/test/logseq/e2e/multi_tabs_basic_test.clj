(ns logseq.e2e.multi-tabs-basic-test
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

  (testing "add new graphs and switch graphs + edit + check on tabs"
    (let [[p1 p2 p3] (pw-page/get-pages fixtures/*pw-ctx*)]
      (letfn [(switch-to-graph-then-edit-and-check [graph-name]
                (w/with-page p2
                  (util/goto-journals)
                  (assert/assert-in-normal-mode?)
                  (graph/switch-graph graph-name false))
                (w/with-page p3
                  (util/goto-journals)
                  (assert/assert-in-normal-mode?)
                  (graph/switch-graph graph-name false))
                (w/with-page p1
                  (util/goto-journals)
                  (assert/assert-in-normal-mode?)
                  (graph/switch-graph graph-name false))
                (let [graph-new-blocks (map #(str graph-name "-b1-" %) (range 5))]
                  (add-blocks-and-check-on-other-tabs graph-new-blocks p1 [p2 p3])))]
        (w/with-page p1
          (graph/new-graph "graph1" false)
          (graph/new-graph "graph2" false)
          (graph/new-graph "graph3" false))
        ;; FIXME: since all-graphs isn't auto-update when other tabs add new graphs, so refresh here
        (w/with-page p2 (util/refresh-until-graph-loaded))
        (w/with-page p3 (util/refresh-until-graph-loaded))
        (switch-to-graph-then-edit-and-check "graph1")
        (switch-to-graph-then-edit-and-check "graph2")
        (switch-to-graph-then-edit-and-check "graph3")))))
