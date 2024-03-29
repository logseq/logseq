(ns logseq.db.sqlite.create-graph
  "Helper fns for creating a DB graph"
  (:require [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.property.util :as db-property-util]
            [logseq.common.util :as common-util]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.frontend.default :as default-db]))

(defn- build-initial-properties
  []
  (let [built-in-properties (->>
                             (map (fn [[k v]]
                                    (assert (keyword? k))
                                    [k (assoc v
                                              :db-ident
                                              (get v :db-ident (db-property/name->db-ident k)))])
                                  db-property/built-in-properties)
                             (into {}))]
    (mapcat
     (fn [[k-keyword {:keys [schema original-name closed-values db-ident]}]]
       (let [k-name (name k-keyword)
             name (or original-name k-name)
             blocks (if closed-values
                      (db-property-util/build-closed-values
                       name
                       {:block/schema schema :closed-values closed-values}
                       {:db-ident db-ident})
                      [(sqlite-util/build-new-property
                        name
                        schema
                        {:db-ident db-ident})])]
         (update blocks 0 default-db/mark-block-as-built-in)))
     built-in-properties)))

(defn kv
  "Creates a key-value pair tx with the key under the :db/ident namespace :logseq.kv.
   For example, the :db/type key is stored under an entity with ident :logseq.kv.db/type"
  [key value]
  {:db/ident (keyword (str "logseq.kv." (namespace key)) (name key))
   key value})

(defn build-db-initial-data
  [config-content]
  (let [initial-data [(kv :db/type "db")
                      (kv :schema/version db-schema/version)]
        initial-files [{:block/uuid (d/squuid)
                        :file/path (str "logseq/" "config.edn")
                        :file/content config-content
                        :file/last-modified-at (js/Date.)}
                       {:block/uuid (d/squuid)
                        :file/path (str "logseq/" "custom.css")
                        :file/content ""
                        :file/last-modified-at (js/Date.)}
                       {:block/uuid (d/squuid)
                        :file/path (str "logseq/" "custom.js")
                        :file/content ""
                        :file/last-modified-at (js/Date.)}]
        default-properties (build-initial-properties)
        default-pages (->> (ldb/build-pages-tx (map default-db/page-title->block ["Contents"]))
                           (map default-db/mark-block-as-built-in))
        db-ident->properties (zipmap
                              (map :db/ident default-properties)
                              default-properties)
        default-classes (map
                         (fn [[k-keyword {:keys [schema original-name]}]]
                           (let [db-ident (name k-keyword)]
                             (default-db/mark-block-as-built-in
                              (sqlite-util/build-new-class
                               (let [properties (mapv
                                                 (fn [db-ident]
                                                   (let [property (get db-ident->properties db-ident)]
                                                     (assert property (str "Built-in property " db-ident " is not defined yet"))
                                                     db-ident))
                                                 (:properties schema))]
                                 (cond->
                                  {:block/original-name (or original-name db-ident)
                                   :block/name (common-util/page-name-sanity-lc db-ident)
                                   :db/ident (keyword "logseq.class" db-ident)
                                   :block/uuid (d/squuid)}
                                   (seq properties)
                                   (assoc :class/schema.properties properties)))))))
                         db-class/built-in-classes)
        db-idents (keep (fn [x] (when-let [ident (:db/ident x)]
                                  {:db/ident ident}))
                        (concat default-properties default-classes))]
    (vec (concat db-idents
                 default-properties default-classes
                 initial-data initial-files default-pages))))
