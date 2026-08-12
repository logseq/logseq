(ns logseq.e2e.block
  (:require [clojure.string :as string]
            [clojure.test :refer [is]]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.locator :as loc]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

(defn open-last-block
  "Open the last existing block or pressing add button to create a new block"
  [& {:keys [in-retry?]}]
  (util/double-esc)
  (assert/assert-in-normal-mode?)

  (let [blocks-count (util/page-blocks-count)
        last-block (-> (if (zero? blocks-count)
                         (w/query ".ls-page-blocks .block-add-button")
                         (w/query ".ls-page-blocks .page-blocks-inner .ls-block .block-content"))
                       (last))]
    (w/click last-block)
    (if in-retry?
      (assert/assert-editor-mode)
      (try
        (assert/assert-editor-mode)
        (catch Error _e
          (open-last-block {:in-retry? true}))))))

(defn save-block
  [text]
  (assert/assert-have-count util/editor-q 1)
  (w/click util/editor-q)
  (w/fill util/editor-q text)
  (assert/assert-is-visible (loc/filter util/editor-q :has-text text)))

(defn- focus-new-block!
  [previous-editor-id]
  (let [new-editor (loc/filter ".editor-wrapper"
                               :has "textarea"
                               :has-not (str "#" previous-editor-id))]
    (try
      (assert/assert-is-visible new-editor)
      (catch Error _error
        (open-last-block)
        (when (= previous-editor-id
                 (.getAttribute (w/-query ".editor-wrapper textarea") "id"))
          (util/move-cursor-to-end)
          (k/enter))
        (assert/assert-is-visible new-editor)))))

(defn new-block
  [title]
  (when-not (util/get-editor)
    (open-last-block))
  (let [last-id (.getAttribute (w/-query ".editor-wrapper textarea") "id")]
    (is (some? last-id))
    (util/move-cursor-to-end)
    (k/enter)
    (focus-new-block! last-id)
    (when (seq title)
      (util/press-seq title))
    (assert/assert-editor-mode)
    (is (= title (util/get-edit-content)))))

;; TODO: support tree
(defn new-blocks
  [titles]
  (let [editor? (util/get-editor)]
    (when-not editor? (open-last-block))
    (let [value (util/get-edit-content)]
      (if (string/blank? value)         ; empty block
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
  (assert/assert-have-count util/editor-q 1)
  (w/wait-for (format ".editor-wrapper textarea:text('%s')" text)))

(def copy #(k/press "ControlOrMeta+c" {:delay 100}))
(def paste #(k/press "ControlOrMeta+v" {:delay 100}))
(def undo #(k/press "ControlOrMeta+z" {:delay 100}))
(def redo #(k/press "ControlOrMeta+y" {:delay 100}))

(defn- wait-for-editor-x-change
  [x1 moved?]
  (loop [attempts-left 40]
    (if-let [editor (util/get-editor)]
      (let [[x2 _] (util/bounding-xy editor)]
        (if (or (moved? x1 x2) (zero? attempts-left))
          x2
          (do
            (util/wait-timeout 50)
            (recur (dec attempts-left)))))
      (if (zero? attempts-left)
        x1
        (do
          (util/wait-timeout 50)
          (recur (dec attempts-left)))))))

(defn- indent-outdent
  [indent?]
  (let [editor (util/get-editor)
        [x1 _] (util/bounding-xy editor)
        moved? (if indent? < >)
        _ (if indent? (k/tab) (k/shift+tab))
        x2 (wait-for-editor-x-change x1 moved?)]
    (if indent?
      (is (< x1 x2))
      (is (> x1 x2)))))

(defn indent
  []
  (indent-outdent true))

(defn outdent
  []
  (indent-outdent false))

(defn toggle-property
  [property-title property-value]
  (k/press (if util/mac? "ControlOrMeta+p" "Control+Alt+p"))
  (w/fill ".ls-property-dialog .cp__select-input" property-title)
  (w/wait-for (format "#ac-0.menu-link:has-text('%s')" property-title))
  (k/enter)
  (util/wait-timeout 100)
  (w/click (w/-query ".ls-property-dialog .cp__select-input"))
  (util/wait-timeout 100)
  (util/input property-value)
  (w/wait-for (format "#ac-0.menu-link:has-text('%s')" property-value))
  (k/enter))

(defn select-blocks
  [n]
  (util/repeat-keyboard n "Shift+ArrowUp")
  (util/wait-timeout 200))
