(ns logseq.e2e.multi-tabs-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures]]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.util :as util]
   [wally.main :as w]
   [wally.repl :as repl]
   [logseq.e2e.playwright-page :as pw-page]))

(use-fixtures :once fixtures/open-new-context)

(deftest multi-tabs-test
  (testing "create 3 local graphs"
    (pw-page/open-pages fixtures/*pw-ctx* 3)
    (is (= 3 (count (pw-page/get-pages fixtures/*pw-ctx*))))
    ;; (util/new-graph "graph1" false)
    ;; (util/new-graph "graph2" false)
    ;; (util/new-graph "graph3" false)
    ))
