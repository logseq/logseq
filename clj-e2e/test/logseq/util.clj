(ns logseq.util
  (:refer-clojure :exclude [type])
  (:require [clojure.string :as string]
            [clojure.test :refer [is]]
            [wally.main :as w]
            [wally.selectors :as ws])
  (:import (com.microsoft.playwright.assertions PlaywrightAssertions)))

(def assert-that PlaywrightAssertions/assertThat)

(defn wait-timeout
  [ms]
  (.waitForTimeout (w/get-page) ms))

(defn get-active-element
  []
  (w/-query "*:focus"))

(defn get-editor
  []
  (let [klass ".editor-wrapper textarea"
        editor (w/-query klass)]
    (when (w/visible? klass)
      editor)))

(defn get-edit-block-container
  []
  (first (w/query ".ls-block" {:has (w/-query ".editor-wrapper textarea")})))

(defn input
  "Notice this will replace the existing input value with `text`"
  [text]
  (w/fill "*:focus" text))

(defn type
  [text]
  (let [input-node (w/-query "*:focus")]
    (.type input-node text)))

(def press w/keyboard-press)

(defn search
  [text]
  (w/click :#search-button)
  (w/fill ".cp__cmdk-search-input" text))

(defn new-page
  [title]
  ;; Question: what's the best way to close all the popups?
  ;; close popup, exit editing
  (search title)
  (w/click [(ws/text "Create page") (ws/nth= "0")])
  (w/wait-for ".editor-wrapper textarea"))

(defn count-elements
  [q]
  (w/count* (w/-query q)))

(defn blocks-count
  "Blocks count including page title"
  []
  (count-elements ".ls-block"))

(defn page-blocks-count
  []
  (count-elements ".ls-page-blocks .ls-block"))

(defn new-block
  [title]
  (press "Enter")
  (input title))

(defn save-block
  [text]
  (input text))

(defn exit-edit
  []
  (press "Escape"))

(defn delete-blocks
  "Delete the current block if in editing mode, otherwise, delete all the selected blocks."
  []
  (let [editor (get-editor)]
    (when editor (exit-edit))
    (press "Backspace")))

(defn get-text
  [locator]
  (if (string? locator)
    (.textContent (w/-query locator))
    (.textContent locator)))

(defn get-edit-content
  []
  (when-let [editor (get-editor)]
    (get-text editor)))

;; TODO: support tree
(defn new-blocks
  [titles]
  (let [value (get-edit-content)]
    (if (string/blank? value)           ; empty block
      (do
        (save-block (first titles))
        (doseq [title (rest titles)]
          (new-block title)))
      (doseq [title titles]
        (new-block title)))))

(defn bounding-xy
  [locator]
  (let [box (.boundingBox locator)]
    [(.-x box) (.-y box)]))

(defn indent-outdent
  [indent?]
  (let [editor (get-editor)
        [x1 _] (bounding-xy editor)
        _ (press (if indent? "Tab" "Shift+Tab"))
        [x2 _] (bounding-xy editor)]
    (if indent?
      (is (< x1 x2))
      (is (> x1 x2)))))

(defn indent
  []
  (indent-outdent true))

(defn outdent
  []
  (indent-outdent false))

(defn open-last-block
  []
  (w/click (last (w/query ".ls-page-blocks .ls-block .block-content"))))

(defn repeat-keyboard
  [n shortcut]
  (dotimes [_i n]
    (press shortcut)))

(defn get-page-blocks-contents
  []
  (w/all-text-contents ".ls-page-blocks .ls-block .block-title-wrap"))

(def mac? (= "Mac OS X" (System/getProperty "os.name")))

(def mod-key (if mac? "Meta" "Control"))
