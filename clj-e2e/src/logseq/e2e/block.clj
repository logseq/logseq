(ns logseq.e2e.block
  (:require [clojure.string :as string]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

(defn- wait-for-new-empty-block-inserted
  "When inserting a new block, if the operation is too fast,
  the w/fill operation can begin before k/enter has finished creating the block,
  leading to the save-block not updating the block contents."
  [last-edit-block-id]
  (loop [i 5]
    (if (zero? i)
      (throw (ex-info "wait-for-new-empty-block-inserted" {}))
      (if (not= last-edit-block-id (.getAttribute (w/-query util/editor-q) "id"))
        :done
        (do (util/wait-timeout 50)
            (recur (dec i)))))))

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
        last-edit-block-id (when editor (.getAttribute editor "id"))]
    (when-not editor (open-last-block))
    (assert/assert-editor-mode)
    (k/enter)
    (assert/assert-editor-mode)
    (when last-edit-block-id (wait-for-new-empty-block-inserted last-edit-block-id))
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
