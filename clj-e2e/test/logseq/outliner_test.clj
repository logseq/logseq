(ns logseq.outliner-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures]]
   [logseq.fixtures :as fixtures]
   [logseq.util :as util :refer [press]]
   [wally.main :as w]))

(use-fixtures :once fixtures/open-page)

(deftest create-test-page-and-insert-blocks
  (util/new-page "p1")
  ;; a page block and a child block
  (is (= 2 (util/blocks-count)))
  (util/new-blocks ["first block" "second block"])
  (util/exit-edit)
  (is (= 3 (util/blocks-count))))

(deftest indent-and-outdent-test
  (util/new-page "p2")
  (util/new-blocks ["b1" "b2"])
  (testing "simple indent and outdent"
    (util/indent)
    (util/outdent))

  (testing "indent a block with its children"
    (util/new-block "b3")
    (util/indent)
    (press "ArrowUp")
    (util/indent)
    (util/exit-edit)
    (let [[x1 x2 x3] (map (comp first util/bounding-xy #(w/find-one-by-text "span" %)) ["b1" "b2" "b3"])]
      (is (< x1 x2 x3))))

  (testing "unindent a block with its children"
    (util/open-last-block)
    (util/new-blocks ["b4" "b5"])
    (util/indent)
    (util/press "ArrowUp")
    (util/outdent)
    (util/exit-edit)
    (let [[x2 x3 x4 x5] (map (comp first util/bounding-xy #(w/find-one-by-text "span" %)) ["b2" "b3" "b4" "b5"])]
      (is (and (= x2 x4) (= x3 x5) (< x2 x3))))))

(deftest move-up-down-test
  (util/new-page "p3")
  (util/new-blocks ["b1" "b2" "b3" "b4"])
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
    (util/new-blocks ["b1" "b2" "b3" "b4"])
    (util/delete-blocks)                   ; delete b4
    (util/repeat-keyboard 2 "Shift+ArrowUp") ; select b3 and b2
    (util/delete-blocks)
    (is (= "b1" (util/get-edit-content)))
    (is (= 1 (util/page-blocks-count))))

  (testing "Delete block with its children"
    (util/new-page "p5")
    (util/new-blocks ["b1" "b2" "b3" "b4"])
    (util/indent)
    (press "ArrowUp")
    (util/indent)
    (press "ArrowUp")
    (util/delete-blocks)
    (is (= "b1" (util/get-edit-content)))
    (is (= 1 (util/page-blocks-count)))))
