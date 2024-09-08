(ns frontend.worker.db.migrate
  "DB migration"
  (:require [datascript.core :as d]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.class :as db-class]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]
            [frontend.worker.search :as search]
            [cljs-bean.core :as bean]
            [logseq.db.sqlite.util :as sqlite-util]))

;; TODO: fixes/rollback

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

(def schema-version->updates
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
   [19 {:classes [:logseq.class/Query]}]])

(let [max-schema-version (apply max (map first schema-version->updates))]
  (assert (<= db-schema/version max-schema-version))
  (when (< db-schema/version max-schema-version)
    (js/console.warn (str "Current db schema-version is " db-schema/version ", max available schema-version is " max-schema-version))))

(defn migrate-sqlite-db
  [db]
  (add-addresses-in-kvs-table db))

(defn migrate
  [conn search-db]
  (let [db @conn
        version-in-db (or (:kv/value (d/entity db :logseq.kv/schema-version)) 0)]
    (cond
      (= version-in-db db-schema/version)
      nil

      (< db-schema/version version-in-db) ; outdated client, db version could be synced from server
      ;; FIXME: notify users to upgrade to the latest version asap
      nil

      (> db-schema/version version-in-db)
      (let [db-based? (ldb/db-based-graph? @conn)
            updates (keep (fn [[v updates]]
                            (when (and (< version-in-db v) (<= v db-schema/version))
                              updates))
                          schema-version->updates)
            properties (mapcat :properties updates)
            new-properties (->> (select-keys db-property/built-in-properties properties)
                                ;; property already exists, this should never happen
                                (remove (fn [[k _]]
                                          (when (d/entity db k)
                                            (assert (str "DB migration: property already exists " k)))))
                                (into {})
                                sqlite-create-graph/build-initial-properties*
                                (map (fn [b] (assoc b :logseq.property/built-in? true))))
            classes (mapcat :classes updates)
            new-classes (->> (select-keys db-class/built-in-classes classes)
                             ;; class already exists, this should never happen
                             (remove (fn [[k _]]
                                       (when (d/entity db k)
                                         (assert (str "DB migration: class already exists " k)))))
                             (into {})
                             (#(sqlite-create-graph/build-initial-classes* % {}))
                             (map (fn [b] (assoc b :logseq.property/built-in? true))))
            fixes (mapcat
                   (fn [update']
                     (when-let [fix (:fix update')]
                       (when (fn? fix)
                         (fix conn search-db)))) updates)
            tx-data' (if db-based? (concat new-properties new-classes fixes) fixes)]
        (when (seq tx-data')
          (let [tx-data' (concat tx-data' [(sqlite-create-graph/kv :logseq.kv/schema-version db-schema/version)])]
            (ldb/transact! conn tx-data' {:db-migrate? true}))
          (println "DB schema migrated to " db-schema/version " from " version-in-db "."))))))
