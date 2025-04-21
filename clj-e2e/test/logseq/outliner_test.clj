(ns logseq.outliner-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures run-tests]]
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

(defn- new-page
  [title]
  (w/wait-for :#search-button {})
  (w/click :#search-button)
  (wait-timeout 100)
  (input title)
  (wait-timeout 100)
  (w/click [(ws/text "Create page") (ws/nth= "0")])
  ;; FIXME: Enter doesn't work
  ;; (w/keyboard-press "Enter")
  (wait-timeout 100))

(defn- new-block
  [& {:keys [current-text next-text]}]
  (when current-text (input current-text))
  (w/keyboard-press "Enter")
  (when next-text (input next-text)))

(defn exit-edit
  []
  (w/keyboard-press "Escape"))

(defn- count-elements
  [q]
  (w/count* (w/-query q)))

(defn- blocks-count
  []
  (count-elements ".ls-block"))

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

(defn- bounding-xy
  [locator]
  (let [box (.boundingBox locator)]
    [(.-x box) (.-y box)]))

(defn- indent-outdent
  [indent?]
  (let [editor (w/-query ".editor-wrapper textarea")
        [x1 _] (bounding-xy editor)
        _ (w/keyboard-press (if indent? "Tab" "Shift+Tab"))
        [x2 _] (bounding-xy editor)]
    (if indent?
      (is (< x1 x2))
      (is (> x1 x2)))))

(deftest indent-and-outdent
  (new-page "indent outdent test")
  (new-block {:current-text "b1"
              :next-text "b2"})
  (indent-outdent true)
  (indent-outdent false))

(comment

  (do (repl/resume)
      (future (run-tests 'logseq.outliner-test)))

  (repl/with-page
    ;; into edit mode
    (new-block {:next-text "third block"}))

  ;; FIXME: properly close browser/playwright/page
  (repl/with-page
    (let [page (w/get-page)]
      (.close page))))
