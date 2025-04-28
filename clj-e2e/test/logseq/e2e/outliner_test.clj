(ns logseq.e2e.outliner-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures]]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.keyboard :as k]
   [logseq.e2e.block :as b]
   [logseq.e2e.util :as util]
   [wally.main :as w]))

(use-fixtures :once fixtures/open-page)

(deftest create-test-page-and-insert-blocks
  (util/new-page "p1")
  ;; a page block and a child block
  (is (= 2 (util/blocks-count)))
  (b/new-blocks ["first block" "second block"])
  (util/exit-edit)
  (is (= 3 (util/blocks-count))))

(deftest indent-and-outdent-test
  (util/new-page "p2")
  (b/new-blocks ["b1" "b2"])
  (testing "simple indent and outdent"
    (util/indent)
    (util/outdent))

  (testing "indent a block with its children"
    (b/new-block "b3")
    (util/indent)
    (k/arrow-up)
    (util/indent)
    (util/exit-edit)
    (let [[x1 x2 x3] (map (comp first util/bounding-xy #(w/find-one-by-text "span" %)) ["b1" "b2" "b3"])]
      (is (< x1 x2 x3))))

  (testing "unindent a block with its children"
    (b/open-last-block)
    (b/new-blocks ["b4" "b5"])
    (util/indent)
    (k/arrow-up)
    (util/outdent)
    (util/exit-edit)
    (let [[x2 x3 x4 x5] (map (comp first util/bounding-xy #(w/find-one-by-text "span" %)) ["b2" "b3" "b4" "b5"])]
      (is (and (= x2 x4) (= x3 x5) (< x2 x3))))))

(deftest move-up-down-test
  (util/new-page "p3")
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

(deftest delete-test
  (testing "Delete blocks case 1"
    (util/new-page "p4")
    (b/new-blocks ["b1" "b2" "b3" "b4"])
    (b/delete-blocks)                   ; delete b4
    (util/repeat-keyboard 2 "Shift+ArrowUp") ; select b3 and b2
    (b/delete-blocks)
    (is (= "b1" (util/get-edit-content)))
    (is (= 1 (util/page-blocks-count))))

  (testing "Delete block with its children"
    (util/new-page "p5")
    (b/new-blocks ["b1" "b2" "b3" "b4"])
    (util/indent)
    (k/arrow-up)
    (util/indent)
    (k/arrow-up)
    (b/delete-blocks)
    (is (= "b1" (util/get-edit-content)))
    (is (= 1 (util/page-blocks-count)))))
