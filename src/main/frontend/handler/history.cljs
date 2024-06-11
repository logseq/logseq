(ns ^:no-doc frontend.handler.history
  (:require [frontend.db :as db]
            [frontend.db.transact :as db-transact]
            [frontend.handler.editor :as editor]
            [frontend.handler.route :as route-handler]
            [frontend.persist-db.browser :as db-browser]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.page :as page-util]
            [logseq.db :as ldb]
            [promesa.core :as p]
            [goog.functions :refer [debounce]]))

(defn- restore-cursor!
  [{:keys [editor-cursors block-content undo?]}]
  (let [{:keys [block-uuid container-id start-pos end-pos]} (if undo? (first editor-cursors) (or (last editor-cursors) (first editor-cursors)))
        pos (if undo? (or start-pos end-pos) (or end-pos start-pos))]
    (when-let [block (db/pull [:block/uuid block-uuid])]
      (editor/edit-block! block pos
                          {:container-id container-id
                           :custom-content block-content}))))

(defn- restore-app-state!
  [state]
  (let [route-data (:route-data state)
        current-route (:route-match @state/state)
        current-route-data (db-browser/get-route-data current-route)]
    (when (and (not= route-data current-route-data) route-data
               (contains? #{:home :page :page-block :all-journals} (:to route-data)))
      (route-handler/redirect! route-data))
    (swap! state/state merge (dissoc state :route-data))))

(defn- restore-cursor-and-state!
  [result]
  (state/set-state! :history/paused? true)
  (let [{:keys [ui-state-str undo?] :as data} (ldb/read-transit-str result)]
    (if ui-state-str
      (let [{:keys [old-state new-state]} (ldb/read-transit-str ui-state-str)]
        (if undo? (restore-app-state! old-state) (restore-app-state! new-state)))
      (restore-cursor! data)))
  (state/set-state! :history/paused? false))

(let [*last-request (atom nil)]
  (defn- undo-aux!
    [e]
    (state/set-state! :editor/op :undo)
    (p/do!
     @*last-request
     (when-let [repo (state/get-current-repo)]
       (let [current-page-uuid-str (some->> (page-util/get-latest-edit-page-id)
                                            db/entity
                                            :block/uuid
                                            str)]
         (when (db-transact/request-finished?)
           (util/stop e)
           (p/do!
            (state/set-state! [:editor/last-replace-ref-content-tx repo] nil)
            (editor/save-current-block!)
            (state/clear-editor-action!)
            (let [^js worker @state/*db-worker]
              (reset! *last-request (.undo worker repo current-page-uuid-str))
              (p/let [result @*last-request]
                (restore-cursor-and-state! result))))))))))
(defonce undo! (debounce undo-aux! 20))

(let [*last-request (atom nil)]
  (defn- redo-aux!
    [e]
    (state/set-state! :editor/op :redo)
    (p/do!
     @*last-request
     (when-let [repo (state/get-current-repo)]
       (let [current-page-uuid-str (some->> (page-util/get-latest-edit-page-id)
                                            db/entity
                                            :block/uuid
                                            str)]
         (when (db-transact/request-finished?)
           (util/stop e)
           (state/clear-editor-action!)
           (let [^js worker @state/*db-worker]
             (reset! *last-request (.redo worker repo current-page-uuid-str))
             (p/let [result @*last-request]
               (restore-cursor-and-state! result)))))))))
(defonce redo! (debounce redo-aux! 20))
