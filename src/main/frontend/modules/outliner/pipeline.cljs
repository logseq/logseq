(ns frontend.modules.outliner.pipeline
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.react :as react]
            [frontend.handler.file-based.property.util :as property-util]
            [frontend.state :as state]
            [frontend.util.cursor :as cursor]
            [frontend.util.drawer :as drawer]
            [frontend.modules.editor.undo-redo :as undo-redo]))

(defn- reset-editing-block-content!
  [tx-data tx-meta]
  (let [repo (state/get-current-repo)
        db? (config/db-based-graph? repo)]
    (when-not (or (:undo? tx-meta) (:redo? tx-meta))
      (when-let [edit-block (state/get-edit-block)]
        (when-let [last-datom (-> (filter (fn [datom]
                                            (and (= :block/content (:a datom))
                                                 (= (:e datom) (:db/id edit-block)))) tx-data)
                                  last)]
          (when-let [input (state/get-input)]
            (when (:added last-datom)
              (let [entity (db/entity (:e last-datom))
                    db-content (:block/content entity)
                    content (if db? db-content
                                (->> db-content
                                     (property-util/remove-built-in-properties (or (:block/format entity) :markdown))
                                     drawer/remove-logbook))
                    pos (cursor/pos input)
                    pos (when pos (if (zero? pos) (count content) 0))]
                (when (not= (string/trim content)
                            (string/trim (.-value input)))
                  (state/set-edit-content! input content))
                (when pos (cursor/move-cursor-to input pos))))))))))

(defn store-undo-data!
  [{:keys [tx-meta] :as opts}]
  (when-not config/test?
    (when-let [replace-tx-data (:replace-tx-data opts)]
      (db/transact! (state/get-current-repo) replace-tx-data (:replace-tx-meta opts)))

    (when (or (:outliner/transact? tx-meta)
              (:outliner-op tx-meta)
              (:whiteboard/transact? tx-meta))
      (undo-redo/listen-db-changes! opts))))

(defn invoke-hooks
  [{:keys [tx-meta tx-data deleted-block-uuids affected-keys blocks] :as opts}]
  (store-undo-data! opts)
  (let [{:keys [from-disk? new-graph?]} tx-meta
        repo (state/get-current-repo)
        tx-report {:tx-meta tx-meta
                   :tx-data tx-data}]
    (when-not (or from-disk? new-graph?)
      (try
        (reset-editing-block-content! tx-data tx-meta)
        (catch :default e
          (prn :reset-editing-block-content)
          (js/console.error e)))
      (let [importing? (:graph/importing @state/state)]
        (when-not importing?
          (react/refresh! repo tx-report affected-keys))

        (when (and state/lsp-enabled?
                   (seq blocks)
                   (not importing?)
                   (<= (count blocks) 1000))
          (state/pub-event! [:plugin/hook-db-tx
                             {:blocks  blocks
                              :deleted-block-uuids deleted-block-uuids
                              :tx-data (:tx-data tx-report)
                              :tx-meta (:tx-meta tx-report)}]))))))
