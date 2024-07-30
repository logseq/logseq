(ns frontend.worker.db.migrate
  "DB migration"
  (:require [datascript.core :as d]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.frontend.property :as db-property]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]
            [frontend.worker.search :as search]))

;; TODO: fixes/rollback

(defn- replace-original-name-content-with-title
  [conn search-db]
  (search/truncate-table! search-db)
  (d/transact! conn
    [{:db/ident :block/title
      :db/cardinaity :db.cardinality/one
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

(def schema-version->updates
  [[3 {:properties [:logseq.property/table-sorting :logseq.property/table-filters
                    :logseq.property/table-hidden-columns :logseq.property/table-ordered-columns]
       :classes    []}]
   [4 {:fix (fn [conn _search-db]
              (let [pages (d/datoms @conn :avet :block/name)
                    tx-data (map (fn [d]
                                   {:db/id (:e d)
                                    :block/type "page"}) pages)]
                tx-data))}]
   [5 {:properties [:logseq.property/view-for]
       :classes    []}]
   [6 {:properties [:logseq.property.asset/remote-metadata]}]
   [7 {:fix replace-original-name-content-with-title}]
   [8 {:fix replace-object-and-page-type-with-node}]])

(let [max-schema-version (apply max (map first schema-version->updates))]
  (assert (<= db-schema/version max-schema-version))
  (when (< db-schema/version max-schema-version)
    (js/console.warn (str "Current db schema-version is " db-schema/version ", max available schema-verison is " max-schema-version))))

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
            built-in-value (:db/id (get (d/entity db :logseq.class/Root) :logseq.property/built-in?))
            updates (keep (fn [[v updates]]
                            (when (and (< version-in-db v) (<= v db-schema/version))
                              updates))
                          schema-version->updates)
            properties (mapcat :properties updates)
            ;; TODO: add classes migration support
            ;; classes (mapcat :classes updates)
            new-properties (->> (select-keys db-property/built-in-properties properties)
                                ;; property already exists, this should never happen
                                (remove (fn [[k _]]
                                          (when (d/entity db k)
                                            (assert (str "DB migration: property already exists " k)))))
                                (into {})
                                sqlite-create-graph/build-initial-properties*
                                (map (fn [b] (assoc b :logseq.property/built-in? built-in-value))))
            fixes (mapcat
                   (fn [update]
                     (when-let [fix (:fix update)]
                       (when (fn? fix)
                         (fix conn search-db)))) updates)
            tx-data' (if db-based? (concat new-properties fixes) fixes)]
        (when (seq tx-data')
          (let [tx-data' (concat tx-data' [(sqlite-create-graph/kv :logseq.kv/schema-version db-schema/version)])]
            (ldb/transact! conn tx-data' {:db-migrate? true}))
          (println "DB schema migrated to " db-schema/version " from " version-in-db "."))))))
