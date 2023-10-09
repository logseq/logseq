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
            [frontend.persist-db :as persist-db]
            [clojure.string :as string]
            [datascript.core :as d]))

(defn updated-page-hook
  [tx-report page]
  (when (and
         (not (config/db-based-graph? (state/get-current-repo)))
         (not (get-in tx-report [:tx-meta :created-from-journal-template?])))
    (file/sync-to-file page (:outliner-op (:tx-meta tx-report)))))

(defn compute-block-path-refs-tx
  [{:keys [tx-meta] :as tx-report} blocks]
  (when (and (:outliner-op tx-meta) (react/path-refs-need-recalculated? tx-meta))
    (outliner-pipeline/compute-block-path-refs-tx tx-report blocks)))

(defn- reset-editing-block-content!
  [tx-data]
  (let [repo (state/get-current-repo)]
    (when (config/db-based-graph? repo)
      (when-let [edit-block (state/get-edit-block)]
        (when-let [last-datom (-> (filter (fn [datom]
                                            (and (= :block/content (:a datom))
                                                 (= (:e datom) (:db/id edit-block)))) tx-data)
                                  last)]
          (when-let [input (state/get-input)]
            (when (:added last-datom)
              (let [db-content (:block/content (db/entity (:e last-datom)))]
                (when (not= (string/trim db-content)
                            (string/trim (.-value input)))
                  (state/set-edit-content! input db-content))))))))))

(defn- delete-property-parent-block-if-empty!
  [repo tx-report deleted-block-uuids]
  (let [empty-property-parents (->> (keep (fn [child-id]
                                            (let [e (d/entity (:db-before tx-report) [:block/uuid child-id])]
                                              (when (:created-from-property (:block/metadata e))
                                                (let [parent-now (db/entity (:db/id (:block/parent e)))]
                                                  (when (empty? (:block/_parent parent-now))
                                                    parent-now))))) deleted-block-uuids)
                                    distinct)]
    (when (seq empty-property-parents)
      (let [tx-data (->>
                     (mapcat (fn [b]
                               (let [{:keys [created-from-block created-from-property]} (:block/metadata b)
                                     created-block (db/entity [:block/uuid created-from-block])
                                     properties (assoc (:block/properties created-block) created-from-property "")]
                                 (when (and created-block created-from-property)
                                   [[:db/retractEntity (:db/id b)]
                                    [:db/add (:db/id created-block) :block/properties properties]])))
                             empty-property-parents)
                     (remove nil?))]
        (db/transact! repo tx-data {:outliner/transact? true
                                    :replace? true})))))

(defn invoke-hooks
  [tx-report]
  (let [tx-meta (:tx-meta tx-report)
        {:keys [compute-path-refs? from-disk? new-graph? replace?]} tx-meta]
    (when (and (not from-disk?)
               (not new-graph?)
               (not compute-path-refs?))

      (reset-editing-block-content! (:tx-data tx-report))

      (let [{:keys [pages blocks]} (ds-report/get-blocks-and-pages tx-report)
            repo (state/get-current-repo)
            tx (util/profile
                "Compute path refs: "
                (set (compute-block-path-refs-tx tx-report blocks)))
            tx-report' (if (seq tx)
                         (let [refs-tx-data' (:tx-data (db/transact! repo tx {:outliner/transact? true
                                                                              :replace? true
                                                                              :compute-path-refs? true}))]
                           ;; merge
                           (assoc tx-report :tx-data (concat (:tx-data tx-report) refs-tx-data')))
                         tx-report)
            importing? (:graph/importing @state/state)
            deleted-block-uuids (set (outliner-pipeline/filter-deleted-blocks (:tx-data tx-report)))]

        (when (and (seq deleted-block-uuids) (not replace?))
          (delete-property-parent-block-if-empty! repo tx-report deleted-block-uuids))

        (when-not importing?
          (react/refresh! repo tx-report'))

        (when (and (config/db-based-graph? repo) (not (:skip-persist? tx-meta))
                   (not replace?)
                   (not (:update-tx-ids? tx-meta)))
          (let [upsert-blocks (outliner-pipeline/build-upsert-blocks blocks deleted-block-uuids (:db-after tx-report'))
                updated-blocks (remove (fn [b] (contains? (set deleted-block-uuids)  (:block/uuid b))) blocks)
                tx-id (get-in tx-report' [:tempids :db/current-tx])
                update-tx-ids (map (fn [b]
                                     (when-let [db-id (:db/id b)]
                                       {:db/id db-id
                                        :block/tx-id tx-id})) updated-blocks)]
            (when (seq update-tx-ids)
              (db/transact! repo update-tx-ids {:replace? true
                                                :update-tx-ids? true}))
            (when-not config/publishing?
              (p/let [_transact-result (persist-db/<transact-data repo upsert-blocks deleted-block-uuids)
                      _ipc-result (comment ipc/ipc :db-transact-data repo
                                           (pr-str
                                            {:blocks upsert-blocks
                                             :deleted-block-uuids deleted-block-uuids}))]
              ;; TODO: disable edit when transact failed to avoid future data-loss
              ;; (prn "DB transact result: " ipc-result)
                ))))

        (when (and (not (:delete-files? tx-meta))
                   (not replace?))
          (doseq [p (seq pages)]
            (updated-page-hook tx-report p)))

        (when (and state/lsp-enabled?
                   (seq blocks)
                   (not importing?)
                   (not replace?)
                   (<= (count blocks) 1000))
          (state/pub-event! [:plugin/hook-db-tx
                             {:blocks  blocks
                              :deleted-block-uuids deleted-block-uuids
                              :tx-data (:tx-data tx-report)
                              :tx-meta (:tx-meta tx-report)}]))))))
