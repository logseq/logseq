(ns frontend.worker.pipeline
  "Pipeline work after transaction"
  (:require [datascript.core :as d]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.commands :as commands]
            [frontend.worker.file :as file]
            [frontend.worker.react :as worker-react]
            [frontend.worker.state :as worker-state]
            [logseq.common.defkeywords :refer [defkeywords]]
            [logseq.db :as ldb]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.graph-parser.exporter :as gp-exporter]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.datascript-report :as ds-report]
            [logseq.outliner.pipeline :as outliner-pipeline]))

(defn- refs-need-recalculated?
  [tx-meta]
  (let [outliner-op (:outliner-op tx-meta)]
    (not (or
          (contains? #{:collapse-expand-blocks :delete-blocks} outliner-op)
          (:undo? tx-meta) (:redo? tx-meta)))))

(defn- compute-block-path-refs-tx
  [{:keys [tx-meta] :as tx-report} blocks]
  (when (or (:rtc-tx? tx-meta)
            (and (:outliner-op tx-meta) (refs-need-recalculated? tx-meta))
            (:from-disk? tx-meta)
            (:new-graph? tx-meta))
    (outliner-pipeline/compute-block-path-refs-tx tx-report blocks)))

(defn- rebuild-block-refs
  [repo {:keys [tx-meta db-after]} blocks]
  (when (or (and (:outliner-op tx-meta) (refs-need-recalculated? tx-meta))
            (:rtc-tx? tx-meta))
    (mapcat (fn [block]
              (when (d/entity db-after (:db/id block))
                (let [date-formatter (worker-state/get-date-formatter repo)
                      refs (outliner-core/rebuild-block-refs repo db-after date-formatter block)]
                  ;; Always retract because if refs is empty then a delete action has occurred
                  (cond-> [[:db/retract (:db/id block) :block/refs]]
                    (seq refs)
                    (conj {:db/id (:db/id block)
                           :block/refs refs})))))
            blocks)))

(defn- insert-tag-templates
  [repo conn tx-report]
  (let [db (:db-after tx-report)
        tx-data (some->> (:tx-data tx-report)
                         (filter (fn [d] (and (= (:a d) :block/tags) (:added d))))
                         (group-by :e)
                         (mapcat (fn [[e datoms]]
                                   (let [object (d/entity db e)
                                         template-blocks (->> (mapcat (fn [id]
                                                                        (let [tag (d/entity db id)
                                                                              parents (ldb/get-page-parents tag {:node-class? true})
                                                                              templates (mapcat :logseq.property/_template-applied-to (conj parents tag))]
                                                                          templates))
                                                                      (set (map :v datoms)))
                                                              distinct
                                                              (sort-by :block/created-at)
                                                              (mapcat (fn [template]
                                                                        (let [template-blocks (rest (ldb/get-block-and-children db (:block/uuid template)
                                                                                                                                {:include-property-block? true}))
                                                                              blocks (->>
                                                                                      (cons (assoc (first template-blocks) :logseq.property/used-template (:db/id template))
                                                                                            (rest template-blocks))
                                                                                      (map (fn [e] (assoc (into {} e) :db/id (:db/id e)))))]
                                                                          blocks))))]
                                     (when (seq template-blocks)
                                       (let [result (outliner-core/insert-blocks repo conn template-blocks object {:sibling? false})]
                                         (:tx-data result)))))))]
    tx-data))

(defkeywords
  ::skip-validate-db? {:doc "tx-meta option, default = false"}
  ::skip-store-conn {:doc "tx-meta option, skip `d/store` on conn. default = false"})

(defn validate-db!
  "Validate db is slow, we probably don't want to enable it for production."
  [repo conn tx-report tx-meta context]
  (when (and (not (::skip-validate-db? tx-meta false))
             (:dev? context)
             (not (:importing? context)) (sqlite-util/db-based-graph? repo))
    (let [valid? (if (get-in tx-report [:tx-meta :reset-conn!])
                   true
                   (db-validate/validate-tx-report! tx-report (:validate-db-options context)))]
      (when (and (get-in context [:validate-db-options :fail-invalid?]) (not valid?))
        (worker-util/post-message :notification
                                  [["Invalid DB!"] :error]))))

  ;; Ensure :block/order is unique for any block that has :block/parent
  (when (or (:dev? context) (exists? js/process))
    (let [order-datoms (filter (fn [d] (= :block/order (:a d))) (:tx-data tx-report))]
      (doseq [datom order-datoms]
        (let [entity (d/entity @conn (:db/id datom))
              parent (:block/parent entity)]
          (when parent
            (let [children (:block/_parent parent)]
              (assert (= (count (distinct (map :block/order children))) (count children))
                      (str ":block/order is not unique for children blocks, parent id: " (:db/id parent))))))))))

(defn- add-missing-properties-to-typed-display-blocks
  "Add missing properties for these cases:
  1. Add corresponding tag when invoking commands like /code block.
  2. Add properties when tagging a block.
  3. Add properties when removing a tag from a block"
  [db datoms]
  (mapcat
   (fn [d]
     (cond
       (and (= (:a d) :logseq.property.node/display-type) (keyword? (:v d)) (:added d))
       (when-let [tag (ldb/get-class-ident-by-display-type (:v d))]
         [[:db/add (:e d) :block/tags tag]])

       (and (= (:a d) :block/tags)
            (contains? ldb/node-display-type-classes (:db/ident (d/entity db (:v d))))
            (false? (:added d)))
       [[:db/retract (:e d) :logseq.property.node/display-type]]

       (and (= (:a d) :block/tags)
            (contains? ldb/node-display-type-classes (:db/ident (d/entity db (:v d))))
            (:added d))
       (when-let [display-type (ldb/get-display-type-by-class-ident (:db/ident (d/entity db (:v d))))]
         [(cond->
           {:db/id (:e d)
            :logseq.property.node/display-type display-type}
            (and (= display-type :code) (d/entity db :logseq.kv/latest-code-lang))
            (assoc :logseq.property.code/lang (:kv/value (d/entity db :logseq.kv/latest-code-lang))))])))
   datoms))

(defn- invoke-hooks-for-imported-graph [conn {:keys [tx-meta] :as tx-report}]
  (let [{:keys [refs-tx-report path-refs-tx-report]}
        (outliner-pipeline/transact-new-db-graph-refs conn tx-report)
        full-tx-data (concat (:tx-data tx-report)
                             (:tx-data refs-tx-report)
                             (:tx-data path-refs-tx-report))
        final-tx-report (-> (or path-refs-tx-report refs-tx-report tx-report)
                            (assoc :tx-data full-tx-data
                                   :tx-meta tx-meta
                                   :db-before (:db-before tx-report)))]
    {:tx-report final-tx-report}))

(defn- invoke-hooks-default [repo conn {:keys [tx-meta] :as tx-report} context]
  (try
    (let [display-blocks-tx-data (add-missing-properties-to-typed-display-blocks (:db-after tx-report) (:tx-data tx-report))
          commands-tx (when-not (or (:undo? tx-meta) (:redo? tx-meta) (:rtc-tx? tx-meta))
                        (commands/run-commands tx-report))
          ;; :block/refs relies on those changes
          ;; idea: implement insert-templates using a command?
          insert-templates-tx (insert-tag-templates repo conn tx-report)
          tx-before-refs (concat display-blocks-tx-data commands-tx insert-templates-tx)
          tx-report* (if (seq tx-before-refs)
                       (let [result (ldb/transact! conn tx-before-refs {:pipeline-replace? true
                                                                        :outliner-op :pre-hook-invoke})]
                         (assoc tx-report
                                :tx-data (concat (:tx-data tx-report) (:tx-data result))
                                :db-after (:db-after result)))
                       tx-report)
          {:keys [pages blocks]} (ds-report/get-blocks-and-pages tx-report*)
          _ (when (sqlite-util/local-file-based-graph? repo)
              (let [page-ids (distinct (map :db/id pages))]
                (doseq [page-id page-ids]
                  (when (d/entity @conn page-id)
                    (file/sync-to-file repo page-id tx-meta)))))
          deleted-blocks (outliner-pipeline/filter-deleted-blocks (:tx-data tx-report*))
          deleted-block-ids (set (map :db/id deleted-blocks))
          deleted-block-uuids (set (map :block/uuid deleted-blocks))
          deleted-assets (keep (fn [id]
                                 (let [e (d/entity (:db-before tx-report*) id)]
                                   (when (ldb/asset? e)
                                     {:block/uuid (:block/uuid e)
                                      :ext (:logseq.property.asset/type e)}))) deleted-block-ids)
          blocks' (remove (fn [b] (deleted-block-ids (:db/id b))) blocks)
          block-refs (when (seq blocks')
                       (rebuild-block-refs repo tx-report* blocks'))
          refs-tx-report (when (seq block-refs)
                           (ldb/transact! conn (concat insert-templates-tx block-refs) {:pipeline-replace? true}))
          replace-tx (let [db-after (or (:db-after refs-tx-report) (:db-after tx-report*))]
                       (concat
                      ;; block path refs
                        (when (seq blocks')
                          (let [blocks' (keep (fn [b] (d/entity db-after (:db/id b))) blocks')]
                            (compute-block-path-refs-tx tx-report* blocks')))

                       ;; update block/tx-id
                        (let [updated-blocks (remove (fn [b] (contains? deleted-block-ids (:db/id b)))
                                                     (concat pages blocks))
                              tx-id (get-in (or refs-tx-report tx-report*) [:tempids :db/current-tx])]
                          (keep (fn [b]
                                  (when-let [db-id (:db/id b)]
                                    (when (:block/uuid (d/entity db-after db-id))
                                      {:db/id db-id
                                       :block/tx-id tx-id}))) updated-blocks))))
          tx-report' (if (seq replace-tx)
                       (ldb/transact! conn replace-tx {:pipeline-replace? true})
                       (do
                         (when-not (or (exists? js/process)
                                       (::skip-store-conn tx-meta false))
                           (d/store @conn))
                         tx-report*))
          _ (validate-db! repo conn tx-report* tx-meta context)
          full-tx-data (concat (:tx-data tx-report*)
                               (:tx-data refs-tx-report)
                               (:tx-data tx-report'))
          final-tx-report (assoc tx-report'
                                 :tx-data full-tx-data
                                 :tx-meta tx-meta
                                 :db-before (:db-before tx-report))
          affected-query-keys (when-not (:importing? context)
                                (worker-react/get-affected-queries-keys final-tx-report))]
      {:tx-report final-tx-report
       :affected-keys affected-query-keys
       :deleted-block-uuids deleted-block-uuids
       :deleted-assets deleted-assets
       :pages pages
       :blocks blocks})
    (catch :default e
      (js/console.error e))))

(defn invoke-hooks
  [repo conn {:keys [tx-meta] :as tx-report} context]
  (when-not (:pipeline-replace? tx-meta)
    (let [{:keys [from-disk? new-graph?]} tx-meta]
      (cond
        (or from-disk? new-graph?)
        (let [{:keys [blocks]} (ds-report/get-blocks-and-pages tx-report)
              path-refs (distinct (compute-block-path-refs-tx tx-report blocks))
              tx-report' (or
                          (when (seq path-refs)
                            (ldb/transact! conn path-refs {:pipeline-replace? true}))
                          (do
                            (when-not (or (exists? js/process)
                                          (::skip-store-conn tx-meta false))
                              (d/store @conn))
                            tx-report))
              full-tx-data (concat (:tx-data tx-report) (:tx-data tx-report'))
              final-tx-report (assoc tx-report'
                                     :tx-meta (:tx-meta tx-report)
                                     :tx-data full-tx-data
                                     :db-before (:db-before tx-report))]
          {:tx-report final-tx-report})

        (or (::gp-exporter/new-graph? tx-meta) (::sqlite-export/imported-data? tx-meta))
        (invoke-hooks-for-imported-graph conn tx-report)

        :else
        (invoke-hooks-default repo conn tx-report context)))))
