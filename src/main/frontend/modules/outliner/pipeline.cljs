(ns frontend.modules.outliner.pipeline
  (:require [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.react :as react]
            [frontend.modules.outliner.file :as file]
            [logseq.outliner.datascript-report :as ds-report]
            [logseq.outliner.pipeline :as outliner-pipeline]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]
            [frontend.persist-db :as persist-db]))

(defn updated-page-hook
  [tx-report page]
  (when (and
         (not (config/db-based-graph? (state/get-current-repo)))
         (not (get-in tx-report [:tx-meta :created-from-journal-template?])))
    (file/sync-to-file page (:outliner-op (:tx-meta tx-report)))))

(defn compute-block-path-refs
  [{:keys [tx-meta] :as tx-report} blocks]
  (when (and (:outliner-op tx-meta) (react/path-refs-need-recalculated? tx-meta))
    (outliner-pipeline/computer-block-path-refs tx-report blocks)))

(defn invoke-hooks
  [tx-report]
  (let [tx-meta (:tx-meta tx-report)]
    (when (and (not (:from-disk? tx-meta))
               (not (:new-graph? tx-meta))
               (not (:replace? tx-meta)))
      (let [{:keys [pages blocks]} (ds-report/get-blocks-and-pages tx-report)
            repo (state/get-current-repo)
            refs-tx (util/profile
                     "Compute path refs: "
                     (set (compute-block-path-refs tx-report blocks)))
            truncate-refs-tx (map (fn [m] [:db/retract (:db/id m) :block/path-refs]) refs-tx)
            tx (util/concat-without-nil truncate-refs-tx refs-tx)
            tx-report' (if (seq tx)
                         (let [refs-tx-data' (:tx-data (db/transact! repo tx {:outliner/transact? true
                                                                              :replace? true}))]
                           ;; merge
                           (assoc tx-report :tx-data (concat (:tx-data tx-report) refs-tx-data')))
                         tx-report)
            importing? (:graph/importing @state/state)
            deleted-block-uuids (set (outliner-pipeline/filter-deleted-blocks (:tx-data tx-report)))]

        (when-not importing?
          (react/refresh! repo tx-report'))

        (when (and (config/db-based-graph? repo) (not (:skip-persist? tx-meta)))
          (let [upsert-blocks (outliner-pipeline/build-upsert-blocks blocks deleted-block-uuids (:db-after tx-report'))
                updated-blocks (remove (fn [b] (contains? (set deleted-block-uuids)  (:block/uuid b))) blocks)
                tx-id (get-in tx-report' [:tempids :db/current-tx])
                update-tx-ids (map (fn [b]
                                     (when-let [db-id (:db/id b)]
                                       {:db/id db-id
                                        :block/tx-id tx-id})) updated-blocks)]
            (when (seq update-tx-ids)
              (db/transact! repo update-tx-ids {:replace? true}))
            (p/let [_transact-result (persist-db/<transact-data repo upsert-blocks deleted-block-uuids)
                    _ipc-result (comment ipc/ipc :db-transact-data repo
                                         (pr-str
                                          {:blocks upsert-blocks
                                           :deleted-block-uuids deleted-block-uuids}))]
              ;; TODO: disable edit when transact failed to avoid future data-loss
              ;; (prn "DB transact result: " ipc-result)
              )))

        (when-not (:delete-files? tx-meta)
          (doseq [p (seq pages)]
            (updated-page-hook tx-report p)))

        (when (and state/lsp-enabled?
                   (seq blocks)
                   (not importing?)
                   (<= (count blocks) 1000))
          (state/pub-event! [:plugin/hook-db-tx
                             {:blocks  blocks
                              :deleted-block-uuids deleted-block-uuids
                              :tx-data (:tx-data tx-report)
                              :tx-meta (:tx-meta tx-report)}]))))))
