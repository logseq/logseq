(ns logseq.e2e.undo-redo-test
  (:require
   [clojure.set :as set]
   [clojure.test :refer [deftest testing is use-fixtures]]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.block :as b]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.keyboard :as k]
   [logseq.e2e.page :as p]
   [logseq.e2e.util :as util]
   [wally.main :as w]
   [wally.repl :as repl]))

(use-fixtures :once fixtures/open-page)

(use-fixtures :each
  fixtures/new-logseq-page
  fixtures/validate-graph)

(deftest undo-redo-paste
  (testing "Undo redo paste blocks"
    (b/new-blocks ["b1" "b2"])
    (b/select-blocks 2)
    (b/copy)
    (b/new-block "")
    (b/paste)
    (util/exit-edit)
    (is (= ["b1" "b2" "b1" "b2"] (util/get-page-blocks-contents)))
    (b/undo)
    (util/exit-edit)
    (is (= ["b1" "b2"] (util/get-page-blocks-contents)))
    (b/redo)
    (util/exit-edit)
    (is (= ["b1" "b2" "b1" "b2"] (util/get-page-blocks-contents)))))
