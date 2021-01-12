(ns frontend.handler.history
  (:require [frontend.state :as state]
            [frontend.db :as db]
            [frontend.history :as history]
            [frontend.handler.file :as file]
            [frontend.handler.editor :as editor]
            [frontend.handler.ui :as ui-handler]
            [promesa.core :as p]
            [clojure.core.async :as async]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [dommy.core :as d]
            [frontend.util :as util]
            [medley.core :as medley]))

(defn- default-undo
  []
  (js/document.execCommand "undo" false nil))

(defn- default-redo
  []
  (js/document.execCommand "redo" false nil))

(defn restore-cursor!
  [{:keys [block-container block-idx pos] :as state}]
  (ui-handler/re-render-root!)
  ;; get the element
  (when (and block-container block-idx pos)
    (when-let [container (gdom/getElement block-container)]
      (let [blocks (d/by-class container "ls-block")
            block-node (util/nth-safe (seq blocks) block-idx)
            id (and block-node (gobj/get block-node "id"))]
        (when id
          (let [block-id (->> (take-last 36 id)
                              (apply str))
                block-uuid (when (util/uuid-string? block-id)
                             (uuid block-id))]
            (when block-uuid
              (when-let [block (db/pull [:block/uuid block-uuid])]
                (editor/edit-block! block pos
                                    (:block/format block)
                                    (:block/uuid block))))))))))

(defn undo!
  []
  (when-not (state/get-editor-op)
    (let [route (get-in (:route-match @state/state) [:data :name])]
      (if (and (contains? #{:home :page :file} route)
               (state/get-current-repo))
        (let [repo (state/get-current-repo)
              chan (async/promise-chan)
              save-commited? (atom nil)
              undo-fn (fn []
                        (history/undo! repo file/alter-file restore-cursor!))]
          (editor/save-current-block-when-idle! {:check-idle? false
                                                 :chan chan
                                                 :chan-callback (fn []
                                                                  (reset! save-commited? true))})
          (if @save-commited?
            (async/go
              (let [_ (async/<! chan)]
                (undo-fn)))
            (undo-fn)))
        (default-undo)))))

(defn redo!
  []
  (when-not (state/get-editor-op)
    (let [route (get-in (:route-match @state/state) [:data :name])]
     (if (and (contains? #{:home :page :file} route)
              (state/get-current-repo))
       (let [repo (state/get-current-repo)]
         (history/redo! repo file/alter-file restore-cursor!))
       (default-redo)))))
