(ns logseq.db.sqlite.create-graph
  "Helper fns for creating a DB graph"
  (:require [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.property.util :as db-property-util]
            [logseq.common.util :as common-util]
            [datascript.core :as d]
            [logseq.db.frontend.default :as default-db]))

(defn- build-initial-properties
  []
  (let [built-in-properties (->>
                             (map (fn [[k v]]
                                    (assert (keyword? k))
                                    [k v])
                                  db-property/built-in-properties)
                             (into {}))]
    (mapcat
     (fn [[db-ident {:keys [schema original-name closed-values] :as m}]]
       (let [prop-name (or original-name (name (:name m)))
             blocks (if closed-values
                      (db-property-util/build-closed-values
                       db-ident
                       prop-name
                       {:db/ident db-ident :block/schema schema :closed-values closed-values}
                       {})
                      [(sqlite-util/build-new-property
                        db-ident
                        prop-name
                        schema)])]
         (update blocks 0 default-db/mark-block-as-built-in)))
     built-in-properties)))


(defn kv
  "Creates a key-value pair tx with the key under the :db/ident namespace :logseq.kv.
   For example, the :db/type key is stored under an entity with ident :logseq.kv.db/type"
  [key value]
  {:db/ident (keyword "logseq.kv" (str (namespace key) "-" (name key)))
   key value})

(def built-in-pages-names
  #{"Contents"})

(defn build-db-initial-data
  [config-content]
  (let [initial-data [(kv :db/type "db")
                      (kv :schema/version db-schema/version)
                      ;; Empty property value used by db.type/ref properties
                      {:db/ident :logseq.property/empty-placeholder}]
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
                           (map default-db/mark-block-as-built-in))
        default-properties (build-initial-properties)
        db-ident->properties (zipmap
                              (map :db/ident default-properties)
                              default-properties)
        default-classes (map
                         (fn [[db-ident {:keys [schema original-name]}]]
                           (let [original-name' (or original-name (name db-ident))]
                             (default-db/mark-block-as-built-in
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
                         db-class/built-in-classes)]
    (vec (concat default-properties default-classes
                 initial-data initial-files default-pages))))
