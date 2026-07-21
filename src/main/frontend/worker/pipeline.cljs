(ns frontend.worker.pipeline
  "Pipeline work after transaction"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.commands :as commands]
            [frontend.worker.render-affected-keys :as render-affected-keys]
            [frontend.worker.state :as worker-state]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.property.build :as db-property-build]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.graph-parser.exporter :as gp-exporter]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.datascript-report :as ds-report]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.pipeline :as outliner-pipeline]
            [logseq.outliner.template :as outliner-template]))

(def ^:private rtc-tx-or-download-graph?
  (let [p (some-fn :rtc-op? :rtc-tx? :rtc-download-graph? :transact-remote?)]
    (fn [tx-meta]
      (p tx-meta))))

(defn- refs-need-recalculated?
  [tx-meta]
  (let [outliner-op (:outliner-op tx-meta)]
    (not (or
          (contains? #{:collapse-expand-blocks :delete-blocks} outliner-op)
          (:undo? tx-meta) (:redo? tx-meta)))))

(defn- imported-data?
  [tx-meta]
  (or (::gp-exporter/imported-data? tx-meta)
      (::sqlite-export/imported-data? tx-meta)))

(defn- rebuild-block-refs
  [{:keys [tx-meta db-after db-before]} blocks]
  (when (or (and (:outliner-op tx-meta) (refs-need-recalculated? tx-meta))
            (:rtc-tx? tx-meta)
            (:rtc-op? tx-meta)
            (imported-data? tx-meta))
    (mapcat (fn [block]
              (when (and (d/entity db-after (:db/id block))
                         ;; don't compute refs for reactions
                         (not (:logseq.property.reaction/target (d/entity db-after (:db/id block)))))
                (let [refs (->> (outliner-core/rebuild-block-refs db-after block) set)
                      old-refs (->> (:block/refs (d/entity db-before (:db/id block)))
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
                        added-refs)))))
            blocks)))

(defn- journal-title
  [db journal-day]
  (date-time-util/int->journal-title
   journal-day
   (:logseq.property.journal/title-format (d/entity db :logseq.class/Journal))))

(defn- ensure-template-journal-pages
  [db blocks]
  (reduce
   (fn [{:keys [db tx-data] :as result} journal-day]
     (if (ldb/get-journal-page-by-day db journal-day)
       result
       (let [{page-tx-data :tx-data} (outliner-page/create db (journal-title db journal-day) {:journal? true})]
         (when-not (seq page-tx-data)
           (throw (ex-info "failed to create template journal page" {:journal-day journal-day})))
         {:db (:db-after (d/with db page-tx-data))
          :tx-data (concat tx-data page-tx-data)})))
   {:db db
    :tx-data []}
   (outliner-template/dynamic-template-journal-days blocks)))

(defn- insert-tag-templates
  [tx-report]
  (let [db (:db-after tx-report)
        journal-id (:db/id (d/entity db :logseq.class/Journal))
        journal-page (some (fn [d] (when (and (= :block/journal-day (:a d)) (:added d))
                                     (d/entity db (:e d))))
                           (:tx-data tx-report))
        journal-template? (some (fn [d] (and (:added d)
                                             (= (:a d) :block/tags)
                                             (= (:v d) journal-id)))
                                (:tx-data tx-report))
        tag->templates (fn [id]
                         (let [tag (d/entity db id)
                               parents (ldb/get-class-extends tag)
                               templates (mapcat :logseq.property/_template-applied-to (conj parents tag))]
                           (cond->> templates
                             journal-page
                             (map (fn [t] (assoc t :journal journal-page))))))
        raw-template-blocks (fn [template]
                              (let [template-children (rest (ldb/get-block-and-children db (:block/uuid template)
                                                                                        {:include-property-block? true}))]
                                (->> (cons (assoc (first template-children)
                                                  :logseq.property/used-template (:db/id template))
                                           (rest template-children))
                                     (map (fn [block]
                                            (cond->
                                             (assoc (into {} block) :db/id (:db/id block))
                                              (:journal template)
                                              (assoc :block/uuid
                                                     (common-uuid/gen-journal-template-block
                                                      (:block/uuid (:journal template))
                                                      (:block/uuid block)))))))))
        tag-additions (->> (:tx-data tx-report)
                           (filter (fn [d] (and (= (:a d) :block/tags) (:added d))))
                           (group-by :e))
        insertion-inputs (mapcat
                          (fn [[e datoms]]
                            (let [templates (->> (set (map :v datoms))
                                                 (mapcat tag->templates)
                                                 distinct
                                                 (sort-by :block/created-at))]
                              (map (fn [template]
                                     {:object-id e
                                      :blocks (raw-template-blocks template)})
                                   templates)))
                          tag-additions)
        {db-with-pages :db page-tx-data :tx-data} (ensure-template-journal-pages db (mapcat :blocks insertion-inputs))
        insert-tx-data (mapcat
                        (fn [{:keys [object-id blocks]}]
                          (let [object (d/entity db-with-pages object-id)
                                blocks-to-insert (outliner-template/resolve-dynamic-template-blocks db-with-pages object blocks)]
                            (when (seq blocks-to-insert)
                              (let [result (outliner-core/insert-blocks
                                            db-with-pages blocks-to-insert object
                                            {:sibling? false
                                             :keep-uuid? journal-template?
                                             :outliner-op :insert-template-blocks})]
                                (concat
                                 (:tx-data result)
                                 (mapcat (fn [block]
                                           (when-let [refs (seq (outliner-pipeline/block-content-refs db-with-pages block))]
                                             [{:db/id (:db/id block)
                                               :block/refs refs}]))
                                         (:blocks result)))))))
                        insertion-inputs)]
    (concat page-tx-data insert-tx-data)))

(defn- fix-page-tags
  "Add missing attributes and remove #Page when inserting or updating block/title with inline tags"
  [{:keys [db-after tx-data tx-meta]}]
  (when-not (:rtc-tx? tx-meta)
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
                 (if (:block/page entity)
                   ;; Built-in #Tag should never turn a page child block into a class.
                   [[:db/retract eid :block/tags :logseq.class/Tag]]
                   [[:db/add eid :db/ident (db-class/create-user-class-ident-from-name db-after (:block/title entity))]
                    [:db/add eid :logseq.property.class/extends :logseq.class/Root]
                    [:db/retract eid :block/tags :logseq.class/Page]]))

             ;; remove #Page from tags/journals etc.
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
       tx-data))))

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
           (let [block (d/entity db (:e d))
                 latest-code-lang (:kv/value (d/entity db :logseq.kv/latest-code-lang))]
             [(cond->
               {:db/id (:e d)
                :logseq.property.node/display-type display-type}
                (and (= display-type :code)
                     (nil? (:logseq.property.code/lang block))
                     latest-code-lang)
                (assoc :logseq.property.code/lang latest-code-lang))]))))
     datoms)))

