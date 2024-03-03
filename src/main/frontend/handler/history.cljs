(ns ^:no-doc frontend.handler.history
  (:require [frontend.db :as db]
            [frontend.handler.editor :as editor]
            [frontend.modules.editor.undo-redo :as undo-redo]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.handler.route :as route-handler]
            [goog.dom :as gdom]))

(defn restore-cursor!
  [{:keys [last-edit-block container pos]}]
  (when (and container last-edit-block)
    #_:clj-kondo/ignore
    (when-let [container (gdom/getElement container)]
      (when-let [block-uuid (:block/uuid last-edit-block)]
        (when-let [block (db/pull [:block/uuid block-uuid])]
          (editor/edit-block! block pos
                              (:block/uuid block)
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
  (util/stop e)
  (state/set-editor-op! :undo)
  (state/clear-editor-action!)
  (state/set-block-op-type! nil)
  (state/set-state! [:editor/last-replace-ref-content-tx (state/get-current-repo)] nil)
  (editor/save-current-block!)
  (let [{:keys [editor-cursor app-state]} (undo-redo/undo)]
    (restore-cursor! editor-cursor)
    (restore-app-state! app-state))
  (state/set-editor-op! nil))

(defn redo!
  [e]
  (util/stop e)
  (state/set-editor-op! :redo)
  (state/clear-editor-action!)
  (let [{:keys [editor-cursor app-state]} (undo-redo/redo)]
    (restore-cursor! editor-cursor)
    (restore-app-state! app-state))
  (state/set-editor-op! nil))
