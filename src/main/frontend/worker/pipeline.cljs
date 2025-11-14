(ns frontend.worker.pipeline
  "Pipeline work after transaction"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.commands :as commands]
            [frontend.worker.file :as file]
            [frontend.worker.react :as worker-react]
            [frontend.worker.state :as worker-state]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.order :as db-order]
            [logseq.db.common.sqlite :as common-sqlite]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.graph-parser.exporter :as gp-exporter]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.datascript-report :as ds-report]
            [logseq.outliner.pipeline :as outliner-pipeline]))

(def ^:private rtc-tx-or-download-graph?
  (let [p (some-fn :rtc-op? :rtc-tx? :rtc-download-graph?)]
    (fn [tx-meta]
      (p tx-meta))))

(defn- refs-need-recalculated?
  [tx-meta]
  (let [outliner-op (:outliner-op tx-meta)]
    (not (or
          (contains? #{:collapse-expand-blocks :delete-blocks} outliner-op)
          (:undo? tx-meta) (:redo? tx-meta)))))

(defn- rebuild-block-refs
  [repo {:keys [tx-meta db-after db-before]} blocks]
  (when (or (and (:outliner-op tx-meta) (refs-need-recalculated? tx-meta))
            (:rtc-tx? tx-meta)
            (:rtc-op? tx-meta))
    (let [db-based? (entity-plus/db-based-graph? db-after)]
      (mapcat (fn [block]
                (when (d/entity db-after (:db/id block))
                  (let [date-formatter (worker-state/get-date-formatter repo)
                        refs (->> (outliner-core/rebuild-block-refs repo db-after date-formatter block) set)]
                    (if db-based?
                      (let [old-refs (->> (:block/refs (d/entity db-before (:db/id block)))
                                          (map :db/id)
                                          set)
                            added-refs (when (and (seq refs) (not= refs old-refs))
                                         (set/difference refs old-refs))
                            retracted-refs (when (and (seq old-refs) (not= refs old-refs))
                                             (set/difference old-refs refs))]
                        (concat
                         (map (fn [id]
                                [:db/retract (:db/id block) :block/refs id])
                              retracted-refs)
                         (map (fn [id]
                                [:db/add (:db/id block) :block/refs id])
                              added-refs)))
                      ;; retract all refs for file graphs because we can't ensure `refs` are all db ids
                      (cond-> [[:db/retract (:db/id block) :block/refs]]
                        (seq refs)
                        (conj {:db/id (:db/id block)
                               :block/refs refs}))))))
              blocks))))

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
                                       ;; FIXME: outliner core apis shouldn't use `repo`
                                       (let [result (outliner-core/insert-blocks
                                                     repo db template-blocks object
                                                     {:sibling? false
                                                      :keep-uuid? journal-template?
                                                      :outliner-op :insert-template-blocks})]
                                         (:tx-data result)))))))]
    tx-data))

