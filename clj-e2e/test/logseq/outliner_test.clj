(ns logseq.outliner-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures run-tests run-test]]
   [garden.selectors :as s]
   [wally.main :as w]
   [wally.repl :as repl]
   [wally.selectors :as ws]))

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

(defn- input
  [text]
  (w/fill "*:focus" text))

(def keyboard w/keyboard-press)

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

(defn- new-block
  [& {:keys [current-text next-text]}]
  (when current-text (input current-text))
  (keyboard "Enter")
  (when next-text (input next-text)))

(defn exit-edit
  []
  (keyboard "Escape"))

(defn- count-elements
  [q]
  (w/count* (w/-query q)))

(defn- blocks-count
  []
  (count-elements ".ls-block"))

(defn- bounding-xy
  [locator]
  (let [box (.boundingBox locator)]
    [(.-x box) (.-y box)]))

(defn- indent-outdent
  [indent?]
  (let [editor (w/-query ".editor-wrapper textarea")
        [x1 _] (bounding-xy editor)
        _ (keyboard (if indent? "Tab" "Shift+Tab"))
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
  (keyboard "Escape")
  (w/click (last (w/query ".ls-page-blocks .ls-block .block-content"))))

(defn- repeat-keyboard
  [n shortcut]
  (dotimes [_i n]
    (keyboard shortcut)))

(defn- get-page-blocks-contents
  []
  (w/all-text-contents ".ls-page-blocks .ls-block .block-title-wrap"))

(deftest create-test-page-and-insert-blocks
  (new-page "Test")
  ;; a page block and a child block
  (is (= 2 (blocks-count)))
  (new-block {:current-text "first block"
              :next-text "second block"})
  (exit-edit)
  (is (= 3 (blocks-count)))
  ;; Pause to use the repl, e.g. example in the comment below
  ;; (repl/pause)
  )

(deftest indent-and-outdent-test
  (new-page "indent outdent test")
  (new-block {:current-text "b1"
              :next-text "b2"})
  (testing "simple indent and outdent"
    (indent)
    (outdent))

  (testing "indent a block with its children"
    (new-block {:next-text "b3"})
    (indent)
    (keyboard "ArrowUp")
    (indent)
    (exit-edit)
    (let [[x1 x2 x3] (map (comp first bounding-xy #(w/find-one-by-text "span" %)) ["b1" "b2" "b3"])]
      (is (< x1 x2 x3))))

  (testing "unindent a block with its children"
    (open-last-block)
    (new-block {:next-text "b4"})
    (new-block {:next-text "b5"})
    (indent)
    (keyboard "ArrowUp")
    (outdent)
    (exit-edit)
    (let [[x2 x3 x4 x5] (map (comp first bounding-xy #(w/find-one-by-text "span" %)) ["b2" "b3" "b4" "b5"])]
      (is (and (= x2 x4) (= x3 x5) (< x2 x3))))))

(deftest move-up-down-test
  (new-page "up down test")
  (new-block {:current-text "b1"
              :next-text "b2"})
  (doseq [text ["b3" "b4"]]
    (new-block {:next-text text}))
  (repeat-keyboard 2 "Shift+ArrowUp")
  (let [contents (get-page-blocks-contents)]
    (is (= contents ["b1" "b2" "b3" "b4"])))
  (repeat-keyboard 2 "ControlOrMeta+Shift+ArrowUp")
  (let [contents (get-page-blocks-contents)]
    (is (= contents ["b3" "b4" "b1" "b2"])))
  (repeat-keyboard 2 "ControlOrMeta+Shift+ArrowDown")
  (let [contents (get-page-blocks-contents)]
    (is (= contents ["b1" "b2" "b3" "b4"]))))

(comment

  (repl/resume)

  (future (run-tests 'logseq.outliner-test))

  (future (run-test move-up-down-test))

  (repl/with-page
    ;; into edit mode
    (new-block {:next-text "third block"}))

  (repl/with-page
    ;; do anything
    ))
