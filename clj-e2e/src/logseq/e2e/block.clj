(ns logseq.e2e.block
  (:require [clojure.string :as string]
            [clojure.test :refer [is]]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.locator :as loc]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

(defn open-last-block
  []
  (util/double-esc)
  (assert/assert-in-normal-mode?)
  (w/click (last (w/query ".ls-page-blocks .ls-block .block-content"))))

(defn save-block
  [text]
  (w/click util/editor-q)
  (w/fill util/editor-q text)
  (assert/assert-is-visible (loc/filter util/editor-q :has-text text)))

(defn new-block
  [title]
  (let [editor (util/get-editor)
        blocks-count (util/blocks-count)]
    (when-not editor (open-last-block))
    (assert/assert-editor-mode)
    (k/enter)
    (assert/assert-have-count ".ls-block" (inc blocks-count))
    (assert/assert-editor-mode)
    (save-block title)))

;; TODO: support tree
(defn new-blocks
  [titles]
  (let [editor? (util/get-editor)]
    (when-not editor? (open-last-block))
    (assert/assert-editor-mode)
    (let [value (util/get-edit-content)]
      (if (string/blank? value)           ; empty block
        (save-block (first titles))
        (new-block (first titles))))
    (doseq [title (rest titles)]
      (new-block title))))

(defn delete-blocks
  "Delete the current block if in editing mode, otherwise, delete all the selected blocks."
  []
  (let [editor (util/get-editor)]
    (when editor (util/exit-edit))
    (k/backspace)))

(defn assert-blocks-visible
  "blocks - coll of :block/title"
  [blocks]
  (doseq [block blocks]
    (assert/assert-is-visible (format ".ls-page-blocks .ls-block :text('%s')" block))))

(defn jump-to-block
  [block-text]
  (w/click (w/find-one-by-text ".ls-block .block-content" block-text)))

(defn wait-editor-text
  [text]
  (w/wait-for (format ".editor-wrapper textarea:text('%s')" text)))

(def copy #(k/press "ControlOrMeta+c" {:delay 100}))
(def paste #(k/press "ControlOrMeta+v" {:delay 100}))

(defn- indent-outdent
  [indent?]
  (let [editor (util/get-editor)
        [x1 _] (util/bounding-xy editor)
        _ (if indent? (k/tab) (k/shift+tab))
        [x2 _] (util/bounding-xy editor)]
    (if indent?
      (is (< x1 x2))
      (is (> x1 x2)))))

(defn indent
  []
  (indent-outdent true))

(defn outdent
  []
  (indent-outdent false))
