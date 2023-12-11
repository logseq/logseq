(ns frontend.modules.outliner.pipeline
  (:require [clojure.core.async :as async :refer [<! go]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.react :as react]
            [frontend.handler.file-based.property.util :as property-util]
            [frontend.modules.outliner.file :as file]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.util.drawer :as drawer]
            [logseq.outliner.datascript-report :as ds-report]
            [logseq.outliner.pipeline :as outliner-pipeline]))

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

(defn- delete-property-parent-block-if-empty!
  [repo tx-report deleted-block-uuids]
  (let [empty-property-parents (->> (keep (fn [child-id]
                                            (let [e (d/entity (:db-before tx-report) [:block/uuid child-id])]
                                              (when (:created-from-property (:block/metadata (:block/parent e)))
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
               (not new-graph?))
      (try
        (reset-editing-block-content! (:tx-data tx-report) tx-meta)
        (catch :default e
          (prn :reset-editing-block-content)
          (js/console.error e)))

      (let [{:keys [pages blocks]} (ds-report/get-blocks-and-pages tx-report)
            repo (state/get-current-repo)
            tx (when-not compute-path-refs?
                 (util/profile
                  "Compute path refs: "
                  (set (compute-block-path-refs-tx tx-report blocks))))
            tx-report' (if (seq tx)
                         (let [refs-tx-data' (:tx-data (db/transact! repo tx {:outliner/transact? true
                                                                              :replace? true
                                                                              :compute-path-refs? true}))]
                           ;; merge
                           (assoc tx-report :tx-data (concat (:tx-data tx-report) refs-tx-data')))
                         tx-report)
            importing? (:graph/importing @state/state)
            deleted-block-uuids (set (outliner-pipeline/filter-deleted-blocks (:tx-data tx-report)))]

        (when (and (seq deleted-block-uuids) (not replace?)
                   (not compute-path-refs?))
          (delete-property-parent-block-if-empty! repo tx-report deleted-block-uuids))

        (let [updated-blocks (remove (fn [b] (contains? (set deleted-block-uuids)  (:block/uuid b))) blocks)
              tx-id (get-in tx-report' [:tempids :db/current-tx])
              update-tx-ids (->>
                             (map (fn [b]
                                    (when-let [db-id (:db/id b)]
                                      {:db/id db-id
                                       :block/tx-id tx-id})) updated-blocks)
                             (remove nil?))]
          (when (and (seq update-tx-ids)
                     (not (:update-tx-ids? tx-meta)))
            (db/transact! repo update-tx-ids {:replace? true
                                              :update-tx-ids? true}))
          (when (and (config/db-based-graph? repo) (not config/publishing?))
            (go
              (<! (persist-db/<transact-data repo (:tx-data tx-report) (:tx-meta tx-report))))))

        (when-not importing?
          (react/refresh! repo tx-report'))

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
