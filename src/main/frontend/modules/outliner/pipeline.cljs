(ns frontend.modules.outliner.pipeline
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.react :as react]
            [frontend.handler.file-based.property.util :as property-util]
            [frontend.modules.outliner.file :as file]
            [frontend.state :as state]
            [frontend.util.cursor :as cursor]
            [frontend.util.drawer :as drawer]))

(defn updated-page-hook
  [tx-meta page]
  (when (and
         (not (config/db-based-graph? (state/get-current-repo)))
         (not (:created-from-journal-template? tx-meta)))
    (file/sync-to-file page (:outliner-op tx-meta))))

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
                    pos (cursor/pos input)]
                (when (not= (string/trim content)
                            (string/trim (.-value input)))
                  (state/set-edit-content! input content)
                  (when pos (cursor/move-cursor-to input pos)))))))))))

(defn invoke-hooks
  [{:keys [tx-meta tx-data deleted-block-uuids affected-keys pages blocks]}]
  (let [{:keys [from-disk? new-graph? pipeline-replace?]} tx-meta
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
        (when (and (not config/publishing?) (not pipeline-replace?))
          (when-not importing?
            (react/refresh! repo tx-report affected-keys)))

        (when (and (not (:delete-files? tx-meta))
                   (not pipeline-replace?))
          (doseq [p (seq pages)]
            (updated-page-hook tx-meta p)))

        (when (and state/lsp-enabled?
                   (seq blocks)
                   (not importing?)
                   (not pipeline-replace?)
                   (<= (count blocks) 1000))
          (state/pub-event! [:plugin/hook-db-tx
                             {:blocks  blocks
                              :deleted-block-uuids deleted-block-uuids
                              :tx-data (:tx-data tx-report)
                              :tx-meta (:tx-meta tx-report)}]))))))