(defn- ensure-query-property-on-tag-additions
  [tx-report]
  (let [{:keys [db-after tx-data tx-meta]} tx-report
        query-class (entity-plus/entity-memoized db-after :logseq.class/Query)
        query-property (d/entity db-after :logseq.property/query)]
    (when (and query-class
               query-property
               (not (rtc-tx-or-download-graph? tx-meta))
               (not (:undo? tx-meta))
               (not (:redo? tx-meta)))
      (let [tagged-block-ids (->> tx-data
                                  (filter (fn [d] (and (= :block/tags (:a d)) (:added d))))
                                  (map :e)
                                  (distinct))]
        (mapcat
         (fn [eid]
           (when-let [block (d/entity db-after eid)]
             (when (ldb/class-instance? query-class block)
               (let [query-entity (:logseq.property/query block)]
                 (when-not (and query-entity (:block/uuid query-entity))
                   (let [query-text (if (string? query-entity) query-entity "")
                         value-block (db-property-build/build-property-value-block
                                      block
                                      query-property
                                      query-text
                                      {:block-uuid (common-uuid/gen-uuid)})
                         value-uuid (:block/uuid value-block)]
                     [value-block
                      (outliner-core/block-with-updated-at
                       {:db/id (:db/id block)
                        :logseq.property/query [:block/uuid value-uuid]})]))))))
         tagged-block-ids)))))

