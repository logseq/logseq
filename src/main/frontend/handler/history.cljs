(ns ^:no-doc frontend.handler.history
  (:require [clojure.string :as string]
            [frontend.handler.editor :as editor]
            [frontend.handler.route :as route-handler]
            [frontend.persist-db.browser :as db-browser]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.functions :refer [debounce]]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn- <pull-block
  [block-uuid]
  (when-let [repo (and block-uuid (state/get-current-repo))]
    (state/<invoke-db-worker :thread-api/pull
                             repo
                             '[*]
                             [:block/uuid block-uuid])))

(defn- editor-snapshot
  "The editing block, its editor text and the textarea's selection."
  []
  (when-let [block-uuid (:block/uuid (state/get-edit-block))]
    {:block-uuid block-uuid
     :content (string/trim (or (state/get-edit-content) ""))
     :selection (when-let [input (state/get-input)]
                  [(util/get-selection-start input) (util/get-selection-end input)])}))

(defn- user-moved-since-request?
  "Whether the user selected or typed in `block-uuid` after the undo/redo was
  requested (`before`). The editor showing the undone `block-content` with the
  cursor at its end is not the user's doing: the render delta of the undo puts
  the text there before the result arrives."
  [before block-uuid block-content]
  (let [now (editor-snapshot)
        content (string/trim (or block-content ""))
        n (count content)]
    (boolean
     (and before now
          (= block-uuid (:block-uuid before) (:block-uuid now))
          (not= (select-keys now [:content :selection])
                (select-keys before [:content :selection]))
          (not (and (= content (:content now))
                    (contains? #{nil [n n]} (:selection now))))))))

(defn- restore-cursor!
  [{:keys [editor-cursors block-content undo?] ::keys [editor-before]}]
  (let [cursor (if undo?
                 (first editor-cursors)
                 (or (last editor-cursors) (first editor-cursors)))
        {:keys [selected-block-uuids selection-direction block-uuid container-id start-pos end-pos]} cursor
        selected-blocks (when (seq selected-block-uuids)
                          (->> selected-block-uuids
                               (mapcat util/get-blocks-by-id)
                               vec))
        pos (if undo? (or start-pos end-pos) (or end-pos start-pos))]
    (if (seq selected-blocks)
      (do
        (state/exit-editing-and-set-selected-blocks! selected-blocks selection-direction)
        nil)
      (p/let [block (<pull-block block-uuid)]
        ;; A selection or text the user made in the block while the undo was in
        ;; flight stays: restoring the recorded cursor over it lost a Mod+a
        ;; pressed right after Mod+z, so the following Backspace deleted one
        ;; character instead of the selection.
        ;; edit-block! loads the block again before it moves the cursor, so the
        ;; check runs once more right before that, through the edit guard.
        (when (and block
                   (not (user-moved-since-request? editor-before block-uuid block-content)))
          (state/set-state! :editor/edit-guard
                            {:block-uuid block-uuid
                             :ok? #(not (user-moved-since-request? editor-before block-uuid block-content))})
          (p/finally
           (p/do!
            (editor/edit-block! block pos
                                {:container-id container-id
                                 :custom-content block-content
                                 ;; The buffer was already flushed before undo/redo.
                                 :save-current-block? false}))
           #(state/set-state! :editor/edit-guard nil)))))))

(defn- restore-app-state!
  [state]
  (let [route-data (:route-data state)
        current-route (:route-match (state/get-state))
        current-route-data (db-browser/get-route-data current-route)]
    (when (and (not= route-data current-route-data) route-data
               (contains? #{:home :page :page-block :all-journals} (:to route-data)))
      (route-handler/redirect! route-data))
    (state/swap-state! merge (dissoc state :route-data))))

(defn- restore-cursor-and-state!
  [result]
  (state/set-state! :history/paused? true)
  (let [{:keys [ui-state-str undo?] :as data} result
        restore-result (if ui-state-str
                         (let [{:keys [old-state new-state]} (ldb/read-transit-str ui-state-str)]
                           (if undo? (restore-app-state! old-state) (restore-app-state! new-state)))
                         (restore-cursor! data))]
    (if (p/promise? restore-result)
      (p/finally restore-result #(state/set-state! :history/paused? false))
      (do
        (state/set-state! :history/paused? false)
        restore-result))))

(defn- <history-request-and-restore!
  "Runs the worker's undo or redo and restores the cursor, unless the user
  selected or typed in the block while the request was in flight."
  [*last-request request-f]
  (let [editor-before (editor-snapshot)]
    (p/do!
     (reset! *last-request (request-f))
     (p/let [result @*last-request]
       (restore-cursor-and-state!
        (cond-> result
          (map? result) (assoc ::editor-before editor-before)))))))

(defn- <editor-key-landed
  "Settles when the Enter or Backspace/Delete join still running, if any, has
  landed and moved the editor. Before that the editor still names the block
  the key left, so the undo's buffer save and cursor restore would race the
  key's own move of the editor, which lands after the undo."
  []
  (p/do!
   (editor/<pending-block-delete)
   (editor/<pending-new-block)))

(let [*last-request (atom nil)]
  (defn- undo-aux!
    [e]
    (when-not (:editor/code-block-context (state/get-state))
      (state/set-state! :editor/op :undo)
      (p/do!
       @*last-request
       (when-let [repo (state/get-current-repo)]
         (util/stop e)
         (p/do!
          (<editor-key-landed)
          (state/set-state! [:editor/last-replace-ref-content-tx repo] nil)
          (editor/save-current-block!)
          (state/clear-editor-action!)
          (<history-request-and-restore!
           *last-request
           #(state/<invoke-db-worker :thread-api/undo-redo-undo repo))))))))
(defonce undo! (debounce undo-aux! 20))

(let [*last-request (atom nil)]
  (defn- redo-aux!
    [e]
    (when-not (:editor/code-block-context (state/get-state))
      (state/set-state! :editor/op :redo)
      (p/do!
       @*last-request
       (when-let [repo (state/get-current-repo)]
         (util/stop e)
         (p/do!
          (<editor-key-landed)
          (editor/save-current-block!)
          (state/clear-editor-action!)
          (<history-request-and-restore!
           *last-request
           #(state/<invoke-db-worker :thread-api/undo-redo-redo repo))))))))
(defonce redo! (debounce redo-aux! 20))
