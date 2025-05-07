(ns logseq.e2e.block
  (:require [clojure.string :as string]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

(defn open-last-block
  []
  (util/double-esc)
  (assert/assert-in-normal-mode?)
  (w/click (last (w/query ".ls-page-blocks .ls-block .block-content"))))

(defn save-block
  [text]
  (w/fill util/editor-q text))

(defn new-block
  [title]
  (let [editor (util/get-editor)
        blocks-count (util/blocks-count)]
    (when-not editor (open-last-block))
    (assert/assert-editor-mode)
    (try
      (k/enter)
      (assert/assert-have-count ".ls-block" (inc blocks-count))
      (catch Exception _e
        ;; retry once
        (k/enter)
        (assert/assert-have-count ".ls-block" (inc blocks-count))))
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
