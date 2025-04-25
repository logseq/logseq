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
  (testing "edit on one tab, check all tab's blocks are same"
    (pw-page/open-pages fixtures/*pw-ctx* 3)
    (let [[p1 p2 p3 :as pages] (pw-page/get-pages fixtures/*pw-ctx*)
          blocks-to-add (map #(str "b" %) (range 10))]
      (is (= 3 (count pages)))
      (w/with-page p1
        (util/new-blocks blocks-to-add))
      (w/with-page p2
        (is (= (util/page-blocks-count) (count blocks-to-add))))
      (w/with-page p3
        (is (= (util/page-blocks-count) (count blocks-to-add)))))))
