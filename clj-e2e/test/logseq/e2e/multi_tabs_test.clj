(ns logseq.e2e.multi-tabs-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures]]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.playwright-page :as pw-page]
   [logseq.e2e.util :as util]
   [wally.main :as w]
   [wally.repl :as repl]))

(use-fixtures :once fixtures/open-new-context)

(deftest multi-tabs-test
  (testing "create 3 local graphs"
    (pw-page/open-pages fixtures/*pw-ctx* 3)
    (let [pages (pw-page/get-pages fixtures/*pw-ctx*)
          p1 (first pages)]
      (is (= 3 (count pages)))
      (w/with-page p1
        (repl/pause)))))
