(ns ^:no-doc frontend.handler.history
  (:require [frontend.handler.editor :as editor]
            [frontend.handler.common.editor :as editor-common]
            [frontend.handler.route :as route-handler]
            [frontend.persist-db.browser :as db-browser]
            [frontend.state :as state]
            [frontend.util :as util]
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

(defn- <run-history-command!
  [e undo?]
  (when-not (:editor/code-block-context (state/get-state))
    (util/stop e)
    (when-let [repo (state/get-current-repo)]
      (editor-common/<enqueue-command!
       repo
       (fn []
         (state/set-state! :editor/op (if undo? :undo :redo))
         (when undo?
           (state/set-state! [:editor/last-replace-ref-content-tx repo] nil))
         (p/do!
          (editor/save-current-block!)
          (state/clear-editor-action!)
          (p/let [result (state/<invoke-db-worker
                         (if undo? :thread-api/undo-redo-undo :thread-api/undo-redo-redo)
                         repo)]
            (restore-cursor-and-state! result))))))))

(defn- undo-aux! [e] (<run-history-command! e true))
(defn- redo-aux! [e] (<run-history-command! e false))

(def undo! undo-aux!)
(def redo! redo-aux!)
