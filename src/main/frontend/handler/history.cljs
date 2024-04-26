(ns ^:no-doc frontend.handler.history
  (:require [frontend.db :as db]
            [frontend.db.transact :as db-transact]
            [frontend.handler.editor :as editor]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.page :as page-util]
            [promesa.core :as p]
            [logseq.db :as ldb]))

(defn restore-cursor!
  [{:keys [editor-cursors undo?]}]
  (let [{:keys [block-uuid container-id start-pos end-pos]} (if undo? (first editor-cursors) (last editor-cursors))]
    (when-let [block (db/pull [:block/uuid block-uuid])]
      (editor/edit-block! block (or (when undo? start-pos) end-pos)
                          {:container-id container-id
                           :custom-content (:block/content block)}))))

(comment
  (defn- get-route-data
    [route-match]
    (when (seq route-match)
      {:to (get-in route-match [:data :name])
       :path-params (:path-params route-match)
       :query-params (:query-params route-match)})))

(comment
  (defn restore-app-state!
   [state]
   (let [route-match (:route-match state)
         current-route (:route-match @state/state)
         prev-route-data (get-route-data route-match)
         current-route-data (get-route-data current-route)]
     (when (and (not= prev-route-data current-route-data)
                prev-route-data)
       (route-handler/redirect! prev-route-data))
     (swap! state/state merge state))))

(let [*last-request (atom nil)]
  (defn undo!
    [e]
    (p/do!
     @*last-request
     (when-let [repo (state/get-current-repo)]
       (when-let [current-page-uuid-str (some->> (page-util/get-latest-edit-page-id)
                                                 db/entity
                                                 :block/uuid
                                                 str)]
         (when (db-transact/request-finished?)
           (util/stop e)
           (p/do!
            (state/set-state! [:editor/last-replace-ref-content-tx repo] nil)
            (editor/save-current-block!)
            (state/clear-editor-action!)
            (state/set-block-op-type! nil)
            (let [^js worker @state/*db-worker]
              (reset! *last-request (.undo worker repo current-page-uuid-str))
              (p/let [result @*last-request]
                (restore-cursor! (ldb/read-transit-str result)))))))))))

(let [*last-request (atom nil)]
  (defn redo!
    [e]
    (p/do!
     @*last-request
     (when-let [repo (state/get-current-repo)]
       (when-let [current-page-uuid-str (some->> (page-util/get-latest-edit-page-id)
                                                 db/entity
                                                 :block/uuid
                                                 str)]
         (when (db-transact/request-finished?)
           (util/stop e)
           (state/clear-editor-action!)
           (let [^js worker @state/*db-worker]
              (reset! *last-request (.redo worker repo current-page-uuid-str))
              (p/let [result @*last-request]
                (restore-cursor! (ldb/read-transit-str result))))))))))
