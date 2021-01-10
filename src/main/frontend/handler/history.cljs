(ns frontend.handler.history
  (:require [frontend.state :as state]
            [frontend.db :as db]
            [frontend.history :as history]
            [frontend.handler.file :as file]
            [frontend.handler.editor :as editor]
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

(defn undo!
  []
  (let [route (get-in (:route-match @state/state) [:data :name])]
    (if (and (contains? #{:home :page :file} route)
             (state/get-current-repo))
      (let [repo (state/get-current-repo)
            chan (async/promise-chan)
            save-commited? (atom nil)
            undo-fn (fn []
                      (history/undo! repo file/alter-file
                                     (fn [{:keys [block-container block-idx pos] :as state}]
                                       ;; get the element
                                       (prn {:state state})
                                       (when (and block-container block-idx pos)
                                         (when-let [container (gdom/getElement block-container)]
                                           (let [blocks (d/by-class container "ls-block")
                                                 block-node (nth (seq blocks) block-idx)
                                                 id (gobj/get block-node "id")]
                                             (when id
                                               (let [block-id (->> (take-last 36 id)
                                                                   (apply str))
                                                     block-uuid (when (util/uuid-string? block-id)
                                                                  (uuid block-id))]
                                                 (prn {:block-uuid block-uuid
                                                       :id id})
                                                 (when block-uuid
                                                   (when-let [block (db/entity [:block/uuid block-uuid])]
                                                     (editor/edit-block! block pos (:block/format block) id)))))))))))]
        (editor/save-current-block-when-idle! {:check-idle? false
                                               :chan chan
                                               :chan-callback (fn []
                                                                (reset! save-commited? true))})
        (if @save-commited?
          (async/go
            (let [_ (async/<! chan)]
              ;; FIXME:
              (js/setTimeout undo-fn 20)))
          (undo-fn)))
      (default-undo))))

(defn redo!
  []
  (let [route (get-in (:route-match @state/state) [:data :name])]
    (if (and (contains? #{:home :page :file} route)
             (state/get-current-repo))
      (let [repo (state/get-current-repo)]
        (history/redo! repo file/alter-file))
      (default-redo))))
