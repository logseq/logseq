(ns frontend.worker.db.migrate
  "Handles SQLite and datascript migrations for DB graphs"
  (:require [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.db.rename-db-ident :as rename-db-ident]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.util :as sqlite-util]))

;; Frontend migrations
;; ===================

(defn- rename-properties-fix
  [db props-to-rename]
  (let [;; update property title/name
        ;; don't update :db/ident since it's addressed by `:rename-db-idents`
        property-tx (map
                     (fn [[old new]]
                       (merge {:db/id (:db/id (d/entity db old))}
                              (when-let [new-title (get-in db-property/built-in-properties [new :title])]
                                {:block/title new-title
                                 :block/name (common-util/page-name-sanity-lc new-title)})))
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
  [props-to-rename {:keys [fix]}]
  {:rename-db-idents (fn [_db]
                       (mapv
                        (fn [[old-ident new-ident]]
                          {:db-ident-or-block-uuid old-ident
                           :new-db-ident new-ident})
                        props-to-rename))
   :fix (fn [db]
          (let [common-fix (rename-properties-fix db
                                                  {:logseq.property.asset/external-src
                                                   :logseq.property.asset/external-url})
                additional-fix (when (fn? fix)
                                 (fix db))]
            (concat common-fix additional-fix)))})

(defn- add-quick-add-page
  [_db]
  (let [page (-> (-> (sqlite-util/build-new-page common-config/quick-add-page-name)
                     sqlite-create-graph/mark-block-as-built-in))]
    [page]))

(defn- add-missing-page-name
  [db]
  (let [pages (d/datoms db :avet :block/name "")]
    (keep
     (fn [d]
       (let [page (d/entity db (:e d))]
         (when-not (string/blank? (:block/title page))
           {:db/id (:db/id page)
            :block/name (common-util/page-name-sanity-lc (:block/title page))})))
     pages)))

(defn remove-block-path-refs
  [db]
  (when (d/entity db :block/path-refs)
    (let [remove-datoms (->> (d/datoms db :avet :block/path-refs)
                             (map :e)
                             (distinct)
                             (mapv (fn [id]
                                     [:db/retract id :block/path-refs])))]
      (conj remove-datoms [:db/retractEntity :block/path-refs]))))

(defn- remove-position-property-from-url-properties
  [db]
  (->> (d/datoms db :avet :logseq.property/type :url)
       (keep (fn [d]
               (let [e (d/entity db (:e d))]
                 (when (:logseq.property/ui-position e)
                   [:db/retract (:e d) :logseq.property/ui-position]))))))

(defn- deprecated-ensure-graph-uuid
  [_db])

(def schema-version->updates
  "A vec of tuples defining datascript migrations. Each tuple consists of the
   schema version integer and a migration map. A migration map can have keys of :properties, :classes
   :rename-db-idents and :fix."
  [["65.7" {:fix add-quick-add-page}]
   ["65.8" {:fix add-missing-page-name}]
   ["65.9" {:properties [:logseq.property.embedding/hnsw-label-updated-at]}]
   ["65.10" {:properties [:block/journal-day :logseq.property.view/sort-groups-by-property :logseq.property.view/sort-groups-desc?]}]
   ["65.11" {:fix remove-block-path-refs}]
   ["65.12" {:fix remove-position-property-from-url-properties}]
   ["65.13" {:properties [:logseq.property.asset/width
                          :logseq.property.asset/height]}]
   ["65.14" {:properties [:logseq.property.asset/external-src]}]
   ["65.15" (rename-properties {:logseq.property.asset/external-src
                                :logseq.property.asset/external-url}
                               {})]
   ["65.16" {:properties [:logseq.property.asset/external-file-name]}]
   ["65.17" {:properties [:logseq.property.publish/published-url]}]
   ["65.18" {:fix deprecated-ensure-graph-uuid}]
   ["65.19" {:properties [:logseq.property/choice-classes :logseq.property/choice-exclusions]}]
   ["65.20" {:properties [:logseq.property.class/bidirectional-property-title :logseq.property.class/enable-bidirectional?]}]
   ["65.21" {:properties [:logseq.property.asset/external-props]}]])

(let [[major minor] (last (sort (map (comp (juxt :major :minor) db-schema/parse-schema-version first)
                                     schema-version->updates)))]
  (when major
    (let [max-schema-version {:major major :minor minor}
          compare-result (db-schema/compare-schema-version db-schema/version max-schema-version)]
      (assert (>= 0 compare-result) [db-schema/version max-schema-version])
      (when (neg? compare-result)
        (js/console.warn (str "Current db schema-version is " db-schema/version ", max available schema-version is " max-schema-version))))))

(defn ensure-built-in-data-exists!
  "Return tx-data"
  [conn]
  (let [*uuids (atom {})
        initial-data (sqlite-create-graph/build-db-initial-data "")
        data (->> initial-data
                  (keep (fn [data]
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

                            (= [:block/uuid :logseq.property/built-in?] (keys data))
                            data

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
                                                 (= k :logseq.property/built-in?)
                                                 true
                                                 (= k :logseq.property/type)
                                                 v
                                                 (coll? v)
                                                 v

                                                 :else
                                                 (let [existing-value (if (and (coll? existing-value) (not (map? existing-value)))
                                                                        (remove nil? existing-value)
                                                                        existing-value)]
                                                   (cond
                                                     (contains? #{:block/title :block/name} k)
                                                     v
                                                     (some? existing-value)
                                                     existing-value
                                                     :else
                                                     v))))))
                                   data
                                   existing-data)))
                              data)

                            :else
                            data)))
                  common-util/fast-remove-nils)
        ;; using existing page's uuid
        data' (->>
               (walk/prewalk
                (fn [f]
                  (cond
                    (and (de/entity? f) (:block/uuid f))
                    (or (:db/ident f) [:block/uuid (:block/uuid f)])
                    (and (vector? f) (= :block/uuid (first f)) (@*uuids (second f)))
                    [:block/uuid (@*uuids (second f))]
                    :else
                    f))
                data)
               (map (fn [m] (dissoc m :db/id))))

        r (d/transact! conn data' {:fix-db? true
                                   :db-migrate? true})]
    (assoc r :migrate-updates
           ;; fake it as a normal :fix type migration
           {:fix (constantly :ensure-built-in-data-exists!)})))

