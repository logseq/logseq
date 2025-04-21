(ns logseq.outliner-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures run-tests]]
   [garden.selectors :as s]
   [wally.main :as w]
   [wally.selectors :as ws]))

(defn open-page
  [f & {:keys [headless]
        :or {headless false}}]
  (w/with-page-open (w/make-page {:headless headless
                                  :persistent false})
    (f)))

(use-fixtures :once open-page)

(defn- wait-timeout
  [ms]
  (.waitForTimeout (w/get-page) ms))

(defn- input
  [text]
  (w/fill "*:focus" text))

(defn- search
  [text]
  (w/wait-for :#search-button {})
  (w/click :#search-button)
  (wait-timeout 100)
  (input text)
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

(deftest create-test-page-and-insert-blocks
  ;; Navigate to a page.
  (w/navigate "http://localhost:3001")
  (search "Test")
  ;; a page block and a child block
  (is (= 2 (count-elements ".ls-block")))
  (new-block {:current-text "first block"
              :next-text "second block"})
  (exit-edit)
  (is (= 3 (w/count* (w/-query ".ls-block")))))

(comment
  (run-tests 'logseq.outliner-test))
