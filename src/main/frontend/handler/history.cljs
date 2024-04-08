(ns ^:no-doc frontend.handler.history
  (:require [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.transact :as db-transact]
            [frontend.handler.editor :as editor]
            [frontend.handler.route :as route-handler]
            [frontend.modules.editor.undo-redo :as undo-redo]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [promesa.core :as p]))

(defn restore-cursor!
  [{:keys [last-edit-block container pos end-pos]} undo?]
  (when (and container last-edit-block)
    #_:clj-kondo/ignore
    (when-let [container (gdom/getElement container)]
      (when-let [block-uuid (:block/uuid last-edit-block)]
        (when-let [block (db/pull [:block/uuid block-uuid])]
          (editor/edit-block! block (or (when undo? pos) end-pos)
                              {:custom-content (:block/content block)}))))))

(defn- get-route-data
  [route-match]
  (when (seq route-match)
    {:to (get-in route-match [:data :name])
     :path-params (:path-params route-match)
     :query-params (:query-params route-match)}))

(defn restore-app-state!
  [state]
  (when-not (:history/page-only-mode? @state/state)
   (let [route-match (:route-match state)
         current-route (:route-match @state/state)
         prev-route-data (get-route-data route-match)
         current-route-data (get-route-data current-route)]
     (when (and (not= prev-route-data current-route-data)
                prev-route-data)
       (route-handler/redirect! prev-route-data))
     (swap! state/state merge state))))

(defn undo!
  [e]
  (when-let [repo (state/get-current-repo)]
    (when (db-transact/request-finished?)
      (util/stop e)
      (p/do!
       (state/set-state! [:editor/last-replace-ref-content-tx repo] nil)
       (editor/save-current-block!)
       (state/clear-editor-action!)
       (state/set-block-op-type! nil)
       (if (config/db-based-graph? repo)
         (let [^js worker @state/*db-worker]
           (.undo worker repo))
         (let [cursor-state (undo-redo/undo)]
           (state/set-state! :ui/restore-cursor-state (select-keys cursor-state [:editor-cursor :app-state]))))))))

(defn redo!
  [e]
  (when-let [repo (state/get-current-repo)]
    (when (db-transact/request-finished?)
      (util/stop e)
      (state/clear-editor-action!)
      (if (config/db-based-graph? repo)
        (let [^js worker @state/*db-worker]
          (.redo worker repo))
        (let [cursor-state (undo-redo/redo)]
          (state/set-state! :ui/restore-cursor-state (select-keys cursor-state [:editor-cursor :app-state])))))))
