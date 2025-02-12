(ns frontend.worker.db.migrate
  "Handles SQLite and datascript migrations for DB graphs"
  (:require [cljs-bean.core :as bean]
            [cljs-time.coerce :as tc]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [frontend.worker.search :as search]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.order :as db-order]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.build :as db-property-build]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.util :as sqlite-util]))

;; TODO: fixes/rollback
;; Frontend migrations
;; ===================

(defn- replace-original-name-content-with-title
  [conn search-db]
  (search/truncate-table! search-db)
  (d/transact! conn
               [{:db/ident :block/title
                 :db/index true}])
  (let [datoms (d/datoms @conn :avet :block/uuid)
        tx-data (mapcat
                 (fn [d]
                   (let [e (d/entity @conn (:e d))]
                     (concat
                      (when (:block/content e)
                        [[:db/retract (:e d) :block/content]
                         [:db/add (:e d) :block/title (:block/content e)]])
                      (when (:block/original-name e)
                        [[:db/retract (:e d) :block/original-name]
                         [:db/add (:e d) :block/title (:block/original-name e)]])))) datoms)]
    tx-data))

(defn- replace-object-and-page-type-with-node
  [conn _search-db]
  (->> (ldb/get-all-properties @conn)
       (filter (fn [p]
                 (contains? #{:object :page} (:type (:block/schema p)))))
       (map
        (fn [p]
          {:db/id (:db/id p)
           :block/schema (assoc (:block/schema p) :type :node)}))))

(defn- update-task-ident
  [conn _search-db]
  [{:db/id (:db/id (d/entity @conn :logseq.class/task))
    :db/ident :logseq.class/Task}])

(defn- property-checkbox-type-non-ref
  [conn _search-db]
  (let [db @conn
        properties (d/q
                    '[:find [?ident ...]
                      :where
                      [?p :block/schema ?s]
                      [(get ?s :type) ?t]
                      [(= ?t :checkbox)]
                      [?p :db/ident ?ident]]
                    db)
        datoms (mapcat #(d/datoms db :avet %) properties)
        schema-tx-data (map
                        (fn [ident]
                          [:db/retract ident :db/valueType])
                        properties)
        value-tx-data (mapcat
                       (fn [d]
                         (let [e (:e d)
                               a (:a d)
                               v (:v d)
                               ve (when (integer? v) (d/entity db v))
                               ve-value (:property.value/content ve)]
                           (when (some? ve-value)
                             [[:db/add e a ve-value]
                              [:db/retractEntity v]])))
                       datoms)]
    (concat schema-tx-data value-tx-data)))

(defn- update-table-properties
  [conn _search-db]
  (let [old-new-props {:logseq.property/table-sorting :logseq.property.table/sorting
                       :logseq.property/table-filters :logseq.property.table/filters
                       :logseq.property/table-ordered-columns :logseq.property.table/ordered-columns
                       :logseq.property/table-hidden-columns :logseq.property.table/hidden-columns}
        props-tx (mapv (fn [[old new]]
                         {:db/id (:db/id (d/entity @conn old))
                          :db/ident new})
                       old-new-props)]
    ;; Property changes need to be in their own tx for subsequent uses of properties to take effect
    (ldb/transact! conn props-tx {:db-migrate? true})

    (mapcat (fn [[old new]]
              (->> (d/q '[:find ?b ?prop-v :in $ ?prop :where [?b ?prop ?prop-v]] @conn old)
                   (mapcat (fn [[id prop-value]]
                             [[:db/retract id old]
                              [:db/add id new prop-value]]))))
            old-new-props)))

(defn- rename-properties
  [props-to-rename]
  (fn [conn _search-db]
    (when (ldb/db-based-graph? @conn)
      (let [props-tx (mapv (fn [[old new]]
                             (merge {:db/id (:db/id (d/entity @conn old))
                                     :db/ident new}
                                    (when-let [new-title (get-in db-property/built-in-properties [new :title])]
                                      {:block/title new-title
                                       :block/name (common-util/page-name-sanity-lc new-title)})))
                           props-to-rename)]
       ;; Property changes need to be in their own tx for subsequent uses of properties to take effect
        (ldb/transact! conn props-tx {:db-migrate? true})

        (mapcat (fn [[old new]]
                 ;; can't use datoms b/c user properties aren't indexed
                  (->> (d/q '[:find ?b ?prop-v :in $ ?prop :where [?b ?prop ?prop-v]] @conn old)
                       (mapcat (fn [[id prop-value]]
                                 [[:db/retract id old]
                                  [:db/add id new prop-value]]))))
                props-to-rename)))))

(defn- rename-classes
  [classes-to-rename]
  (fn [conn _search-db]
    (when (ldb/db-based-graph? @conn)
      (mapv (fn [[old new]]
              (merge {:db/id (:db/id (d/entity @conn old))
                      :db/ident new}
                     (when-let [new-title (get-in db-class/built-in-classes [new :title])]
                       {:block/title new-title
                        :block/name (common-util/page-name-sanity-lc new-title)})))
            classes-to-rename))))

(defn- set-hide-empty-value
  [_conn _search-db]
  (map
   (fn [k]
     {:db/ident k
      :logseq.property/hide-empty-value true})
   [:logseq.task/status :logseq.task/priority :logseq.task/deadline]))

(defn- update-hl-color-and-page
  [conn _search-db]
  (when (ldb/db-based-graph? @conn)
    (let [db @conn
          hl-color (d/entity db :logseq.property.pdf/hl-color)
          hl-page (d/entity db :logseq.property.pdf/hl-page)
          existing-colors (d/datoms db :avet :logseq.property.pdf/hl-color)
          color-update-tx (mapcat
                           (fn [datom]
                             (let [block (d/entity db (:v datom))
                                   color-ident (keyword "logseq.property" (str "color." (:block/title block)))]
                               (if block
                                 [[:db/add (:e datom) :logseq.property.pdf/hl-color color-ident]
                                  [:db/retractEntity (:db/id block)]]
                                 [[:db/retract (:e datom) :logseq.property.pdf/hl-color]])))
                           existing-colors)
          page-datoms (d/datoms db :avet :logseq.property.pdf/hl-page)
          page-update-tx (mapcat
                          (fn [datom]
                            (let [block (d/entity db (:v datom))
                                  value (db-property/property-value-content block)]
                              (if (integer? value)
                                [[:db/add (:e datom) :logseq.property.pdf/hl-page value]
                                 [:db/retractEntity (:db/id block)]]
                                [[:db/retract (:e datom) :logseq.property.pdf/hl-page]])))
                          page-datoms)]
    ;; update schema first
      (d/transact! conn
                   (concat
                    [{:db/ident :logseq.property.pdf/hl-page
                      :block/schema {:type :raw-number}}
                     [:db/retract (:db/id hl-page) :db/valueType]
                     {:db/ident :logseq.property.pdf/hl-color
                      :block/schema {:type :default}}]
                    (db-property-build/closed-values->blocks
                     (assoc hl-color :closed-values (get-in db-property/built-in-properties [:logseq.property.pdf/hl-color :closed-values])))))
    ;; migrate data
      (concat color-update-tx page-update-tx))))

(defn- store-url-value-in-block-title
  [conn _search-db]
  (let [db @conn
        url-properties (->> (d/datoms db :avet :block/type "property")
                            (keep (fn [datom]
                                    (let [property (d/entity db (:e datom))
                                          type (get-in property [:block/schema :type])]
                                      (when (= type :url)
                                        property)))))
        datoms (mapcat
                (fn [property]
                  (d/datoms db :avet (:db/ident property)))
                url-properties)]
    (mapcat
     (fn [datom]
       (if-let [url-block (when (integer? (:v datom)) (d/entity db (:v datom)))]
         (let [url-value (db-property/property-value-content url-block)]
           [[:db/retract (:db/id url-block) :property.value/content]
            [:db/add (:db/id url-block) :block/title url-value]])
         [[:db/retract (:e datom) (:a datom)]]))
     datoms)))

(defn- replace-hidden-type-with-schema
  [conn _search-db]
  (let [db @conn
        datoms (d/datoms db :avet :block/type "hidden")]
    (map
     (fn [datom]
       {:db/id (:e datom)
        :block/type "page"
        :block/schema {:public? false}})
     datoms)))

(defn- update-block-type-many->one
  [conn _search-db]
  (let [db @conn
        datoms (d/datoms db :avet :block/type)
        new-type-tx (->> (set (map :e datoms))
                         (mapcat
                          (fn [id]
                            (let [types (:block/type (d/entity db id))
                                  type (if (set? types)
                                         (cond
                                           (contains? types "class")
                                           "class"
                                           (contains? types "property")
                                           "property"
                                           (contains? types "whiteboard")
                                           "whiteboard"
                                           (contains? types "journal")
                                           "journal"
                                           (contains? types "hidden")
                                           "hidden"
                                           (contains? types "page")
                                           "page"
                                           :else
                                           (first types))
                                         types)]
                              (when type
                                [[:db/retract id :block/type]
                                 [:db/add id :block/type type]])))))
        schema (:schema db)]
    (ldb/transact! conn new-type-tx {:db-migrate? true})
    (d/reset-schema! conn (update schema :block/type #(assoc % :db/cardinality :db.cardinality/one)))
    []))

(defn- deprecate-class-parent
  [conn _search-db]
  (let [db @conn]
    (when (ldb/db-based-graph? db)
      (let [datoms (d/datoms db :avet :class/parent)]
        (->> (set (map :e datoms))
             (mapcat
              (fn [id]
                (let [value (:db/id (:class/parent (d/entity db id)))]
                  [[:db/retract id :class/parent]
                   [:db/add id :logseq.property/parent value]]))))))))

(defn- deprecate-class-schema-properties
  [conn _search-db]
  (let [db @conn]
    (when (ldb/db-based-graph? db)
      (let [datoms (d/datoms db :avet :class/schema.properties)]
        (->> (set (map :e datoms))
             (mapcat
              (fn [id]
                (let [values (map :db/id (:class/schema.properties (d/entity db id)))]
                  (concat
                   [[:db/retract id :class/schema.properties]]
                   (map
                    (fn [value]
                      [:db/add id :logseq.property.class/properties value])
                    values))))))))))

(defn- update-db-attrs-type
  [conn _search-db]
  (let [db @conn]
    (when (ldb/db-based-graph? db)
      (let [alias (d/entity db :block/alias)
            tags (d/entity db :block/tags)]
        [[:db/add (:db/id alias) :block/schema {:type :page
                                                :cardinality :many
                                                :view-context :page
                                                :public? true}]
         [:db/add (:db/id tags) :block/schema {:type :class
                                               :cardinality :many
                                               :public? true
                                               :classes #{:logseq.class/Root}}]]))))

(defn- fix-view-for
  [conn _search-db]
  (let [db @conn]
    (when (ldb/db-based-graph? db)
      (let [datoms (d/datoms db :avet :logseq.property/view-for)
            e (d/entity db :logseq.property/view-for)
            fix-schema [:db/add (:db/id e) :block/schema {:type :node
                                                          :hide? true
                                                          :public? false}]
            fix-data (keep
                      (fn [d]
                        (if-let [id (if (= :all-pages (:v d))
                                      (:db/id (ldb/get-case-page db common-config/views-page-name))
                                      (:db/id (d/entity db (:v d))))]
                          [:db/add (:e d) :logseq.property/view-for id]
                          [:db/retract (:e d) :logseq.property/view-for (:v d)]))
                      datoms)]
        (cons fix-schema fix-data)))))

(defn- add-card-properties
  [conn _search-db]
  (let [db @conn]
    (when (ldb/db-based-graph? db)
      (let [card (d/entity db :logseq.class/Card)
            card-id (:db/id card)]
        [[:db/add card-id :logseq.property.class/properties :logseq.property.fsrs/due]
         [:db/add card-id :logseq.property.class/properties :logseq.property.fsrs/state]]))))

(defn- add-query-property-to-query-tag
  [conn _search-db]
  (let [db @conn]
    (when (ldb/db-based-graph? db)
      (let [query (d/entity db :logseq.class/Query)
            query-id (:db/id query)]
        [[:db/add query-id :logseq.property.class/properties :logseq.property/query]]))))

(defn- add-card-view
  [conn _search-db]
  (let [db @conn]
    (when (ldb/db-based-graph? db)
      (let [ident :logseq.property.view/type.card
            uuid' (common-uuid/gen-uuid :db-ident-block-uuid ident)
            property (d/entity db :logseq.property.view/type)
            m (cond->
               (db-property-build/build-closed-value-block
                uuid'
                nil
                "Card View"
                property
                {:db-ident :logseq.property.view/type.card})
                true
                (assoc :block/order (db-order/gen-key)))]
        [m]))))

(defn- add-tags-for-typed-display-blocks
  [conn _search-db]
  (let [db @conn]
    (when (ldb/db-based-graph? db)
      (let [property (d/entity db :logseq.property.node/display-type)
            ;; fix property
            _ (when-not (and (ldb/property? property)
                             (true? (:db/index property)))
                (let [fix-tx-data (->>
                                   (select-keys db-property/built-in-properties [:logseq.property.node/display-type])
                                   (sqlite-create-graph/build-properties)
                                   (map (fn [m]
                                          (assoc m :db/id (:db/id property)))))]
                  (d/transact! conn fix-tx-data)))
            datoms (d/datoms @conn :avet :logseq.property.node/display-type)]
        (map
         (fn [d]
           (when-let [tag-id (ldb/get-class-ident-by-display-type (:v d))]
             [:db/add (:e d) :block/tags tag-id]))
         datoms)))))

(defn- rename-card-view-to-gallery-view
  [conn _search-db]
  (when (ldb/db-based-graph? @conn)
    (let [card (d/entity @conn :logseq.property.view/type.card)]
      [{:db/id (:db/id card)
        :db/ident :logseq.property.view/type.gallery
        :block/title "Gallery View"}])))

(defn- add-pdf-annotation-class
  [conn _search-db]
  (let [db @conn]
    (when (ldb/db-based-graph? db)
      (let [datoms (d/datoms db :avet :logseq.property/ls-type :annotation)]
        (map
         (fn [d]
           [:db/add (:e d) :block/tags :logseq.class/pdf-annotation])
         datoms)))))

(defn- replace-special-id-ref-with-id-ref
  [conn _search-db]
  (let [db @conn
        ref-special-chars "~^"
        id-ref-pattern (re-pattern
                        (str "(?i)" "~\\^" "(" common-util/uuid-pattern ")"))
        datoms (d/datoms db :avet :block/title)]
    (keep
     (fn [{:keys [e v]}]
       (if (string? v)
         (when (string/includes? v ref-special-chars)
           (let [entity (d/entity db e)]
             (cond
               (and (ldb/page? entity)
                    (re-find db-content/id-ref-pattern v))
               [:db/retractEntity e]

               (string/includes? v (str page-ref/left-brackets ref-special-chars))
               (let [title' (string/replace v (str page-ref/left-brackets ref-special-chars) page-ref/left-brackets)]
                 (prn :debug {:old-title v :new-title title'})
                 {:db/id e
                  :block/title title'})

               (re-find id-ref-pattern v)
               (let [title' (string/replace v id-ref-pattern "$1")]
                 (prn :debug {:old-title v :new-title title'})
                 {:db/id e
                  :block/title title'}))))
         [:db/retractEntity e]))
     datoms)))

(defn- replace-block-type-with-tags
  [conn _search-db]
  (let [db @conn
        block-type-entity (d/entity db :block/type)
        ;; Not using (d/datoms db :avet :block/type) here because some old graphs
        ;; don't have :block/type indexed
        datoms (->> (d/datoms db :eavt)
                    (filter (fn [d] (= :block/type (:a d)))))
        tx-data (mapcat (fn [{:keys [e _a v]}]
                          (let [tag (case v
                                      "page" :logseq.class/Page
                                      "class" :logseq.class/Tag
                                      "property" :logseq.class/Property
                                      "journal" :logseq.class/Journal
                                      "whiteboard" :logseq.class/Whiteboard
                                      "asset" :logseq.class/Asset
                                      "closed value" nil
                                      (throw (ex-info "unsupported block/type" {:type v})))]
                            (cond->
                             [[:db/retract e :block/type]]
                              (some? tag)
                              (conj [:db/add e :block/tags tag])))) datoms)]
    (concat
     tx-data
     (when block-type-entity
       [[:db/retractEntity (:db/id block-type-entity)]]))))

(defn- add-scheduled-to-task
  [conn _search-db]
  (let [db @conn]
    (when (ldb/db-based-graph? db)
      (let [e (d/entity db :logseq.class/Task)
            eid (:db/id e)]
        [[:db/add eid :logseq.property.class/properties :logseq.task/scheduled]]))))

(defn- update-deadline-to-datetime
  [conn _search-db]
  (let [db @conn]
    (when (ldb/db-based-graph? db)
      (let [e (d/entity db :logseq.task/deadline)
            datoms (d/datoms db :avet :logseq.task/deadline)]
        (concat
         [[:db/retract (:db/id e) :db/valueType]
          {:db/id (:db/id e)
           :block/schema (assoc (:block/schema e) :type :datetime)}]
         (map
          (fn [d]
            (if-let [day (:block/journal-day (d/entity db (:v d)))]
              (let [v' (tc/to-long (date-time-util/int->local-date day))]
                [:db/add (:e d) :logseq.task/deadline v'])
              [:db/retract (:e d) :logseq.task/deadline]))
          datoms))))))

(defn- remove-block-format-from-db!
  [conn]
  (let [db @conn]
    (when (ldb/db-based-graph? db)
      (let [datoms (d/datoms db :avet :block/uuid)
            tx-data (map
                     (fn [d]
                       [:db/retract (:e d) :block/format])
                     datoms)]
        (ldb/transact! conn tx-data {:db-migrate? true})
        (d/reset-schema! conn (dissoc (:schema db) :block/format))))))

(defn- remove-duplicated-contents-page
  [conn _search-db]
  (let [db @conn]
    (when (ldb/db-based-graph? db)
      (let [duplicated-contents-pages (->>
                                       (d/q
                                        '[:find ?b ?created-at
                                          :where
                                          [?b :block/title "Contents"]
                                          [?b :block/tags ?t]
                                          [?t :db/ident :logseq.class/Page]
                                          [?b :logseq.property/built-in? true]
                                          [?b :block/created-at ?created-at]]
                                        db)
                                       (sort-by second)
                                       rest)]
        (when (seq duplicated-contents-pages)
          (let [tx-data (mapcat
                         (fn [[e _]]
                           (let [p (d/entity db e)
                                 blocks (:block/_page p)]
                             (conj (mapv (fn [b] [:db/retractEntity (:db/id b)]) blocks)
                                   [:db/retractEntity e])))
                         duplicated-contents-pages)]
            (ldb/transact! conn tx-data {:db-migrate? true})))
        []))))

(defn- deprecate-logseq-user-ns
  [conn _search-db]
  (let [db @conn]
    (when (ldb/db-based-graph? db)
      (let [db-ids (d/q '[:find [?b ...]
                          :where
                          (or [?b :logseq.user/name]
                              [?b :logseq.user/email]
                              [?b :logseq.user/avatar])]
                        db)]
        (into
         [[:db/retractEntity :logseq.user/name]
          [:db/retractEntity :logseq.user/email]
          [:db/retractEntity :logseq.user/avatar]]
         (mapcat (fn [e] [[:db/retract e :logseq.user/name]
                          [:db/retract e :logseq.user/email]
                          [:db/retract e :logseq.user/avatar]])
                 db-ids))))))

(defn- update-view-filter
  [conn _search-db]
  (let [db @conn]
    (when (ldb/db-based-graph? db)
      (let [ident :logseq.property.table/filters
            property (d/entity db ident)
            property-tx {:db/id (:db/id property)
                         :logseq.property/type :map}
            data-tx (mapcat
                     (fn [d]
                       (let [v (:v d)]
                         (cond
                           (= v :logseq.property/empty-placeholder)
                           [[:db/retract (:e d) ident]]
                           (map? v)
                           nil
                           :else
                           [[:db/retract (:e d) ident]
                            [:db/add (:e d) ident {:or? false :filters (:v d)}]])))
                     (d/datoms db :avet ident))]
        (cons property-tx data-tx)))))

(defn- schema->qualified-property-keyword
  [prop-schema]
  (reduce-kv
   (fn [r k v]
     (if (qualified-keyword? k)
       (assoc r k v)
       (cond
         (= k :cardinality)
         (assoc r :db/cardinality v)
         (= k :classes)
         (assoc r :logseq.property/classes v)
         (= k :position)
         (assoc r :logseq.property/ui-position v)
         :else
         (assoc r (keyword "logseq.property" k) v))))
   {}
   prop-schema))

(defn- remove-block-schema
  [conn _search-db]
  (let [db @conn
        schema (:schema db)]
    (when (ldb/db-based-graph? db)
      (let [db-ids (d/q '[:find [?b ...]
                          :where
                          [?b :block/schema]]
                        db)
            tx-data (mapcat (fn [eid]
                              (let [entity (d/entity db eid)
                                    schema (:block/schema entity)
                                    schema-properties (dissoc (schema->qualified-property-keyword schema) :db/cardinality)
                                    hidden-page? (contains? #{common-config/favorites-page-name common-config/views-page-name}
                                                            (:block/title entity))
                                    m (assoc schema-properties :db/id eid)
                                    m' (if hidden-page?
                                         (-> m (assoc :logseq.property/hide? true) (dissoc :logseq.property/public?))
                                         m)]
                                (concat
                                 [m'
                                  [:db/retract eid :block/schema]])))
                            db-ids)
            tx-data' (concat tx-data [[:db/retractEntity :block/schema]])]
        (d/transact! conn tx-data' {:db-migrate? true})))
    (d/reset-schema! conn (dissoc schema :block/schema))
    []))

(defn- add-view-icons
  [_conn _search-db]
  [{:db/ident :logseq.property.view/type.table
    :logseq.property/icon {:type :tabler-icon :id "table"}}
   {:db/ident :logseq.property.view/type.list
    :logseq.property/icon {:type :tabler-icon :id "list"}}
   {:db/ident :logseq.property.view/type.gallery
    :logseq.property/icon {:type :tabler-icon :id "layout-grid"}}])

(def ^:large-vars/cleanup-todo schema-version->updates
  "A vec of tuples defining datascript migrations. Each tuple consists of the
   schema version integer and a migration map. A migration map can have keys of :properties, :classes
   and :fix."
  [[3 {:properties [:logseq.property/table-sorting :logseq.property/table-filters
                    :logseq.property/table-hidden-columns :logseq.property/table-ordered-columns]
       :classes    []}]
   [4 {:fix (fn [conn _search-db]
              (let [pages (d/datoms @conn :avet :block/name)
                    tx-data (keep (fn [d]
                                    (let [entity (d/entity @conn (:e d))]
                                      (when-not (:block/type entity)
                                        {:db/id (:e d)
                                         :block/type "page"}))) pages)]
                tx-data))}]
   [5 {:properties [:logseq.property/view-for]
       :classes    []}]
   [6 {:properties [:logseq.property.asset/remote-metadata]}]
   [7 {:fix replace-original-name-content-with-title}]
   [8 {:fix replace-object-and-page-type-with-node}]
   [9 {:fix update-task-ident}]
   [10 {:fix update-table-properties}]
   [11 {:fix property-checkbox-type-non-ref}]
   [12 {:fix update-block-type-many->one}]
   [13 {:classes [:logseq.class/Journal]
        :properties [:logseq.property.journal/title-format]}]
   [14 {:properties [:logseq.property/parent]
        :fix deprecate-class-parent}]
   [15 {:properties [:logseq.property.class/properties]
        :fix deprecate-class-schema-properties}]
   [16 {:properties [:logseq.property.class/hide-from-node]}]
   [17 {:fix update-db-attrs-type}]
   [18 {:properties [:logseq.property.view/type]}]
   [19 {:classes [:logseq.class/Query]}]
   [20 {:fix fix-view-for}]
   [21 {:properties [:logseq.property.table/sized-columns]}]
   [22 {:properties [:logseq.property.fsrs/state :logseq.property.fsrs/due]}]
   [23 {:fix add-card-properties}]
   [24 {:classes [:logseq.class/Cards]}]
   [25 {:properties [:logseq.property/query]
        :fix add-query-property-to-query-tag}]
   [26 {:properties [:logseq.property.node/type]}]
   [27 {:properties [:logseq.property.code/mode]}]
   [28 {:fix (rename-properties {:logseq.property.node/type :logseq.property.node/display-type})}]
   [29 {:properties [:logseq.property.code/lang]}]
   ["29.1" {:fix add-card-view}]
   ["29.2" {:fix rename-card-view-to-gallery-view}]
   ;; Asset relies on :logseq.property.view/type.gallery
   [30 {:classes [:logseq.class/Asset]
        :properties [:logseq.property.asset/type :logseq.property.asset/size :logseq.property.asset/checksum]}]
   [31 {:properties [:logseq.property/asset]}]
   [32 {:properties [:logseq.property.asset/last-visit-page]}]
   [33 {:properties [:logseq.property.pdf/hl-image]}]
   [34 {:properties [:logseq.property.asset/resize-metadata]}]
   [37 {:classes [:logseq.class/Code-block :logseq.class/Quote-block :logseq.class/Math-block]
        :properties [:logseq.property.node/display-type :logseq.property.code/lang]}]
   [38 {:fix add-tags-for-typed-display-blocks}]
   [40 {:classes [:logseq.class/pdf-annotation]
        :properties [:logseq.property/ls-type :logseq.property/hl-color :logseq.property/asset
                     :logseq.property.pdf/hl-page :logseq.property.pdf/hl-value
                     :logseq.property/hl-type :logseq.property.pdf/hl-image]
        :fix add-pdf-annotation-class}]
   [41 {:fix (rename-classes {:logseq.class/pdf-annotation :logseq.class/Pdf-annotation})}]
   [42 {:fix (rename-properties {:logseq.property/hl-color :logseq.property.pdf/hl-color
                                 :logseq.property/hl-type :logseq.property.pdf/hl-type})}]
   [43 {:properties [:logseq.property/hide-empty-value]
        :fix set-hide-empty-value}]
   [44 {:fix update-hl-color-and-page}]
   [45 {:fix store-url-value-in-block-title}]
   [46 {:properties [:logseq.property.attribute/kv-value :block/type :block/schema :block/parent
                     :block/order :block/collapsed? :block/page
                     :block/refs :block/path-refs :block/link
                     :block/title :block/closed-value-property
                     :block/created-at :block/updated-at
                     :logseq.property.attribute/property-classes :logseq.property.attribute/property-value-content]}]
   [47 {:fix replace-hidden-type-with-schema}]
   [48 {:properties [:logseq.property/default-value :logseq.property/scalar-default-value]}]
   [49 {:fix replace-special-id-ref-with-id-ref}]
   [50 {:properties [:logseq.property.user/name :logseq.property.user/email :logseq.property.user/avatar]
        :fix deprecate-logseq-user-ns}]
   [51 {:classes [:logseq.class/Property :logseq.class/Tag :logseq.class/Page :logseq.class/Whiteboard]}]
   [52 {:fix replace-block-type-with-tags}]
   [53 {:properties [:logseq.task/scheduled :logseq.task/recur-frequency :logseq.task/recur-unit :logseq.task/repeated?
                     :logseq.task/scheduled-on-property :logseq.task/recur-status-property]
        :fix add-scheduled-to-task}]
   [54 {:properties [:logseq.property/choice-checkbox-state :logseq.property/checkbox-display-properties]}]
   [55 {:fix update-deadline-to-datetime}]
   [56 {:properties [:logseq.property/enable-history?
                     :logseq.property.history/block :logseq.property.history/property
                     :logseq.property.history/ref-value :logseq.property.history/scalar-value]}]
   [58 {:fix remove-duplicated-contents-page}]
   [59 {:properties [:logseq.property/created-by]}]
   [60 {:fix (rename-properties {:logseq.property/public :logseq.property/publishing-public?})}]
   [61 {:properties [:logseq.property/type :logseq.property/hide? :logseq.property/public? :logseq.property/view-context :logseq.property/ui-position]
        :fix (rename-properties {:property/schema.classes :logseq.property/classes
                                 :property.value/content :logseq.property/value})}]
   [62 {:fix remove-block-schema}]
   [63 {:properties [:logseq.property.table/pinned-columns]}]
   [64 {:fix update-view-filter}]
   ;;;; schema-version format: "<major>.<minor>"
   ;;;; int number equals to "<major>" (without <minor>)
   ["64.1" {:properties [:logseq.property.view/group-by-property]
            :fix add-view-icons}]])

(let [max-schema-version (last (sort (map (comp (juxt :major :minor) db-schema/parse-schema-version first)
                                          schema-version->updates)))
      compare-result (db-schema/compare-schema-version db-schema/version max-schema-version)]
  (assert (>= 0 compare-result) [db-schema/version max-schema-version])
  (when (neg? compare-result)
    (js/console.warn (str "Current db schema-version is " db-schema/version ", max available schema-version is " max-schema-version))))

(defn- ensure-built-in-data-exists!
  [conn]
  (let [*uuids (atom {})
        data (->> (sqlite-create-graph/build-db-initial-data "")
                  (keep (fn [data]
                          (if (map? data)
                            (cond
                              (= (:db/ident data) :logseq.kv/schema-version)
                              nil

                              (= (:block/title data) "Contents")
                              nil

                              (:file/path data)
                              (if-let [block (d/entity @conn [:file/path (:file/path data)])]
                                (let [existing-data (assoc (into {} block) :db/id (:db/id block))]
                                  (merge data existing-data))
                                data)

                              (:block/uuid data)
                              (if-let [block (d/entity @conn [:block/uuid (:block/uuid data)])]
                                (do
                                  (swap! *uuids assoc (:block/uuid data) (:block/uuid block))
                                  (let [existing-data (assoc (into {} block) :db/id (:db/id block))]
                                    (reduce
                                     (fn [data [k existing-value]]
                                       (update data k
                                               (fn [v]
                                                 (cond
                                                   (and (vector? v) (= :block/uuid (first v)))
                                                   v
                                                   (and (coll? v) (not (map? v)))
                                                   (concat v (if (coll? existing-value) existing-value [existing-value]))
                                                   :else
                                                   (if (some? existing-value) existing-value v)))))
                                     data
                                     existing-data)))
                                data)

                              :else
                              data)
                            data))))
        ;; using existing page's uuid
        data' (walk/prewalk
               (fn [f]
                 (cond
                   (and (de/entity? f) (:block/uuid f))
                   (or (:db/ident f) [:block/uuid (:block/uuid f)])
                   (and (vector? f) (= :block/uuid (first f)) (@*uuids (second f)))
                   [:block/uuid (@*uuids (second f))]
                   :else
                   f))
               data)]
    (d/transact! conn data' {:fix-db? true
                             :db-migrate? true})))

(defn- upgrade-version!
  [conn search-db db-based? version {:keys [properties classes fix]}]
  (let [version (db-schema/parse-schema-version version)
        db @conn
        new-properties (->> (select-keys db-property/built-in-properties properties)
                            ;; property already exists, this should never happen
                            (remove (fn [[k _]]
                                      (when (d/entity db k)
                                        (assert (str "DB migration: property already exists " k)))))
                            (into {})
                            sqlite-create-graph/build-properties
                            (map (fn [b] (assoc b :logseq.property/built-in? true))))
        classes' (->> (concat [:logseq.class/Property :logseq.class/Tag :logseq.class/Page :logseq.class/Journal :logseq.class/Whiteboard] classes)
                      distinct)
        new-classes (->> (select-keys db-class/built-in-classes classes')
                         ;; class already exists, this should never happen
                         (remove (fn [[k _]] (d/entity db k)))
                         (into {})
                         (#(sqlite-create-graph/build-initial-classes* % (zipmap properties properties)))
                         (map (fn [b] (assoc b :logseq.property/built-in? true))))
        new-class-idents (keep (fn [class]
                                 (when-let [db-ident (:db/ident class)]
                                   {:db/ident db-ident})) new-classes)
        fixes (when (fn? fix)
                (fix conn search-db))
        tx-data (if db-based? (concat new-class-idents new-properties new-classes fixes) fixes)
        tx-data' (concat
                  [(sqlite-util/kv :logseq.kv/schema-version version)]
                  tx-data)]
    (ldb/transact! conn tx-data' {:db-migrate? true})
    (println "DB schema migrated to" version)))

(defn fix-path-refs!
  [conn]
  (let [data (keep
              (fn [d]
                (when (not (de/entity? (d/entity @conn (:v d))))
                  [:db/retract (:e d) (:a d) (:v d)]))
              (d/datoms @conn :avet :block/path-refs))]
    (when (seq data)
      (ldb/transact! conn data {:fix-db? true
                                :db-migrate? true}))))

(defn fix-missing-title!
  [conn]
  (let [data (->>
              (mapcat
               (fn [d]
                 (let [entity (d/entity @conn (:e d))]
                   [(when-not (:block/title entity)
                      [:db/add (:e d) :block/title (:v d)])
                    (when-not (:block/uuid entity)
                      [:db/add (:e d) :block/uuid (d/squuid)])]))
               (d/datoms @conn :avet :block/name))
              (remove nil?))]
    (when (seq data)
      (ldb/transact! conn data {:fix-db? true
                                :db-migrate? true}))))

(defn fix-block-timestamps!
  [conn]
  (let [data (map
              (fn [d]
                (let [entity (d/entity @conn (:e d))]
                  (when (or (nil? (:block/created-at entity))
                            (nil? (:block/updated-at entity)))
                    (-> (select-keys entity [:db/id :block/created-at :block/updated-at])
                        sqlite-util/block-with-timestamps))))
              (d/datoms @conn :avet :block/uuid))]
    (when (seq data)
      (ldb/transact! conn data {:fix-db? true
                                :db-migrate? true}))))

(defn fix-properties!
  [conn]
  (let [schema (:schema @conn)
        wrong-properties (filter (fn [[k v]]
                                   (and (int? k) (not (qualified-ident? v)))) schema)
        data (map (fn [[k _v]]
                    [:db/retract k :db/valueType]) wrong-properties)]
    (when (seq data)
      (ldb/transact! conn data {:fix-db? true
                                :db-migrate? true})
      (d/reset-schema! conn (apply dissoc schema (keys wrong-properties))))))

(defn fix-missing-page-tag!
  [conn]
  (let [data (keep
              (fn [d]
                (let [entity (d/entity @conn (:e d))]
                  (when-not (:block/tags entity)
                    [:db/add (:e d) :block/tags :logseq.class/Page])))
              (d/datoms @conn :avet :block/name))]
    (when (seq data)
      (ldb/transact! conn data {:fix-db? true
                                :db-migrate? true}))))

(defn migrate
  "Migrate 'frontend' datascript schema and data. To add a new migration,
  add an entry to schema-version->updates and bump db-schema/version"
  [conn search-db]
  (when (ldb/db-based-graph? @conn)
    (let [db @conn
          version-in-db (db-schema/parse-schema-version (or (:kv/value (d/entity db :logseq.kv/schema-version)) 0))
          compare-result (db-schema/compare-schema-version db-schema/version version-in-db)]
      (cond
        (zero? compare-result)
        nil

        (neg? compare-result) ; outdated client, db version could be synced from server
        ;; FIXME: notify users to upgrade to the latest version asap
        nil

        (pos? compare-result)
        (try
          (let [db-based? (ldb/db-based-graph? @conn)
                updates (keep (fn [[v updates]]
                                (let [v* (db-schema/parse-schema-version v)]
                                  (when (and (neg? (db-schema/compare-schema-version version-in-db v*))
                                             (not (pos? (db-schema/compare-schema-version v* db-schema/version))))
                                    [v updates])))
                              schema-version->updates)]
            (fix-path-refs! conn)
            (fix-missing-title! conn)
            (remove-block-format-from-db! conn)
            (fix-properties! conn)
            (fix-block-timestamps! conn)
            (println "DB schema migrated from" version-in-db)
            (doseq [[v m] updates]
              (upgrade-version! conn search-db db-based? v m))
            (ensure-built-in-data-exists! conn)
            (fix-missing-page-tag! conn))
          (catch :default e
            (prn :error (str "DB migration failed to migrate to " db-schema/version " from " version-in-db ":"))
            (js/console.error e)
            (throw e)))))))

(defn fix-invalid-data!
  [conn invalid-entity-ids]
  (let [db @conn
        tx-data (->>
                 (mapcat
                  (fn [id]
                    (let [entity (d/entity db id)
                         ;; choice not included in closed values
                          wrong-choice (keep
                                        (fn [[k v]]
                                          (if (= "block.temp" (namespace k))
                                            [:db/retract (:db/id entity) k]
                                            (when-let [property (d/entity db k)]
                                              (let [closed-values (:property/closed-values property)]
                                                (when (seq closed-values)
                                                  (if (and (de/entity? v)
                                                           (not (contains? (set (map :db/id closed-values)) (:db/id v))))
                                                    [:db/retractEntity (:db/id v)]
                                                    [:db/retract (:db/id entity) k]))))))
                                        (into {} entity))
                          eid (:db/id entity)
                          fix (cond
                                (and (:db/valueType entity)
                                     (not (or (:db/ident entity)
                                              (:db/cardinality entity))))
                                [[:db/retract eid :db/valueType]
                                 [:db/retract eid :db/cardinality]]

                                (= #{:block/tx-id} (set (keys entity)))
                                [[:db/retractEntity (:db/id entity)]]

                                (and (seq (:block/refs entity))
                                     (not (or (:block/title entity) (:block/content entity) (:property.value/content entity))))
                                [[:db/retractEntity (:db/id entity)]]

                                (:logseq.property.node/type entity)
                                [[:db/retract eid :logseq.property.node/type]
                                 [:db/retractEntity :logseq.property.node/type]
                                 [:db/add eid :logseq.property.node/display-type (:logseq.property.node/type entity)]]

                                (and (:db/cardinality entity) (not (ldb/property? entity)))
                                [[:db/add eid :block/tags :logseq.class/Property]
                                 [:db/retract eid :block/tags :logseq.class/Page]]

                                ;; (when-let [schema (:block/schema entity)]
                                ;;   (or (:cardinality schema) (:classes schema)))
                                ;; (let [schema (:block/schema entity)]
                                ;;   [[:db/add eid :block/schema (dissoc schema :cardinality :classes)]])

                                (and (:logseq.property.asset/type entity)
                                     (or (nil? (:logseq.property.asset/checksum entity))
                                         (nil? (:logseq.property.asset/size entity))))
                                [[:db/retractEntity eid]]

                                ;; add missing :db/ident for classes && properties
                                (and (ldb/class? entity) (nil? (:db/ident entity)))
                                [[:db/add (:db/id entity) :db/ident (db-class/create-user-class-ident-from-name (:block/title entity))]]

                                (and (ldb/property? entity) (nil? (:db/ident entity)))
                                [[:db/add (:db/id entity) :db/ident (db-property/create-user-property-ident-from-name (:block/title entity))]]

                                ;; remove #Page for classes/properties/journals
                                (and (ldb/internal-page? entity) (or (ldb/class? entity) (ldb/property? entity) (ldb/journal? entity)))
                                [[:db/retract (:db/id entity) :block/tags :logseq.class/Page]]

                                ;; remove file entities
                                (and (:file/path entity)
                                     (not (contains? #{"logseq/custom.css" "logseq/config.js"  "logseq/config.edn"} (:file/path entity))))
                                [[:db/retractEntity (:db/id entity)]]

                                (:block/properties-order entity)
                                [[:db/retract (:db/id entity) :block/properties-order]]

                                (:block/macros entity)
                                [[:db/retract (:db/id entity) :block/macros]]

                                (and (seq (:block/tags entity)) (not (every? ldb/class? (:block/tags entity))))
                                (let [tags (remove ldb/class? (:block/tags entity))]
                                  (map
                                   (fn [tag]
                                     {:db/id (:db/id tag)
                                      :db/ident (or (:db/ident tag) (db-class/create-user-class-ident-from-name (:block/title entity)))
                                      :block/tags :logseq.class/Tag})
                                   tags))
                                :else
                                nil)]
                      (into fix wrong-choice)))
                  invalid-entity-ids)
                 distinct)]
    (when (seq tx-data)
      (d/transact! conn tx-data {:fix-db? true}))))

(defn fix-db!
  [conn & {:keys [invalid-entity-ids]}]
  (when (ldb/db-based-graph? @conn)
    (try
      (ensure-built-in-data-exists! conn)
      (remove-block-format-from-db! conn)
      (fix-path-refs! conn)
      (fix-missing-title! conn)
      (fix-properties! conn)
      (fix-block-timestamps! conn)
      (fix-missing-page-tag! conn)
      (when (seq invalid-entity-ids)
        (fix-invalid-data! conn invalid-entity-ids))

      ;; TODO: remove this after RTC db fixed
      (let [data (deprecate-logseq-user-ns conn nil)]
        (when (seq data)
          (d/transact! conn data {:fix-db? true})))
      (catch :default e
        (js/console.error e)))))

;; Backend migrations
;; ==================

(defn- add-addresses-in-kvs-table
  [^Object sqlite-db]
  (let [columns (->> (.exec sqlite-db #js {:sql "SELECT NAME FROM PRAGMA_TABLE_INFO('kvs')"
                                           :rowMode "array"})
                     bean/->clj
                     (map first)
                     set)]
    (when-not (contains? columns "addresses")
      (let [data (some->> (.exec sqlite-db #js {:sql "select addr, content from kvs"
                                                :rowMode "array"})
                          bean/->clj
                          (map (fn [[addr content]]
                                 (let [content' (sqlite-util/transit-read content)
                                       [content' addresses] (if (map? content')
                                                              [(dissoc content' :addresses)
                                                               (when-let [addresses (:addresses content')]
                                                                 (js/JSON.stringify (bean/->js addresses)))]
                                                              [content' nil])
                                       content' (sqlite-util/transit-write content')]
                                   #js {:$addr addr
                                        :$content content'
                                        :$addresses addresses}))))]
        (.exec sqlite-db #js {:sql "alter table kvs add column addresses JSON"})
        (.transaction sqlite-db
                      (fn [tx]
                        (doseq [item data]
                          (.exec tx #js {:sql "INSERT INTO kvs (addr, content, addresses) values ($addr, $content, $addresses) on conflict(addr) do update set content = $content, addresses = $addresses"
                                         :bind item}))))))))

(defn migrate-sqlite-db
  "Migrate sqlite db schema"
  [db]
  (add-addresses-in-kvs-table db))
