(ns frontend.worker.db.migrate
  "Handles SQLite and datascript migrations for DB graphs"
  (:require [clojure.walk :as walk]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [frontend.worker.util :as worker-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.util :as sqlite-util]))

;; TODO: fixes/rollback
;; Frontend migrations
;; ===================

(comment
  (defn- rename-properties-aux
    [db props-to-rename]
    (let [property-tx (map
                       (fn [[old new]]
                         (let [e-new (d/entity db new)
                               e-old (d/entity db old)]
                           (if e-new
                             (when e-old
                               [:db/retractEntity (:db/id e-old)])
                             (merge {:db/id (:db/id (d/entity db old))
                                     :db/ident new}
                                    (when-let [new-title (get-in db-property/built-in-properties [new :title])]
                                      {:block/title new-title
                                       :block/name (common-util/page-name-sanity-lc new-title)})))))
                       props-to-rename)
          titles-tx (->> (d/datoms db :avet :block/title)
                         (keep (fn [d]
                                 (let [title (:v d)]
                                   (if (string? title)
                                     (when-let [props (seq (filter (fn [[old _new]] (string/includes? (:v d) (str old))) props-to-rename))]
                                       (let [title' (reduce (fn [title [old new]]
                                                              (string/replace title (str old) (str new))) title props)]
                                         [:db/add (:e d) :block/title title']))
                                     [:db/retract (:e d) :block/title])))))
          sorting-tx (->> (d/datoms db :avet :logseq.property.table/sorting)
                          (keep (fn [d]
                                  (when (coll? (:v d))
                                    (when-let [props (seq (filter (fn [[old _new]]
                                                                    (some (fn [item] (= old (:id item))) (:v d))) props-to-rename))]
                                      (let [value (reduce
                                                   (fn [sorting [old new]]
                                                     (mapv
                                                      (fn [item]
                                                        (if (= old (:id item))
                                                          (assoc item :id new)
                                                          item))
                                                      sorting))
                                                   (:v d)
                                                   props)]
                                        [:db/add (:e d) :logseq.property.table/sorting value]))))))
          sized-columns-tx (->> (d/datoms db :avet :logseq.property.table/sized-columns)
                                (keep (fn [d]
                                        (when (map? (:v d))
                                          (when-let [props (seq (filter (fn [[old _new]] (get (:v d) old)) props-to-rename))]
                                            (let [value (reduce
                                                         (fn [sizes [old new]]
                                                           (if-let [size (get sizes old)]
                                                             (-> sizes
                                                                 (dissoc old)
                                                                 (assoc new size))
                                                             sizes))
                                                         (:v d)
                                                         props)]
                                              [:db/add (:e d) :logseq.property.table/sized-columns value]))))))
          hidden-columns-tx (mapcat
                             (fn [[old new]]
                               (->> (d/datoms db :avet :logseq.property.table/hidden-columns old)
                                    (mapcat (fn [d]
                                              [[:db/retract (:e d) :logseq.property.table/hidden-columns old]
                                               [:db/add (:e d) :logseq.property.table/hidden-columns new]]))))
                             props-to-rename)
          ordered-columns-tx (->> (d/datoms db :avet :logseq.property.table/ordered-columns)
                                  (keep (fn [d]
                                          (when (coll? (:v d))
                                            (when-let [props (seq (filter (fn [[old _new]] ((set (:v d)) old)) props-to-rename))]
                                              (let [value (reduce
                                                           (fn [col [old new]]
                                                             (mapv (fn [v] (if (= old v) new v)) col))
                                                           (:v d)
                                                           props)]
                                                [:db/add (:e d) :logseq.property.table/ordered-columns value]))))))
          filters-tx (->> (d/datoms db :avet :logseq.property.table/filters)
                          (keep (fn [d]
                                  (let [filters (:filters (:v d))]
                                    (when (coll? filters)
                                      (when-let [props (seq (filter (fn [[old _new]]
                                                                      (some (fn [item] (and (vector? item)
                                                                                            (= old (first item)))) filters)) props-to-rename))]
                                        (let [value (update (:v d) :filters
                                                            (fn [col]
                                                              (reduce
                                                               (fn [col [old new]]
                                                                 (mapv (fn [item]
                                                                         (if (and (vector? item) (= old (first item)))
                                                                           (vec (cons new (rest item)))
                                                                           item))
                                                                       col))
                                                               col
                                                               props)))]
                                          [:db/add (:e d) :logseq.property.table/filters value])))))))]
      (concat property-tx
              titles-tx
              sorting-tx
              sized-columns-tx
              hidden-columns-tx
              ordered-columns-tx
              filters-tx)))

  (defn- rename-properties
    [props-to-rename]
    (fn [conn _search-db]
      (when (ldb/db-based-graph? @conn)
        (let [props-tx (rename-properties-aux @conn props-to-rename)]
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
              classes-to-rename)))))

(def schema-version->updates
  "A vec of tuples defining datascript migrations. Each tuple consists of the
   schema version integer and a migration map. A migration map can have keys of :properties, :classes
   and :fix."
  [])

(let [[major minor] (last (sort (map (comp (juxt :major :minor) db-schema/parse-schema-version first)
                                     schema-version->updates)))]
  (when major
    (let [max-schema-version {:major major :minor minor}
          compare-result (db-schema/compare-schema-version db-schema/version max-schema-version)]
      (assert (>= 0 compare-result) [db-schema/version max-schema-version])
      (when (neg? compare-result)
        (js/console.warn (str "Current db schema-version is " db-schema/version ", max available schema-version is " max-schema-version))))))

(defn ensure-built-in-data-exists!
  [conn]
  (let [*uuids (atom {})
        data (->> (sqlite-create-graph/build-db-initial-data "")
                  (keep (fn [data]
                          (if (map? data)
                            (cond
                              ;; Already created db-idents like :logseq.kv/graph-initial-schema-version should not be overwritten
                              (= "logseq.kv" (some-> (:db/ident data) namespace))
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

(defn migrate
  "Migrate 'frontend' datascript schema and data. To add a new migration,
  add an entry to schema-version->updates and bump db-schema/version"
  [conn search-db]
  (prn :debug :migrate)
  (when (ldb/db-based-graph? @conn)
    (let [db @conn
          version-in-db (db-schema/parse-schema-version (or (:kv/value (d/entity db :logseq.kv/schema-version)) 0))
          compare-result (db-schema/compare-schema-version db-schema/version version-in-db)]
      (cond
        (zero? compare-result)
        nil

        (neg? compare-result) ; outdated client, db version could be synced from server
        (worker-util/post-message :notification ["Your app is using an outdated version that is incompatible with your current graph. Please update your app before editing this graph." :error false])

        (pos? compare-result)
        (try
          (let [db-based? (ldb/db-based-graph? @conn)
                updates (keep (fn [[v updates]]
                                (let [v* (db-schema/parse-schema-version v)]
                                  (when (and (neg? (db-schema/compare-schema-version version-in-db v*))
                                             (not (pos? (db-schema/compare-schema-version v* db-schema/version))))
                                    [v updates])))
                              schema-version->updates)]
            (println "DB schema migrated from" version-in-db)
            (doseq [[v m] updates]
              (upgrade-version! conn search-db db-based? v m))
            (ensure-built-in-data-exists! conn))
          (catch :default e
            (prn :error (str "DB migration failed to migrate to " db-schema/version " from " version-in-db ":"))
            (js/console.error e)
            (throw e)))))))
