(ns frontend.worker.pipeline
  "Pipeline work after transaction"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.worker.commands :as commands]
            [frontend.worker.file :as file]
            [frontend.worker.react :as worker-react]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.util :as worker-util]
            [logseq.common.defkeywords :refer [defkeywords]]
            [logseq.common.util :as common-util]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.common.sqlite :as common-sqlite]
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
  [repo tx-report]
  (let [db (:db-after tx-report)
        journal-id (:db/id (d/entity db :logseq.class/Journal))
        journal-page (some (fn [d] (when (and (= :block/journal-day (:a d)) (:added d))
                                     (d/entity db (:e d))))
                           (:tx-data tx-report))
        journal-template? (some (fn [d] (and (:added d) (= (:a d) :block/tags) (= (:v d) journal-id))) (:tx-data tx-report))
        tx-data (some->> (:tx-data tx-report)
                         (filter (fn [d] (and (= (:a d) :block/tags) (:added d))))
                         (group-by :e)
                         (mapcat (fn [[e datoms]]
                                   (let [object (d/entity db e)
                                         template-blocks (->> (mapcat (fn [id]
                                                                        (let [tag (d/entity db id)
                                                                              parents (ldb/get-class-extends tag)
                                                                              templates (mapcat :logseq.property/_template-applied-to (conj parents tag))]
                                                                          (cond->> templates
                                                                            journal-page
                                                                            (map (fn [t] (assoc t :journal journal-page))))))
                                                                      (set (map :v datoms)))
                                                              distinct
                                                              (sort-by :block/created-at)
                                                              (mapcat (fn [template]
                                                                        (let [template-blocks (rest (ldb/get-block-and-children db (:block/uuid template)
                                                                                                                                {:include-property-block? true}))
                                                                              blocks (->>
                                                                                      (cons (assoc (first template-blocks) :logseq.property/used-template (:db/id template))
                                                                                            (rest template-blocks))
                                                                                      (map (fn [e]
                                                                                             (cond->
                                                                                              (assoc (into {} e) :db/id (:db/id e))
                                                                                               (:journal template)
                                                                                               (assoc :block/uuid
                                                                                                      (common-uuid/gen-journal-template-block (:block/uuid (:journal template))
                                                                                                                                              (:block/uuid e)))))))]
                                                                          blocks))))]
                                     (when (seq template-blocks)
                                       (let [result (outliner-core/insert-blocks
                                                     repo db template-blocks object
                                                     {:sibling? false
                                                      :keep-uuid? journal-template?})]
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
      (when-not valid?
        (when (or (get-in context [:validate-db-options :fail-invalid?]) worker-util/dev?)
          (shared-service/broadcast-to-clients! :notification
                                                [["Invalid DB!"] :error]))
        (throw (ex-info "Invalid data" {:graph repo})))))

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

(defn- gen-created-by-block
  [decoded-id-token]
  (let [user-uuid (:sub decoded-id-token)
        user-name (:cognito:username decoded-id-token)
        email (:email decoded-id-token)
        now (common-util/time-ms)]
    {:block/uuid (uuid user-uuid)
     :block/name user-name
     :block/title user-name
     :block/tags :logseq.class/Page
     :block/created-at now
     :block/updated-at now
     :logseq.property.user/name user-name
     :logseq.property.user/email email}))

(defn- add-created-by-ref-hook
  [db-before db-after tx-data tx-meta]
  (when (and (not (or (:undo? tx-meta) (:redo? tx-meta)
                      (:rtc-tx? tx-meta) (:rtc-download-graph? tx-meta)))
             (seq tx-data))
    (when-let [decoded-id-token (some-> (worker-state/get-id-token) worker-util/parse-jwt)]
      (let [created-by-ent (d/entity db-after [:block/uuid (uuid (:sub decoded-id-token))])
            created-by-block (when (nil? created-by-ent)
                               (assoc (gen-created-by-block decoded-id-token) :db/id "created-by-id"))
            created-by-id (or (:db/id created-by-ent) "created-by-id")
            add-created-by-tx-data
            (keep
             (fn [datom]
               (let [attr (:a datom)
                     value (:v datom)
                     e (:e datom)]
                 (cond
                   ;; add created-by for new-block
                   (and (keyword-identical? :block/uuid attr)
                        (:added datom))
                   (let [ent (d/entity db-after e)]
                     (when-not (:logseq.property/created-by-ref ent)
                       [:db/add e :logseq.property/created-by-ref created-by-id]))

                   ;; update created-by when block change from empty-block-title to non-empty
                   (and (keyword-identical? :block/title attr)
                        (not (string/blank? value))
                        (let [origin-title (:block/title (d/entity db-before e))]
                          (and (some? origin-title)
                               (string/blank? origin-title))))
                   [:db/add e :logseq.property/created-by-ref created-by-id])))
             tx-data)]
        (cond->> add-created-by-tx-data
          (nil? created-by-ent) (cons created-by-block))))))

(defn- compute-extra-tx-data
  [repo conn tx-report]
  (let [{:keys [db-before db-after tx-data tx-meta]} tx-report
        display-blocks-tx-data (add-missing-properties-to-typed-display-blocks db-after tx-data)
        commands-tx (when-not (or (:undo? tx-meta) (:redo? tx-meta) (:rtc-tx? tx-meta))
                      (commands/run-commands conn tx-report))
        insert-templates-tx (insert-tag-templates repo tx-report)
        created-by-tx (add-created-by-ref-hook db-before db-after tx-data tx-meta)]
    (concat display-blocks-tx-data commands-tx insert-templates-tx created-by-tx)))

(defn- invoke-hooks-default
  [repo conn {:keys [tx-meta] :as tx-report} context]
  (try
    (let [tx-before-refs (when (sqlite-util/db-based-graph? repo)
                           (compute-extra-tx-data repo conn tx-report))
          tx-report* (if (seq tx-before-refs)
                       (let [result (ldb/transact! conn tx-before-refs {:pipeline-replace? true
                                                                        :outliner-op :pre-hook-invoke
                                                                        :skip-store? true})]
                         (assoc tx-report
                                :tx-data (concat (:tx-data tx-report) (:tx-data result))
                                :db-after (:db-after result)))
                       tx-report)
          {:keys [pages blocks]} (ds-report/get-blocks-and-pages tx-report*)
          _ (when (common-sqlite/local-file-based-graph? repo)
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
                           (ldb/transact! conn block-refs {:pipeline-replace? true
                                                           :skip-store? true}))
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
          tx-report' (ldb/transact! conn replace-tx {:pipeline-replace? true
                                                     ;; Ensure db persisted
                                                     :db-persist? true})
          _ (validate-db! repo conn tx-report* tx-meta context)
          full-tx-data (concat (:tx-data tx-report*)
                               (:tx-data refs-tx-report)
                               (:tx-data tx-report'))
          final-tx-report (assoc tx-report'
                                 :tx-data full-tx-data
                                 :tx-meta tx-meta
                                 :db-before (:db-before tx-report)
                                 :db-after (or (:db-after tx-report')
                                               (:db-after tx-report)))
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
              tx-report' (if (seq path-refs)
                           (ldb/transact! conn path-refs {:pipeline-replace? true})
                           tx-report)
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
