(ns frontend.worker.pipeline
  "Pipeline work after transaction"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.commands :as commands]
            [frontend.worker.file :as file]
            [frontend.worker.react :as worker-react]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [logseq.common.defkeywords :refer [defkeywords]]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.common.sqlite :as common-sqlite]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.sqlite.util :as sqlite-util]
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
                                                      :keep-uuid? journal-template?
                                                      :outliner-op :insert-template-blocks})]
                                         (:tx-data result)))))))]
    tx-data))

(defkeywords
  ::skip-validate-db? {:doc "tx-meta option, default = false"}
  ::skip-store-conn {:doc "tx-meta option, skip `d/store` on conn. default = false"})

(defn validate-db!
  "Validate db is slow, we probably don't want to enable it for production."
  [repo conn tx-report tx-meta context]
  (when (and (not (::skip-validate-db? tx-meta false))
             (or (:dev? context) (:undo? tx-meta) (:redo? tx-meta))
             (not (:importing? context)) (sqlite-util/db-based-graph? repo))
    (let [valid? (if (get-in tx-report [:tx-meta :reset-conn!])
                   true
                   (db-validate/validate-tx-report! tx-report (:validate-db-options context)))]
      (when-not valid?
        (when (and (or (get-in context [:validate-db-options :fail-invalid?]) worker-util/dev?)
                   ;; don't notify on production when undo/redo failed
                   (not (and (not (:dev? context)) (or (:undo? tx-meta) (:redo? tx-meta)))))
          (shared-service/broadcast-to-clients! :notification
                                                [["Invalid DB!"] :error]))
        (throw (ex-info "Invalid data" {:graph repo})))))

  ;; Ensure :block/order is unique for any block that has :block/parent
  (when false;; (:dev? context)
    (let [order-datoms (filter (fn [d] (= :block/order (:a d)))
                               (:tx-data tx-report))]
      (doseq [datom order-datoms]
        (let [entity (d/entity @conn (:e datom))
              parent (:block/parent entity)]
          (when parent
            (let [children (:block/_parent parent)
                  order-different? (= (count (distinct (map :block/order children))) (count children))]
              (when-not order-different?
                (throw (ex-info (str ":block/order is not unique for children blocks, parent id: " (:db/id parent))
                                {:children (->> (map (fn [b] (select-keys b [:db/id :block/title :block/order])) children)
                                                (sort-by :block/order))
                                 :tx-meta tx-meta
                                 :tx-data (:tx-data tx-report)}))))))))))

