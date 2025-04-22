(ns logseq.outliner-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures]]
   [logseq.util :as util :refer [press]]
   [wally.main :as w]))

;; TODO: change headless to true on CI
(defn open-page
  [f & {:keys [headless]
        :or {headless false}}]
  (w/with-page-open
    (w/make-page {:headless headless
                  :persistent false})
    (w/navigate "http://localhost:3001")
    (f)))

(use-fixtures :once open-page)

(deftest create-test-page-and-insert-blocks
  (util/new-page "Test")
  ;; a page block and a child block
  (is (= 2 (util/blocks-count)))
  (util/new-blocks ["first block" "second block"])
  (util/exit-edit)
  (is (= 3 (util/blocks-count))))

(deftest indent-and-outdent-test
  (util/new-page "indent outdent test")
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
  (util/new-page "up down test")
  (util/new-blocks ["b1" "b2" "b3" "b4"])
  (util/repeat-keyboard 2 "Shift+ArrowUp")
  (let [contents (util/get-page-blocks-contents)]
    (is (= contents ["b1" "b2" "b3" "b4"])))
  (util/repeat-keyboard 2 "ControlOrMeta+Shift+ArrowUp")
  (let [contents (util/get-page-blocks-contents)]
    (is (= contents ["b3" "b4" "b1" "b2"])))
  (util/repeat-keyboard 2 "ControlOrMeta+Shift+ArrowDown")
  (let [contents (util/get-page-blocks-contents)]
    (is (= contents ["b1" "b2" "b3" "b4"]))))

(deftest delete-test
  (testing "Delete blocks case 1"
    (util/new-page "delete test 1")
    (util/new-blocks ["b1" "b2" "b3" "b4"])
    (util/delete-blocks)                   ; delete b4
    (util/repeat-keyboard 2 "Shift+ArrowUp") ; select b3 and b2
    (util/delete-blocks)
    (is (= "b1" (util/get-edit-content)))
    (is (= 1 (util/page-blocks-count))))

  (testing "Delete block with its children"
    (util/new-page "delete test 2")
    (util/new-blocks ["b1" "b2" "b3" "b4"])
    (util/indent)
    (press "ArrowUp")
    (util/indent)
    (press "ArrowUp")
    (util/delete-blocks)
    (is (= "b1" (util/get-edit-content)))
    (is (= 1 (util/page-blocks-count)))))

(comment

  (require '[wally.repl :as repl])
  (require '[clojure.test :refer [run-tests run-test]])

  ;; You can put `(repl/pause)` in any test to pause the tests,
  ;; this allows us to continue experimenting with the current page.
  (repl/pause)

  ;; To resume the tests, close the page/context/browser
  (repl/resume)

  ;; Run all the tests in specific ns with `future` to not block repl
  (future (run-tests 'logseq.outliner-test))

  ;; Run specific test
  (future (run-test delete-test))

  ;; after the test has been paused, you can do anything with the current page like this
  (repl/with-page
    ;; do anything
    ))