(defn- upgrade-version!
  "Return tx-data"
  [conn version {:keys [properties classes rename-db-idents fix] :as migrate-updates}]
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
        [rename-db-idents-tx-data rename-db-idents-coll]
        (when rename-db-idents
          (rename-db-ident/rename-db-idents-migration-tx-data db rename-db-idents))
        fixes (when (fn? fix)
                (fix db))
        tx-data (concat new-class-idents new-properties new-classes rename-db-idents-tx-data fixes)
        tx-data' (concat
                  [(sqlite-util/kv :logseq.kv/schema-version version)]
                  tx-data)
        r (ldb/transact! conn tx-data' {:db-migrate? true
                                        :skip-validate-db? true})
        migrate-updates (cond-> migrate-updates
                          rename-db-idents (assoc :rename-db-idents rename-db-idents-coll))]
    (println "DB schema migrated to" version)
    (assoc r :migrate-updates migrate-updates)))

(defn migrate
  "Migrate 'frontend' datascript schema and data. To add a new migration,
  add an entry to schema-version->updates and bump db-schema/version"
  [conn & {:keys [target-version] :or {target-version db-schema/version}}]
  (let [db @conn
        version-in-db (db-schema/parse-schema-version (or (:kv/value (d/entity db :logseq.kv/schema-version)) 0))
        compare-result (db-schema/compare-schema-version target-version version-in-db)]
    (cond
      (zero? compare-result)
      nil

      (neg? compare-result) ; outdated client, db version could be synced from server
      (worker-util/post-message :notification ["Your app is using an outdated version that is incompatible with your current graph. Please update your app before editing this graph." :error false])

      (pos? compare-result)
      (try
        (let [updates (keep (fn [[v updates]]
                              (let [v* (db-schema/parse-schema-version v)]
                                (when (and (neg? (db-schema/compare-schema-version version-in-db v*))
                                           (not (pos? (db-schema/compare-schema-version v* target-version))))
                                  [v updates])))
                            schema-version->updates)
              result-ks [:tx-data :db-before :db-after :migrate-updates]
              *upgrade-result-coll (atom [])]
          (println "DB schema migrated from" version-in-db)
          (doseq [[v m] updates]
            (let [r (upgrade-version! conn v m)]
              (swap! *upgrade-result-coll conj (select-keys r result-ks))))
          (swap! *upgrade-result-coll conj
                 (select-keys (ensure-built-in-data-exists! conn) result-ks))
          {:from-version version-in-db
           :to-version target-version
           :upgrade-result-coll @*upgrade-result-coll})
        (catch :default e
          (prn :error (str "DB migration failed to migrate to " target-version " from " version-in-db ":"))
          (js/console.error e)
          (throw e))))))
