(ns frontend.worker.db.migrate
  "Handles SQLite and datascript migrations for DB graphs"
  (:require [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [frontend.worker.util :as worker-util]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.util :as sqlite-util]))

;; TODO: fixes/rollback
;; Frontend migrations
;; ===================

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

(defn rename-properties
  [props-to-rename & {:keys [replace-fn]}]
  (fn [db]
    (when (ldb/db-based-graph? db)
      (let [props-tx (rename-properties-aux db props-to-rename)
            fix-tx (mapcat (fn [[old new]]
                             ;; can't use datoms b/c user properties aren't indexed
                             (->> (d/q '[:find ?b ?prop-v :in $ ?prop :where [?b ?prop ?prop-v]] db old)
                                  (mapcat (fn [[id prop-value]]
                                            (if (fn? replace-fn)
                                              (replace-fn id prop-value)
                                              [[:db/retract id old]
                                               [:db/add id new prop-value]])))))
                           props-to-rename)]
        (concat props-tx fix-tx)))))

(comment
  (defn- rename-classes
    [classes-to-rename]
    (fn [db]
      (when (ldb/db-based-graph? db)
        (mapv (fn [[old new]]
                (merge {:db/id (:db/id (d/entity db old))
                        :db/ident new}
                       (when-let [new-title (get-in db-class/built-in-classes [new :title])]
                         {:block/title new-title
                          :block/name (common-util/page-name-sanity-lc new-title)})))
              classes-to-rename)))))

(defn fix-rename-parent-to-extends
  [db]
  (let [parent-entity (d/entity db :logseq.property/parent)]
    (when parent-entity
      (let [old-p :logseq.property/parent
            new-p :logseq.property.class/extends
            f (rename-properties
               {old-p new-p}
               {:replace-fn (fn [id prop-value]
                              (let [page (d/entity db id)
                                    new-p' (if (ldb/class? page) new-p :block/parent)]
                                [[:db/retract id old-p]
                                 [:db/add id new-p' prop-value]]))})
            rename-property-tx (f db)
            library-page (if-let [page (ldb/get-built-in-page db common-config/library-page-name)]
                           page
                           (-> (sqlite-util/build-new-page common-config/library-page-name)
                               sqlite-create-graph/mark-block-as-built-in))
            library-id (:block/uuid library-page)
            library-page-tx (when-not (de/entity? library-page)
                              [library-page])
            pages-with-parent (->> (d/datoms db :avet :logseq.property/parent)
                                   (keep (fn [d]
                                           (let [e (d/entity db (:e d))]
                                             (when-not (ldb/class? e)
                                               e)))))
            parents (->> pages-with-parent
                         (map :logseq.property/parent)
                         (common-util/distinct-by :db/id))
            top-parents (remove :logseq.property/parent parents)
            top-parent-ids (set (map :db/id top-parents))
            move-top-parents-to-library (map (fn [parent]
                                               {:db/id (:db/id parent)
                                                :block/parent [:block/uuid library-id]
                                                :block/order (db-order/gen-key)}) top-parents)
            update-children-parent-and-order (->> pages-with-parent
                                                  (remove (fn [page] (top-parent-ids (:db/id page))))
                                                  (map (fn [page]
                                                         {:db/id (:db/id page)
                                                          :block/order (db-order/gen-key)})))]
        (concat
         rename-property-tx
         library-page-tx
         move-top-parents-to-library
         update-children-parent-and-order)))))

(defn- retract-property-attributes
  [id]
  [[:db/retract id :block/tags :logseq.class/Property]
   [:db/retract id :logseq.property/type]
   [:db/retract id :db/cardinality]
   [:db/retract id :db/valueType]
   [:db/retract id :db/index]
   [:db/retract id :logseq.property/classes]
   [:db/retract id :logseq.property/hide?]
   [:db/retract id :logseq.property/public?]
   [:db/retract id :logseq.property/view-context]
   [:db/retract id :logseq.property/ui-position]
   [:db/retract id :logseq.property/default-value]
   [:db/retract id :logseq.property/hide-empty-value]
   [:db/retract id :logseq.property/enable-history?]])

(defn separate-classes-and-properties
  [db]
  ;; find all properties that're classes, create new properties to separate them
  ;; from classes.
  (let [class-ids (d/q
                   '[:find [?b ...]
                     :where
                     [?b :block/tags :logseq.class/Property]
                     [?b :block/tags :logseq.class/Tag]]
                   db)]
    (mapcat
     (fn [id]
       (let [class (d/entity db id)
             ident (:db/ident class)
             new-property (sqlite-util/build-new-property
                           (:block/title class)
                           (select-keys class [:logseq.property/type :db/cardinality])
                           {:title (:block/title class)
                            :ref-type? true
                            :properties (merge
                                         (select-keys class [:logseq.property/hide? :logseq.property/public?
                                                             :logseq.property/view-context :logseq.property/ui-position
                                                             :logseq.property/default-value :logseq.property/hide-empty-value :logseq.property/enable-history?])
                                         {:logseq.property/classes id})})
             retract-property-attrs (retract-property-attributes id)
             datoms (if (:db/index class)
                      (d/datoms db :avet ident)
                      (filter (fn [d] (= ident (:a d))) (d/datoms db :eavt)))
             tag-properties (->> (d/datoms db :avet :logseq.property.class/properties id)
                                 (mapcat (fn [d]
                                           [[:db/retract (:e d) (:a d) (:v d)]
                                            [:db/add (:e d) (:a d) [:block/uuid (:block/uuid new-property)]]])))
             other-properties-tx (mapcat
                                  (fn [ident]
                                    (->> (d/datoms db :avet ident id)
                                         (mapcat (fn [d]
                                                   [[:db/retract (:e d) (:a d) (:v d)]
                                                    [:db/add (:e d) (:a d) [:block/uuid (:block/uuid new-property)]]]))))
                                  [:logseq.property.view/group-by-property :logseq.property.table/pinned-columns])]
         (concat [new-property]
                 tag-properties
                 other-properties-tx
                 retract-property-attrs
                 (mapcat
                  (fn [d]
                    [[:db/retract (:e d) ident (:v d)]
                     [:db/add (:e d) (:db/ident new-property) (:v d)]])
                  datoms))))
     class-ids)))

(defn fix-tag-properties
  [db]
  ;; find all classes that're still used as properties
  (let [class-ids (d/q
                   '[:find [?b ...]
                     :where
                     [?b :block/tags :logseq.class/Tag]
                     [?b1 :logseq.property.class/properties ?b]]
                   db)]
    (mapcat
     (fn [id]
       (let [class (d/entity db id)
             property-id (first (ldb/page-exists? db (:block/title class) :logseq.class/Property))
             tag-properties (when property-id
                              (->> (d/datoms db :avet :logseq.property.class/properties id)
                                   (mapcat (fn [d]
                                             [[:db/retract (:e d) (:a d) (:v d)]
                                              [:db/add (:e d) (:a d) property-id]]))))]
         tag-properties))
     class-ids)))

(defn add-missing-db-ident-for-tags
  [db _sqlite-db]
  (let [class-ids (d/q
                   '[:find [?b ...]
                     :where
                     [?b :block/tags :logseq.class/Tag]
                     [(missing? $ ?b :db/ident)]]
                   db)]
    (mapcat
     (fn [id]
       (let [title (:block/title (d/entity db id))]
         [[:db/add id :db/ident (db-class/create-user-class-ident-from-name db title)]
          [:db/add id :logseq.property.class/extends :logseq.class/Root]
          [:db/retract id :block/tags :logseq.class/Page]
          [:db/retract id :block/refs :logseq.class/Page]
          [:db/retract id :block/path-refs :logseq.class/Page]]))
     class-ids)))

(defn fix-using-properties-as-tags
  [db]
  ;; find all properties that're tags
  (let [property-ids (->>
                      (d/q
                       '[:find ?b ?i
                         :where
                         [?b :block/tags :logseq.class/Tag]
                         [?b :db/ident ?i]]
                       db)
                      (filter (fn [[_ ident]] (= "user.property" (namespace ident))))
                      (map first))]
    (mapcat
     (fn [id]
       (let [property (d/entity db id)
             title (:block/title property)]
         (into (retract-property-attributes id)
               [[:db/retract id :logseq.property/parent]
                [:db/add id :db/ident (db-class/create-user-class-ident-from-name db title)]])))
     property-ids)))

(defn remove-block-order-for-tags
  [db]
  ;; find all properties that're tags
  (let [tag-ids (d/q
                 '[:find [?b ...]
                   :where
                   [?b :block/tags :logseq.class/Tag]
                   [?b :block/order]]
                 db)]
    (map
     (fn [id]
       [:db/retract id :block/order])
     tag-ids)))

(defn- update-extends-to-cardinality-many
  [db]
  (let [extends (d/entity db :logseq.property.class/extends)]
    [[:db/add (:db/id extends) :db/cardinality :db.cardinality/many]]))

(defn- add-quick-add-page
  [_db]
  (let [page (-> (-> (sqlite-util/build-new-page common-config/quick-add-page-name)
                     sqlite-create-graph/mark-block-as-built-in))]
    [page]))

(def schema-version->updates
  "A vec of tuples defining datascript migrations. Each tuple consists of the
   schema version integer and a migration map. A migration map can have keys of :properties, :classes
   and :fix."
  [["65.0" {:fix separate-classes-and-properties}]
   ["65.1" {:fix fix-rename-parent-to-extends}]
   ["65.2" {:fix fix-tag-properties}]
   ["65.3" {:fix add-missing-db-ident-for-tags}]
   ["65.4" {:fix fix-using-properties-as-tags}]
   ["65.5" {:fix remove-block-order-for-tags}]
   ["65.6" {:fix update-extends-to-cardinality-many}]
   ["65.7" {:fix add-quick-add-page}]])

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
  [conn db-based? version {:keys [properties classes fix]}]
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
                (fix db))
        tx-data (if db-based? (concat new-class-idents new-properties new-classes fixes) fixes)
        tx-data' (concat
                  [(sqlite-util/kv :logseq.kv/schema-version version)]
                  tx-data)]
    (ldb/transact! conn tx-data' {:db-migrate? true})
    (println "DB schema migrated to" version)))

(defn migrate
  "Migrate 'frontend' datascript schema and data. To add a new migration,
  add an entry to schema-version->updates and bump db-schema/version"
  [conn]
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
              (upgrade-version! conn db-based? v m))
            (ensure-built-in-data-exists! conn))
          (catch :default e
            (prn :error (str "DB migration failed to migrate to " db-schema/version " from " version-in-db ":"))
            (js/console.error e)
            (throw e)))))))
