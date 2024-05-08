(ns logseq.db.sqlite.create-graph
  "Helper fns for creating a DB graph"
  (:require [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.property.build :as db-property-build]
            [logseq.common.util :as common-util]
            [datascript.core :as d]))

(defn- build-initial-properties
  []
  (mapcat
   (fn [[db-ident {:keys [schema original-name closed-values] :as m}]]
     (let [prop-name (or original-name (name (:name m)))
           blocks (if closed-values
                    (db-property-build/build-closed-values
                     db-ident
                     prop-name
                     {:db/ident db-ident :block/schema schema :closed-values closed-values}
                     {})
                    [(sqlite-util/build-new-property
                      db-ident
                      schema
                      {:original-name prop-name})])]
       (update blocks 0 sqlite-util/mark-block-as-built-in)))
   db-property/built-in-properties))


(defn kv
  "Creates a key-value pair tx with the key under the :db/ident namespace :logseq.kv.
   For example, the :db/type key is stored under an entity with ident :logseq.kv/db-type"
  [key value]
  {:db/ident (keyword "logseq.kv" (str (namespace key) "-" (name key)))
   key value})

(def built-in-pages-names
  #{"Contents"})

(defn- validate-tx-for-duplicate-idents [tx]
  (when-let [conflicting-idents
             (->> (keep :db/ident tx)
                  frequencies
                  (keep (fn [[k v]] (when (> v 1) k)))
                  (remove #{:logseq.class/base})
                  seq)]
    (throw (ex-info (str "The following :db/idents are not unique and clobbered each other: "
                         (vec conflicting-idents))
                    {:idents conflicting-idents}))))

(defn build-db-initial-data
  "Builds tx of initial data for a new graph including key values, initial files,
   built-in properties and built-in classes"
  [config-content]
  (let [initial-data [(kv :db/type "db")
                      (kv :schema/version db-schema/version)
                      ;; Empty property value used by db.type/ref properties
                      {:db/ident :logseq.property/empty-placeholder}
                      {:db/ident :logseq.class/base}]
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
        default-pages (->> (map sqlite-util/build-new-page built-in-pages-names)
                           (map sqlite-util/mark-block-as-built-in))
        default-properties (build-initial-properties)
        db-ident->properties (zipmap
                              (map :db/ident default-properties)
                              default-properties)
        default-classes (map
                         (fn [[db-ident {:keys [schema original-name]}]]
                           (let [original-name' (or original-name (name db-ident))]
                             (sqlite-util/mark-block-as-built-in
                              (sqlite-util/build-new-class
                               (let [properties (mapv
                                                 (fn [db-ident]
                                                   (let [property (get db-ident->properties db-ident)]
                                                     (assert property (str "Built-in property " db-ident " is not defined yet"))
                                                     db-ident))
                                                 (:properties schema))]
                                 (cond->
                                  {:block/original-name original-name'
                                   :block/name (common-util/page-name-sanity-lc original-name')
                                   :db/ident db-ident
                                   :block/uuid (d/squuid)}
                                   (seq properties)
                                   (assoc :class/schema.properties properties)))))))
                         db-class/built-in-classes)
        tx (vec (concat initial-data default-properties default-classes
                        initial-files default-pages))]
    (validate-tx-for-duplicate-idents tx)
    tx))
