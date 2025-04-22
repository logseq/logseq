(ns logseq.outliner-test
  (:require
   [clojure.string :as string]
   [clojure.test :refer [deftest testing is use-fixtures run-tests run-test]]
   [garden.selectors :as s]
   [wally.main :as w]
   [wally.repl :as repl]
   [wally.selectors :as ws])
  (:import (com.microsoft.playwright.assertions PlaywrightAssertions)))

(def assert-that PlaywrightAssertions/assertThat)

(defn open-page
  [f & {:keys [headless]
        :or {headless false}}]
  (w/with-page-open
    (w/make-page {:headless headless
                  :persistent false})
    (w/navigate "http://localhost:3001")
    (f)))

(use-fixtures :once open-page)

(defn- wait-timeout
  [ms]
  (.waitForTimeout (w/get-page) ms))

(defn- get-active-element
  []
  (w/-query "*:focus"))

(defn- get-editor
  []
  (let [klass ".editor-wrapper textarea"
        editor (w/-query klass)]
    (when (w/visible? klass)
      editor)))

(defn- input
  [text]
  (w/fill "*:focus" text))

(def press w/keyboard-press)

(defn- new-page
  [title]
  (w/wait-for :#search-button {})
  (w/click :#search-button)
  (wait-timeout 100)
  (input title)
  (wait-timeout 100)
  (w/click [(ws/text "Create page") (ws/nth= "0")])
  ;; FIXME: Enter doesn't work
  ;; (keyboard "Enter")
  (wait-timeout 100))

(defn- count-elements
  [q]
  (w/count* (w/-query q)))

(defn- blocks-count
  "Blocks count including page title"
  []
  (count-elements ".ls-block"))

(defn- page-blocks-count
  []
  (count-elements ".ls-page-blocks .ls-block"))

(defn- new-block
  [title]
  (press "Enter")
  (input title))

(defn- save-block
  [text]
  (input text))

(defn exit-edit
  []
  (press "Escape"))

(defn- delete-blocks
  []
  (let [c (blocks-count)]
    (prn :debug :editor (get-editor))
    (if (get-editor)
      (do
        (exit-edit)
        (press "Backspace"))
      (press "Backspace"))
    (is (> c (blocks-count)))))

(defn- get-edit-content
  []
  (when-let [editor (get-editor)]
    (.textContent editor)))

;; TODO: support tree
(defn- new-blocks
  [titles]
  (let [value (get-edit-content)]
    (if (string/blank? value)           ; empty block
      (do
        (save-block (first titles))
        (doseq [title (rest titles)]
          (new-block title)))
      (doseq [title titles]
        (new-block title)))))

(defn- bounding-xy
  [locator]
  (let [box (.boundingBox locator)]
    [(.-x box) (.-y box)]))

(defn- indent-outdent
  [indent?]
  (let [editor (get-editor)
        [x1 _] (bounding-xy editor)
        _ (press (if indent? "Tab" "Shift+Tab"))
        [x2 _] (bounding-xy editor)]
    (if indent?
      (is (< x1 x2))
      (is (> x1 x2)))))

(defn- indent
  []
  (indent-outdent true))

(defn- outdent
  []
  (indent-outdent false))

(defn- open-last-block
  []
  (press "Escape")
  (w/click (last (w/query ".ls-page-blocks .ls-block .block-content"))))

(defn- repeat-keyboard
  [n shortcut]
  (dotimes [_i n]
    (press shortcut)))

(defn- get-page-blocks-contents
  []
  (w/all-text-contents ".ls-page-blocks .ls-block .block-title-wrap"))

(deftest create-test-page-and-insert-blocks
  (new-page "Test")
  ;; a page block and a child block
  (is (= 2 (blocks-count)))
  (new-blocks ["first block" "second block"])
  (exit-edit)
  (is (= 3 (blocks-count)))
  ;; Pause to use the repl, e.g. example in the comment below
  ;; (repl/pause)
  )

(deftest indent-and-outdent-test
  (new-page "indent outdent test")
  (new-blocks ["b1" "b2"])
  (testing "simple indent and outdent"
    (indent)
    (outdent))

  (testing "indent a block with its children"
    (new-block "b3")
    (indent)
    (press "ArrowUp")
    (indent)
    (exit-edit)
    (let [[x1 x2 x3] (map (comp first bounding-xy #(w/find-one-by-text "span" %)) ["b1" "b2" "b3"])]
      (is (< x1 x2 x3))))

  (testing "unindent a block with its children"
    (open-last-block)
    (new-blocks ["b4" "b5"])
    (indent)
    (press "ArrowUp")
    (outdent)
    (exit-edit)
    (let [[x2 x3 x4 x5] (map (comp first bounding-xy #(w/find-one-by-text "span" %)) ["b2" "b3" "b4" "b5"])]
      (is (and (= x2 x4) (= x3 x5) (< x2 x3))))))

(deftest move-up-down-test
  (new-page "up down test")
  (new-blocks ["b1" "b2" "b3" "b4"])
  (repeat-keyboard 2 "Shift+ArrowUp")
  (let [contents (get-page-blocks-contents)]
    (is (= contents ["b1" "b2" "b3" "b4"])))
  (repeat-keyboard 2 "ControlOrMeta+Shift+ArrowUp")
  (let [contents (get-page-blocks-contents)]
    (is (= contents ["b3" "b4" "b1" "b2"])))
  (repeat-keyboard 2 "ControlOrMeta+Shift+ArrowDown")
  (let [contents (get-page-blocks-contents)]
    (is (= contents ["b1" "b2" "b3" "b4"]))))

(deftest delete-test
  (testing "Delete blocks case 1"
    (new-page "delete test 1")
    (new-blocks ["b1" "b2" "b3" "b4"])
    (delete-blocks)                   ; delete b4
    (repeat-keyboard 2 "Shift+ArrowUp") ; select b3 and b2
    (delete-blocks)
    (is (= "b1" (get-edit-content)))
    (is (= 1 (page-blocks-count))))

  (testing "Delete block with its children"
    (new-page "delete test 2")
    (new-blocks ["b1" "b2" "b3" "b4"])
    (indent)
    (press "ArrowUp")
    (indent)
    (press "ArrowUp")
    (delete-blocks)
    (is (= "b1" (get-edit-content)))
    (is (= 1 (page-blocks-count)))))

(comment

  (repl/resume)

  (future (run-tests 'logseq.outliner-test))

  (future (run-test delete-test))

  (repl/with-page
    (new-block "third block"))

  (repl/with-page
    ;; do anything
    ))
