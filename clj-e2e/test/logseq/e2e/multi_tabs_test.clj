(ns logseq.e2e.multi-tabs-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures]]
   [com.climate.claypoole :as cp]
   [logseq.e2e.block :as b]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.playwright-page :as pw-page]
   [logseq.e2e.util :as util]
   [wally.main :as w]
   [wally.repl :as repl]))

(use-fixtures :once fixtures/open-new-context)

(defn- add-blocks-and-check-on-other-tabs
  [new-blocks add-blocks-tab check-blocks-tabs]
  (let [new-blocks-count (count new-blocks)]
    (w/with-page add-blocks-tab
      (b/new-blocks new-blocks))
    (cp/prun!
     (count check-blocks-tabs)
     #(w/with-page %
        (is (= (util/page-blocks-count) new-blocks-count)))
     check-blocks-tabs)))

(deftest multi-tabs-test
  (testing "edit on one tab, check all tab's blocks are same"
    (pw-page/open-pages fixtures/*pw-ctx* 3)
    (let [[p1 p2 p3 :as pages] (pw-page/get-pages fixtures/*pw-ctx*)
          blocks-to-add (map #(str "b" %) (range 10))]
      (is (= 3 (count pages)))
      (w/with-page p1
        (b/new-blocks blocks-to-add))
      (w/with-page p2
        (is (= (util/page-blocks-count) (count blocks-to-add))))
      (w/with-page p3
        (is (= (util/page-blocks-count) (count blocks-to-add))))))

  ;; (testing "add new graphs, and do switching graphs on tabs"
  ;;   (let [[p1 p2 p3 :as pages] (pw-page/get-pages fixtures/*pw-ctx*)]
  ;;     (w/with-page p1
  ;;       (repl/pause))))
  )