(defn- ensure-comments-blocks-property-on-tag-additions
  [tx-report]
  (let [{:keys [db-after tx-data tx-meta]} tx-report
        comments-class (d/entity db-after :logseq.class/Comments)]
    (when (and comments-class
               (not (rtc-tx-or-download-graph? tx-meta))
               (not (:undo? tx-meta))
               (not (:redo? tx-meta)))
      (->> tx-data
           (keep (fn [datom]
                   (when (and (= :block/tags (:a datom))
                              (:added datom)
                              (= (:db/id comments-class) (:v datom)))
                     (:e datom))))
           distinct
           (keep (fn [eid]
                   (when-let [block (d/entity db-after eid)]
                     (when (and (:block/parent block)
                                (not (seq (:logseq.property.comments/blocks block))))
                       (outliner-core/block-with-updated-at
                        {:db/id eid
                         :logseq.property.comments/blocks (:db/id (:block/parent block))})))))))))

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
                   (when-let [ent (d/entity db-after e)]
                     (when-not (:logseq.property/created-by-ref ent)
                       [:db/add e :logseq.property/created-by-ref created-by-id]))

                   ;; update created-by when block change from empty-block-title to non-empty
                   (and (keyword-identical? :block/title attr)
                        (not (string/blank? value))
                        (let [origin-title (:block/title (d/entity db-before e))]
                          (and (some? origin-title)
                               (string/blank? origin-title))))
                   (when (d/entity db-after e)
                     [:db/add e :logseq.property/created-by-ref created-by-id]))))
             tx-data)]
        (cond->> add-created-by-tx-data
          (nil? created-by-ent) (cons created-by-block))))))