(defn- fix-page-tags
  "Add missing attributes and remove #Page when inserting or updating block/title with inline tags"
  [{:keys [db-after tx-data]}]
  (let [page-tag (d/entity db-after :logseq.class/Page)
        tag (d/entity db-after :logseq.class/Tag)]
    (assert page-tag "Page tag doesn't exist")
    (mapcat
     (fn [datom]
       (when (and (= :block/tags (:a datom))
                  (:added datom))
         (let [entity (d/entity db-after (:e datom))
               v-entity (d/entity db-after (:v datom))]
           (cond
             ;; add missing :db/ident and :logseq.property.class/extends for new tag
             (and (= (:v datom) (:db/id tag))
                  (not (ldb/inline-tag? (:block/raw-title entity) tag))
                  (not (:db/ident entity)))
             (let [eid (:db/id entity)]
               [[:db/add eid :db/ident (db-class/create-user-class-ident-from-name db-after (:block/title entity))]
                [:db/add eid :logseq.property.class/extends :logseq.class/Root]
                [:db/retract eid :block/tags :logseq.class/Page]])

             ;; remove #Page from tags/journals/whiteboards, etc.
             (= (:db/id page-tag) (:v datom))
             (let [tags (->> entity
                             :block/tags
                             (map :db/ident)
                             (remove #{:logseq.class/Page}))]
               (when (and (seq tags)
                          ;; has other page-classes other than `:logseq.class/Page`
                          (some db-class/page-classes tags))
                 [[:db/retract (:e datom) :block/tags :logseq.class/Page]]))

             ;; Add other page classes to an existing page
             ;; Caused by invalid tags data from server
             ;; TODO: remove this case
             ;; DEADLINE: 2025-11-30
             (and (contains? (disj db-class/page-classes :logseq.class/Page) (:db/ident v-entity))
                  (ldb/internal-page? entity))
             [[:db/retract (:e datom) :block/tags :logseq.class/Page]]

             :else
             nil))))
     tx-data)))

(defn- remove-inline-page-class-from-title
  "Remove inline page tag from title"
  [block page-tag]
  (-> (string/replace (:block/raw-title block) (str "#" (page-ref/->page-ref (:block/uuid page-tag))) "")
      string/trim))

(defn- fix-inline-built-in-page-classes
  [{:keys [db-after tx-data tx-meta]}]
  (when-not (rtc-tx-or-download-graph? tx-meta)
    (let [classes (->> (remove #{:logseq.class/Page} db-class/page-classes)
                       (map #(d/entity db-after %)))
          class-ids (set (map :db/id classes))]
      (->>
       (keep
        (fn [datom]
          (when (and (= :block/tags (:a datom))
                     (:added datom)
                     (contains? class-ids (:v datom)))
            (let [id (:e datom)
                  entity (d/entity db-after id)
                  title (or (:block/raw-title entity) (:block/title entity))
                  page-tag (d/entity db-after (:v datom))]
              (when (and title
                         (string/includes? title "#[[")
                         (ldb/inline-tag? title page-tag))
                (let [title (remove-inline-page-class-from-title entity page-tag)]
                  [{:db/id id
                    :block/title title}
                   [:db/retract id :block/tags (:v datom)]
                   [:db/retract id :block/tags :logseq.class/Page]])))))
        tx-data)
       (apply concat)))))

(defn- toggle-page-and-block
  [db {:keys [db-before db-after tx-data tx-meta]}]
  (when-not (rtc-tx-or-download-graph? tx-meta)
    (let [page-tag (d/entity db :logseq.class/Page)
          library-page (ldb/get-library-page db-after)]
      (mapcat
       (fn [datom]
         (let [id (:e datom)
               page-tag-update? (and (= :block/tags (:a datom))
                                     (= (:db/id page-tag) (:v datom)))
               move-to-library? (and (= :block/parent (:a datom))
                                     (= (:db/id library-page) (:v datom))
                                     (:added datom))]
           (when (or page-tag-update? move-to-library?)
             (let [block-before (d/entity db-before id)
                   block-after (d/entity db-after id)]
               (when block-after
                 (cond
                   ;; move non-page block to Library
                   (and move-to-library? (not (ldb/page? block-after)))
                   [{:db/id id
                     :block/name (common-util/page-name-sanity-lc (:block/title block-after))
                     :block/tags :logseq.class/Page}
                    [:db/retract id :block/page]]

                   ;; block->page
                   (and (:added datom) (or (nil? block-before) (not (ldb/page? block-before)))) ; block->page
                   (let [block (d/entity db-after (:e datom))
                         block-parent (:block/parent block)
                         ;; remove inline #Page from title
                         page-title (remove-inline-page-class-from-title block page-tag)
                         ->page-tx (concat
                                    [{:db/id id
                                      :block/name (common-util/page-name-sanity-lc page-title)
                                      :block/title page-title}
                                     [:db/retract id :block/page]]
                                    (when (or (ldb/class? block-parent) (ldb/property? block-parent))
                                      [[:db/retract id :block/parent]
                                       [:db/retract id :block/order]]))
                         move-parent-to-library-tx (when (and (ldb/page? block-parent)
                                                              (nil? (:block/parent block-parent))
                                                              block-parent
                                                              (not= (:db/id block-parent) (:db/id library-page))
                                                              (not (:db/ident block-parent))
                                                              (not (ldb/built-in? block-parent)))
                                                     [{:db/id (:db/id block-parent)
                                                       :block/parent (:db/id (ldb/get-library-page db-after))
                                                       :block/order (db-order/gen-key)}])]
                     (concat ->page-tx move-parent-to-library-tx))

                   ;; page->block
                   (and block-before (not (:added datom)) (ldb/internal-page? block-before))
                   (let [parent (:block/parent block-before)
                         parent-page (when parent
                                       (loop [parent parent]
                                         (if (ldb/page? parent)
                                           parent
                                           (recur (:block/parent parent)))))]
                     (when parent-page
                       [[:db/retract id :block/name]
                        [:db/add id :block/page (:db/id parent-page)]]))))))))
       tx-data))))

(defn- add-missing-properties-to-typed-display-blocks
  "Add missing properties for these cases:
  1. Add corresponding tag when invoking commands like /code block.
  2. Add properties when tagging a block.
  3. Add properties when removing a tag from a block"
  [db datoms tx-meta]
  (when-not (rtc-tx-or-download-graph? tx-meta)
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
     datoms)))

(defn- invoke-hooks-for-imported-graph [conn {:keys [tx-meta] :as tx-report}]
  (let [refs-tx-report (outliner-pipeline/transact-new-db-graph-refs conn tx-report)
        full-tx-data (concat (:tx-data tx-report) (:tx-data refs-tx-report))
        final-tx-report (-> (or refs-tx-report tx-report)
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
  (when (and (not (or (:undo? tx-meta) (:redo? tx-meta) (rtc-tx-or-download-graph? tx-meta)))
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

(defn- revert-disallowed-changes
  [{:keys [tx-meta tx-data db-before db-after]}]
  (when-not (rtc-tx-or-download-graph? tx-meta)
    (let [built-in-page? (fn [id]
                           (let [block (d/entity db-after id)]
                             (and (contains? sqlite-create-graph/built-in-pages-names
                                             (:block/title block))
                                  (ldb/built-in? block))))
          tx-data' (mapcat
                    (fn [datom]
                      (let [[e a v _t added] datom]
                        (when added
                          (cond
                          ;; using built-in pages as tags
                            (and (= a :block/tags) (built-in-page? v))
                            [[:db/retract v :db/ident]
                             [:db/retract v :logseq.property.class/extends]
                             [:db/retract v :block/tags :logseq.class/Tag]
                             [:db/add v :block/tags :logseq.class/Page]
                             [:db/retract e a v]]

                            ;; built-in block protected properties updated
                            (and (contains? #{:db/ident :block/title :block/name :block/uuid
                                              :logseq.property/type :db/cardinality
                                              :logseq.property/built-in? :logseq.property.class/extends} a)
                                 (some? (d/entity db-before e))
                                 (let [block (d/entity db-after e)]
                                   (and (ldb/built-in? block)
                                        (not= (get block a) (get (d/entity db-before e) a)))))
                            (if-some [prev-v (get (d/entity db-before e) a)]
                              (if (= a :logseq.property.class/extends)
                                [[:db/retract e a]
                                 {:db/id e
                                  a (map :db/id prev-v)}]
                                [[:db/add e a prev-v]])
                              [[:db/retract e a v]])

                            ;; user class extends unexpected built-in classes
                            (and (= a :logseq.property.class/extends)
                                 (let [block (d/entity db-after v)]
                                   (and (ldb/built-in? block)
                                        (not (contains? #{:logseq.class/Root :logseq.class/Page :logseq.class/Property
                                                          :logseq.class/Task :logseq.class/Card}
                                                        (:db/ident block))))))
                            (let [prev-v (get (d/entity db-before e) a)]
                              [[:db/retract e a v]
                               (if (seq prev-v)
                                 {:db/id e
                                  a (map :db/id prev-v)}
                                 [:db/add e a :logseq.class/Root])])

                            :else
                            nil))))
                    tx-data)]
      (when (seq tx-data')
        (prn :debug ::revert-built-in-block-updates :tx-data (distinct tx-data')))
      (distinct tx-data'))))

(defn- compute-extra-tx-data
  [repo tx-report]
  (let [{:keys [db-before db-after tx-data tx-meta]} tx-report
        db db-after
        revert-tx-data (revert-disallowed-changes tx-report)
        fix-page-tags-tx-data (fix-page-tags tx-report)
        fix-inline-page-tx-data (fix-inline-built-in-page-classes tx-report)
        toggle-page-and-block-tx-data (when (empty? fix-inline-page-tx-data)
                                        (toggle-page-and-block db tx-report))
        display-blocks-tx-data (add-missing-properties-to-typed-display-blocks db-after tx-data tx-meta)
        commands-tx (when-not (or (:undo? tx-meta) (:redo? tx-meta) (rtc-tx-or-download-graph? tx-meta))
                      (commands/run-commands tx-report))
        insert-templates-tx (when-not (rtc-tx-or-download-graph? tx-meta)
                              (insert-tag-templates repo tx-report))
        created-by-tx (add-created-by-ref-hook db-before db-after tx-data tx-meta)]
    (concat revert-tx-data
            toggle-page-and-block-tx-data
            display-blocks-tx-data
            commands-tx
            insert-templates-tx
            created-by-tx
            fix-page-tags-tx-data
            fix-inline-page-tx-data)))

(defn- remove-conflict-datoms
  [datoms]
  (->> datoms
       (group-by (fn [d] (take 4 d))) ; group by '(e a v tx)
       (keep (fn [[_eavt same-eavt-datoms]]
               (first (rseq same-eavt-datoms))))
       ;; sort by :tx, use nth to make this fn works on both vector and datom
       (sort-by #(nth % 3))))

(defn transact-pipeline
  "Compute extra tx-data and block/refs, should ensure it's a pure function and
  doesn't call `d/transact!` or `ldb/transact!`."
  [repo {:keys [db-after tx-meta] :as tx-report}]
  (let [db-based? (entity-plus/db-based-graph? db-after)
        extra-tx-data (when db-based?
                        (compute-extra-tx-data repo tx-report))
        tx-report* (if (seq extra-tx-data)
                     (let [result (d/with db-after extra-tx-data)]
                       (assoc tx-report
                              :tx-data (concat (:tx-data tx-report) (:tx-data result))
                              :db-after (:db-after result)))
                     tx-report)
        {:keys [pages blocks]} (ds-report/get-blocks-and-pages tx-report*)
        deleted-blocks (outliner-pipeline/filter-deleted-blocks (:tx-data tx-report*))
        deleted-block-ids (set (map :db/id deleted-blocks))
        blocks' (remove (fn [b] (deleted-block-ids (:db/id b))) blocks)
        block-refs (when (seq blocks')
                     (rebuild-block-refs repo tx-report* blocks'))
        tx-id-data (let [db-after (:db-after tx-report*)
                         updated-blocks (remove (fn [b] (contains? deleted-block-ids (:db/id b)))
                                                (concat pages blocks))
                         tx-id (get-in tx-report* [:tempids :db/current-tx])]
                     (keep (fn [b]
                             (when-let [db-id (:db/id b)]
                               (when (:block/uuid (d/entity db-after db-id))
                                 {:db/id db-id
                                  :block/tx-id tx-id}))) updated-blocks))
        block-refs-tx-id-data (concat block-refs tx-id-data)
        replace-tx-report (when (seq block-refs-tx-id-data)
                            (d/with (:db-after tx-report*) block-refs-tx-id-data))
        tx-report' (or replace-tx-report tx-report*)
        full-tx-data (-> (concat (:tx-data tx-report*)
                                 (:tx-data replace-tx-report))
                         remove-conflict-datoms)]
    (assoc tx-report'
           :tx-data full-tx-data
           :tx-meta tx-meta
           :db-before (:db-before tx-report)
           :db-after (or (:db-after tx-report')
                         (:db-after tx-report)))))

(defn- invoke-hooks-default
  [repo conn {:keys [tx-meta] :as tx-report} context]
  (try
    (let [{:keys [pages blocks]} (ds-report/get-blocks-and-pages tx-report)
          deleted-blocks (outliner-pipeline/filter-deleted-blocks (:tx-data tx-report))
          _ (when (common-sqlite/local-file-based-graph? repo)
              (let [page-ids (distinct (map :db/id pages))]
                (doseq [page-id page-ids]
                  (when (d/entity @conn page-id)
                    (file/sync-to-file repo page-id tx-meta)))))
          deleted-block-uuids (set (map :block/uuid deleted-blocks))
          deleted-block-ids (set (map :db/id deleted-blocks))
          _ (when (seq deleted-block-uuids)
              (swap! worker-state/*deleted-block-uuid->db-id merge
                     (zipmap (map :block/uuid deleted-blocks)
                             (map :db/id deleted-blocks))))
          deleted-assets (keep (fn [id]
                                 (let [e (d/entity (:db-before tx-report) id)]
                                   (when (ldb/asset? e)
                                     {:block/uuid (:block/uuid e)
                                      :ext (:logseq.property.asset/type e)}))) deleted-block-ids)
          affected-query-keys (when-not (or (:importing? context) (:rtc-download-graph? tx-meta))
                                (worker-react/get-affected-queries-keys tx-report))]
      {:tx-report tx-report
       :affected-keys affected-query-keys
       :deleted-block-uuids deleted-block-uuids
       :deleted-assets deleted-assets
       :pages pages
       :blocks blocks})
    (catch :default e
      (js/console.error e)
      (throw e))))

(defn invoke-hooks
  [repo conn {:keys [tx-meta] :as tx-report} context]
  (let [{:keys [from-disk? new-graph? transact-new-graph-refs?]} tx-meta]
    (when-not transact-new-graph-refs?
      (cond
        (or from-disk? new-graph?)
        {:tx-report tx-report}

        (or (::gp-exporter/new-graph? tx-meta)
            (and (::sqlite-export/imported-data? tx-meta) (:import-db? tx-meta)))
        (invoke-hooks-for-imported-graph conn tx-report)

        :else
        (invoke-hooks-default repo conn tx-report context)))))
