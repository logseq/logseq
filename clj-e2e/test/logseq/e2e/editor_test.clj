(ns logseq.e2e.editor-test
  (:require
   [clojure.string :as string]
   [clojure.test :refer [deftest testing is use-fixtures]]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.keyboard :as k]
   [logseq.e2e.util :as util]
   [wally.main :as w]))

(use-fixtures :once fixtures/open-page)

(deftest commands-test
  (testing "/command trigger popup"
    (util/new-page "Test")
    (util/save-block "b1")
    (util/type " /")
    (w/wait-for ".ui__popover-content")
    (is (some? (w/find-one-by-text "span" "Node reference")))
    (k/backspace)
    (w/wait-for-not-visible ".ui__popover-content"))

  (testing "Node reference"
    (testing "Page reference"
      (util/new-block "/")
      (util/type "Node eferen")
      (w/wait-for ".ui__popover-content")
      (k/enter)
      (util/type "Another page")
      (k/enter)
      (is (= "[[Another page]]" (util/get-edit-content)))
      (util/exit-edit)
      (is (= "Another page" (util/get-text "a.page-ref"))))
    (testing "Block reference"
      (util/new-block "/")
      (util/type "Node eferen")
      (w/wait-for ".ui__popover-content")
      (k/enter)
      (util/type "b1")
      (util/wait-timeout 300)
      (k/enter)
      (is (string/includes? (util/get-edit-content) "[["))
      (util/exit-edit)
      (is (= "b1" (util/get-text ".block-ref"))))))
