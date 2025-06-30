(ns logseq.e2e.outliner-basic-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures]]
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

(defn create-test-page-and-insert-blocks []
  ;; a page block and a child block
  (is (= 2 (util/blocks-count)))
  (b/new-blocks ["first block" "second block"])
  (util/exit-edit)
  (is (= 3 (util/blocks-count))))

(defn indent-and-outdent []
  (b/new-blocks ["b1" "b2"])
  (testing "simple indent and outdent"
    (b/indent)
    (b/outdent))

  (testing "indent a block with its children"
    (b/new-block "b3")
    (b/indent)
    (k/arrow-up)
    (b/indent)
    (util/exit-edit)
    (let [[x1 x2 x3] (map (comp first util/bounding-xy #(w/find-one-by-text "span" %)) ["b1" "b2" "b3"])]
      (is (< x1 x2 x3))))

  (testing "unindent a block with its children"
    (b/open-last-block)
    (b/new-blocks ["b4" "b5"])
    (b/indent)
    (k/arrow-up)
    (b/outdent)
    (util/exit-edit)
    (let [[x2 x3 x4 x5] (map (comp first util/bounding-xy #(w/find-one-by-text "span" %)) ["b2" "b3" "b4" "b5"])]
      (is (and (= x2 x4) (= x3 x5) (< x2 x3))))))

(defn indent-outdent-embed-page []
  (p/new-page "Page embed")
  (b/new-blocks ["b1" "b2"])
  (p/new-page "Page testing")
  (b/new-blocks ["b3" ""])
  (util/input-command "Node embed")
  (util/press-seq "Page embed" {:delay 60})
  (k/press "Enter" {:delay 60})
  (util/exit-edit)
  (b/new-blocks ["b4"])
  (b/outdent)
  (b/indent)
  (util/exit-edit)
  (let [[x2 x3 x4] (map (comp first util/bounding-xy #(w/find-one-by-text "span" %)) ["b2" "b3" "b4"])]
    (is (= x2 x4))
    (is (< x3 x2))))

(defn move-up-down []
  (b/new-blocks ["b1" "b2" "b3" "b4"])
  (util/repeat-keyboard 2 "Shift+ArrowUp")
  (let [contents (util/get-page-blocks-contents)]
    (is (= contents ["b1" "b2" "b3" "b4"])))
  (util/repeat-keyboard 2 (str (if util/mac? "Meta" "Alt") "+Shift+ArrowUp"))
  (let [contents (util/get-page-blocks-contents)]
    (is (= contents ["b3" "b4" "b1" "b2"])))
  (util/repeat-keyboard 2 (str (if util/mac? "Meta" "Alt") "+Shift+ArrowDown"))
  (let [contents (util/get-page-blocks-contents)]
    (is (= contents ["b1" "b2" "b3" "b4"]))))

(defn delete []
  (testing "Delete blocks case 1"
    (b/new-blocks ["b1" "b2" "b3" "b4"])
    (b/delete-blocks)                        ; delete b4
    (util/repeat-keyboard 2 "Shift+ArrowUp") ; select b3 and b2
    (b/delete-blocks)
    (is (= "b1" (util/get-edit-content)))
    (is (= 1 (util/page-blocks-count)))))

(defn delete-end []
  (testing "Delete at end"
    (b/new-blocks ["b1" "b2" "b3"])
    (k/arrow-up)
    (k/delete)
    (is (= "b2b3" (util/get-edit-content)))
    (is (= 2 (util/page-blocks-count)))))

(defn delete-test-with-children []
  (testing "Delete block with its children"
    (b/new-blocks ["b1" "b2" "b3" "b4"])
    (b/indent)
    (k/arrow-up)
    (b/indent)
    (k/arrow-up)
    (b/delete-blocks)
    (is (= "b1" (util/get-edit-content)))
    (is (= 1 (util/page-blocks-count)))))

(deftest create-test-page-and-insert-blocks-test
  (create-test-page-and-insert-blocks))

(deftest indent-and-outdent-test
  (indent-and-outdent))

(deftest indent-outdent-embed-page-test
  (indent-outdent-embed-page))

(deftest move-up-down-test
  (move-up-down))

(deftest delete-test
  (delete))

(deftest delete-end-test
  (delete-end))

(deftest delete-test-with-children-test
  (delete-test-with-children))