(defn- revert-disallowed-changes
  [{:keys [tx-meta tx-data db-before db-after]}]
  (when-not (or (rtc-tx-or-download-graph? tx-meta)
                (:fix-db? tx-meta))
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
      (distinct tx-data'))))

(defn- compute-extra-tx-data
  [tx-report]
  (let [{:keys [db-before db-after tx-data tx-meta]} tx-report
        db db-after
        revert-tx-data (revert-disallowed-changes tx-report)
        fix-page-tags-tx-data (fix-page-tags tx-report)
        fix-inline-page-tx-data (fix-inline-built-in-page-classes tx-report)
        toggle-page-and-block-tx-data (when (empty? fix-inline-page-tx-data)
                                        (toggle-page-and-block db tx-report))
        display-blocks-tx-data (add-missing-properties-to-typed-display-blocks db-after tx-data tx-meta)
        ensure-query-tx-data (ensure-query-property-on-tag-additions tx-report)
        ensure-comments-tx-data (ensure-comments-blocks-property-on-tag-additions tx-report)
        commands-tx (when-not (or (:undo? tx-meta)
                                  (= :rebase (:outliner-op tx-meta))
                                  (rtc-tx-or-download-graph? tx-meta))
                      (commands/run-commands tx-report))
        before-template-tx-data (concat revert-tx-data
                                        toggle-page-and-block-tx-data
                                        display-blocks-tx-data
                                        ensure-query-tx-data
                                        ensure-comments-tx-data
                                        commands-tx)
        template-db (if (seq before-template-tx-data)
                      (:db-after (d/with db-after before-template-tx-data))
                      db-after)
        insert-templates-tx (when-not (rtc-tx-or-download-graph? tx-meta)
                              (insert-tag-templates (assoc tx-report :db-after template-db)))
        created-by-tx (add-created-by-ref-hook db-before db-after tx-data tx-meta)]
    (concat before-template-tx-data
            insert-templates-tx
            created-by-tx
            fix-page-tags-tx-data
            fix-inline-page-tx-data)))

(def ^:private journal-protected-update-attrs
  #{:block/title :block/name})

(def ^:private direct-child-visibility-attrs
  #{:block/closed-value-property :logseq.property/deleted-at})

(defn- ensure-journal-page-protected-attrs-not-updated!
  [{:keys [db-before tx-data]}]
  (when-let [violation
             (some (fn [{:keys [e a v added]}]
                     (when (and added
                                (contains? journal-protected-update-attrs a))
                       (let [before-ent (d/entity db-before e)]
                         (when (and before-ent
                                    (ldb/journal? before-ent)
                                    (not= (get before-ent a) v))
                           {:type :journal-page-protected-attr-updated
                            :entity-id e
                            :attr a
                            :before (get before-ent a)
                            :after v
                            :journal-day (:block/journal-day before-ent)}))))
                   tx-data)]
    (throw (ex-info "journal page protected attr updated" violation))))

(defn- structural-parent-ids
  [{:keys [db-before db-after tx-data]}]
  (into #{}
        (mapcat (fn [datom]
                  (let [attr (:a datom)]
                    (cond
                      (= :block/parent attr)
                      [(:v datom)]

                      (or (= :block/order attr)
                          (contains? direct-child-visibility-attrs attr))
                      (keep #(some-> (d/entity % (:e datom))
                                     :block/parent
                                     :db/id)
                            [db-before db-after])

                      :else
                      []))))
        tx-data))

(defn- collect-structural-parent-uuids
  [{:keys [db-before db-after] :as tx-report}]
  (into #{}
        (keep (fn [id]
                (some-> (or (d/entity db-after id)
                            (d/entity db-before id))
                        :block/uuid)))
        (structural-parent-ids tx-report)))

(defn- projected-reference-content-datom?
  [datom]
  (not (contains? #{:block/tx-id :block/updated-at} (:a datom))))

(defn- reference-attrs
  [db]
  (let [schema (d/schema db)
        property-class-id (d/entid db :logseq.class/Property)
        private-property-ids (into #{}
                                   (map :e)
                                   (d/datoms db :avet :logseq.property/public? false))]
    (into #{:block/refs}
          (keep (fn [datom]
                  (let [property-id (:e datom)
                        ident (some-> (first (d/datoms db :eavt property-id :db/ident))
                                      :v)]
                    (when (and ident
                               (not (contains? private-property-ids property-id))
                               (= :db.type/ref
                                  (get-in schema [ident :db/valueType])))
                      ident))))
          (if property-class-id
            (d/datoms db :avet :block/tags property-class-id)
            []))))

(def ^:private reference-attr-definition-attrs
  #{:db/ident
    :db/valueType
    :block/tags
    :logseq.property/public?})

(defn- reference-owner-ids-at
  [db reference-attrs' target-id]
  (into #{}
        (mapcat (fn [attr]
                  (map :e (d/datoms db :avet attr target-id))))
        reference-attrs'))

(defn- projected-reference-owner-ids
  [{:keys [db-before db-after tx-data]}]
  (let [target-ids (into #{}
                         (comp
                          (filter projected-reference-content-datom?)
                          (map :e)
                          (filter #(d/entity db-before %)))
                         tx-data)]
    (if (empty? target-ids)
      #{}
      (let [reference-attrs-changed?
            (some #(contains? reference-attr-definition-attrs (:a %)) tx-data)
            before-reference-attrs (reference-attrs db-before)
            after-reference-attrs (if reference-attrs-changed?
                                    (reference-attrs db-after)
                                    before-reference-attrs)]
        (into #{}
              (mapcat (fn [target-id]
                        (concat
                         (reference-owner-ids-at db-before before-reference-attrs target-id)
                         (reference-owner-ids-at db-after after-reference-attrs target-id)
                         (map :db/id
                              (keep #(some-> (d/entity % target-id)
                                             :block/closed-value-property)
                                    [db-before db-after])))))
              target-ids)))))

(defn- revision-owner-ids
  [tx-report]
  (into (projected-reference-owner-ids tx-report)
        (comp
         (filter projected-reference-content-datom?)
         (map :e))
        (:tx-data tx-report)))

(defn transact-pipeline
  "Compute extra tx-data and block refs, then stamp changed block entities and
  projected reference owners. This function must stay pure and must not call
  `d/transact!` or `ldb/transact!`."
  [{:keys [db-after tx-meta _tx-data] :as tx-report}]
  (let [derive-extra-data? (not (or (:sync-download-graph? tx-meta)
                                    (:reverse? tx-meta)
                                    (:transact-remote? tx-meta)
                                    (imported-data? tx-meta)))
        _ (when derive-extra-data?
            (ensure-journal-page-protected-attrs-not-updated! tx-report))
        extra-tx-data (when derive-extra-data?
                        (compute-extra-tx-data tx-report))
        tx-report* (if (seq extra-tx-data)
                     (let [result (d/with db-after extra-tx-data)]
                       (assoc tx-report
                              :tx-data (concat (:tx-data tx-report) (:tx-data result))
                              :db-after (:db-after result)))
                     tx-report)
        {:keys [blocks]} (ds-report/get-blocks-and-pages tx-report*)
        deleted-blocks (outliner-pipeline/filter-deleted-blocks (:tx-data tx-report*))
        deleted-block-ids (set (map :db/id deleted-blocks))
        surviving-blocks (remove (fn [block]
                                   (deleted-block-ids (:db/id block)))
                                 blocks)
        block-refs (when (and (or derive-extra-data?
                                  (imported-data? tx-meta))
                              (seq surviving-blocks))
                     (rebuild-block-refs tx-report* surviving-blocks))
        revision-owner-ids' (revision-owner-ids tx-report*)
        tx-id-data (let [db-after (:db-after tx-report*)
                         tx-id (inc (:max-tx db-after))]
                     (into []
                           (keep (fn [db-id]
                                   (when (and (not (contains? deleted-block-ids db-id))
                                              (:block/uuid (d/entity db-after db-id)))
                                     {:db/id db-id
                                      :block/tx-id tx-id})))
                           revision-owner-ids'))
        block-refs-tx-id-data (concat block-refs tx-id-data)
        replace-tx-report (when (seq block-refs-tx-id-data)
                            (d/with (:db-after tx-report*) block-refs-tx-id-data))
        tx-report' (or replace-tx-report tx-report*)
        full-tx-data (concat (:tx-data tx-report*)
                             (:tx-data replace-tx-report))]
    (assoc tx-report'
           :tx-data full-tx-data
           :tx-meta tx-meta
           :db-before (:db-before tx-report)
           :db-after (or (:db-after tx-report')
                         (:db-after tx-report)))))

(defn- invoke-hooks-default
  [tx-report _context]
  (try
    (let [{:keys [pages blocks]} (ds-report/get-blocks-and-pages tx-report)
          changed-entities (concat pages blocks)
          db-after (:db-after tx-report)
          render-dependent-eids
          (into #{}
                (mapcat (fn [entity]
                          (let [entity-id (:db/id entity)
                                property-ident (:db/ident entity)]
                            (concat
                             (map :e (d/datoms db-after :avet :block/tags entity-id))
                             (when property-ident
                               (d/q '[:find [?e ...]
                                      :in $ ?property
                                      :where [?e ?property]]
                                    db-after property-ident))))))
                changed-entities)
          render-invalidated-block-uuids
          (into #{}
                (keep #(some-> (d/entity db-after %) :block/uuid))
                render-dependent-eids)
          structural-parent-uuids (collect-structural-parent-uuids tx-report)
          deleted-blocks (outliner-pipeline/filter-deleted-blocks (:tx-data tx-report))
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
          affected-keys (render-affected-keys/affected-keys tx-report)]
      {:tx-report tx-report
       :affected-keys affected-keys
       :deleted-block-uuids deleted-block-uuids
       :deleted-assets deleted-assets
       :render-invalidated-block-uuids render-invalidated-block-uuids
       :structural-parent-uuids structural-parent-uuids
       :pages pages
       :blocks blocks})
    (catch :default e
      (js/console.error e)
      (throw e))))

(defn invoke-hooks
  [_conn tx-report context]
  (invoke-hooks-default tx-report context))
