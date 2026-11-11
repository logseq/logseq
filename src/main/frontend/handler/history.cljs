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

(defn- restore-cursor!
  [{:keys [editor-cursors block-content undo?]}]
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
        (when block
          (editor/edit-block! block pos
                              {:container-id container-id
                               :custom-content block-content
                               ;; The buffer was already flushed before undo/redo.
                               :save-current-block? false}))))))

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

(defn- apply-held-editing-title!
  "Applies the editing block's title that the pipeline held back while the
  undo/redo was in flight, when the cursor restore left the editor on that block
  with another text (the restore went elsewhere or did not run)."
  []
  (let [[block-uuid title] (state/get-state :history/held-editing-title)]
    (state/set-state! :history/held-editing-title nil)
    (when (and block-uuid
               (= block-uuid (:block/uuid (state/get-edit-block)))
               (not= (string/trim (or (state/get-edit-content) ""))
                     (string/trim title)))
      (state/set-edit-content! title))))

(defn- <history-request-and-restore!
  "Runs the worker's undo or redo and restores the cursor. While it runs the
  pipeline holds back the editing block's new title, so the text and the cursor
  land together in the restore instead of the text first and the cursor later."
  [*last-request request-f]
  (state/set-state! :history/held-editing-title nil)
  (state/set-state! :history/request-pending? true)
  (-> (p/do!
       (reset! *last-request (request-f))
       (p/let [result @*last-request]
         (restore-cursor-and-state! result)))
      (p/finally (fn []
                   (state/set-state! :history/request-pending? false)
                   (apply-held-editing-title!)))))

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