(defn- fix-page-tags
  "Add missing attributes and remove #Page when inserting or updating block/title with inline tags"
  [{:keys [db-after tx-data tx-meta]}]
  (when-not (rtc-tx-or-download-graph? tx-meta)
    (let [page-tag (d/entity db-after :logseq.class/Page)
          tag (d/entity db-after :logseq.class/Tag)]
      (assert page-tag "Page tag doesn't exist")
      (->>
       (keep
        (fn [datom]
          (cond
            ;; add missing :db/ident and :logseq.property.class/extends for new tag
            (and (= :block/tags (:a datom))
                 (:added datom)
                 (= (:v datom) (:db/id tag)))
            (let [t (d/entity db-after (:e datom))]
              (when (and (not (ldb/inline-tag? (:block/raw-title t) tag))
                         (not (:db/ident t))) ; new tag without db/ident
                (let [eid (:db/id t)]
                  [[:db/add eid :db/ident (db-class/create-user-class-ident-from-name db-after (:block/title t))]
                   [:db/add eid :logseq.property.class/extends :logseq.class/Root]
                   [:db/retract eid :block/tags :logseq.class/Page]])))

            ;; remove #Page from tags/journals/whitebaords, etc.
            (and (= :block/tags (:a datom))
                 (:added datom)
                 (= (:db/id page-tag) (:v datom)))
            (let [tags (->> (d/entity db-after (:e datom))
                            :block/tags
                            (map :db/ident)
                            (remove #{:logseq.class/Page}))]
              (when (and (seq tags)
                         ;; has other page-classes other than `:logseq.class/Page`
                         (some db-class/page-classes tags))
                [[:db/retract (:e datom) :block/tags :logseq.class/Page]]))

            :else
            nil))
        tx-data)
       (apply concat)))))

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
  [conn {:keys [db-before db-after tx-data tx-meta]}]
  (when-not (rtc-tx-or-download-graph? tx-meta)
    (let [page-tag (d/entity @conn :logseq.class/Page)
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

(defn- compute-extra-tx-data
  [repo conn tx-report]
  (let [{:keys [db-before db-after tx-data tx-meta]} tx-report
        fix-page-tags-tx-data (fix-page-tags tx-report)
        fix-inline-page-tx-data (fix-inline-built-in-page-classes tx-report)
        toggle-page-and-block-tx-data (when (empty? fix-inline-page-tx-data)
                                        (toggle-page-and-block conn tx-report))
        display-blocks-tx-data (add-missing-properties-to-typed-display-blocks db-after tx-data tx-meta)
        commands-tx (when-not (or (:undo? tx-meta) (:redo? tx-meta) (rtc-tx-or-download-graph? tx-meta))
                      (commands/run-commands conn tx-report))
        insert-templates-tx (when-not (rtc-tx-or-download-graph? tx-meta)
                              (insert-tag-templates repo tx-report))
        created-by-tx (add-created-by-ref-hook db-before db-after tx-data tx-meta)]
    (concat toggle-page-and-block-tx-data
            display-blocks-tx-data
            commands-tx
            insert-templates-tx
            created-by-tx
            fix-page-tags-tx-data
            fix-inline-page-tx-data)))

(defn- reverse-tx!
  [conn tx-data]
  (let [reversed-tx-data (map (fn [[e a v _tx add?]]
                                (let [op (if add? :db/retract :db/add)]
                                  [op e a v])) tx-data)]
    (d/transact! conn reversed-tx-data {:revert-tx-data? true
                                        :gen-undo-ops? false})))

(defn- undo-tx-data-if-disallowed!
  [conn {:keys [tx-data tx-meta]}]
  (when-not (:rtc-download-graph? tx-meta)
    (let [db @conn
          page-has-block-parent? (some (fn [d] (and (:added d)
                                                    (= :block/parent (:a d))
                                                    (ldb/page? (d/entity db (:e d)))
                                                    (not (ldb/page? (d/entity db (:v d)))))) tx-data)]
      ;; TODO: add other cases that need to be undo
      (when page-has-block-parent?
        (reverse-tx! conn tx-data)
        (throw (ex-info "Page can't have block as parent"
                        {:type :notification
                         :payload {:message "Page can't have block as parent"
                                   :type :warning}
                         :tx-data tx-data}))))))

(defn- invoke-hooks-default
  [repo conn {:keys [tx-meta] :as tx-report} context]
  ;; Notice: don't catch `undo-tx-data-if-disallowed!` since we want it failed immediately
  (undo-tx-data-if-disallowed! conn tx-report)
  (try
    (let [extra-tx-data (when (sqlite-util/db-based-graph? repo)
                          (compute-extra-tx-data repo conn tx-report))
          tx-report* (if (seq extra-tx-data)
                       (let [result (ldb/transact! conn extra-tx-data {:pipeline-replace? true
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
          _ (when (seq deleted-block-uuids)
              (swap! worker-state/*deleted-block-uuid->db-id merge
                     (zipmap (map :block/uuid deleted-blocks)
                             (map :db/id deleted-blocks))))
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
          _ (when-not (:revert-tx-data? tx-meta)
              (try
                (validate-db! repo conn tx-report* tx-meta context)
                (catch :default e
                  (when-not (rtc-tx-or-download-graph? tx-meta)
                    (prn :debug :revert-invalid-tx
                         :tx-meta
                         tx-meta
                         :tx-data
                         (:tx-data tx-report*))
                    (reverse-tx! conn (:tx-data tx-report*)))
                  (throw e))))
          full-tx-data (concat (:tx-data tx-report*)
                               (:tx-data refs-tx-report)
                               (:tx-data tx-report'))
          final-tx-report (assoc tx-report'
                                 :tx-data full-tx-data
                                 :tx-meta tx-meta
                                 :db-before (:db-before tx-report)
                                 :db-after (or (:db-after tx-report')
                                               (:db-after tx-report)))
          affected-query-keys (when-not (or (:importing? context) (:rtc-download-graph? tx-meta))
                                (worker-react/get-affected-queries-keys final-tx-report))]
      {:tx-report final-tx-report
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
  (when-not (or (:pipeline-replace? tx-meta)
                (:revert-tx-data? tx-meta))
    (let [{:keys [from-disk? new-graph?]} tx-meta]
      (cond
        (or from-disk? new-graph?)
        {:tx-report tx-report}

        (or (::gp-exporter/new-graph? tx-meta)
            (and (::sqlite-export/imported-data? tx-meta) (:import-db? tx-meta)))
        (invoke-hooks-for-imported-graph conn tx-report)

        :else
        (invoke-hooks-default repo conn tx-report context)))))
