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
  [db]
  (let [;; Some uuids need to be pre-defined since they are referenced by other properties
        default-property-uuids {:logseq.property/icon (d/squuid)}]
    (mapcat
     (fn [[db-ident {:keys [schema original-name closed-values] :as m}]]
       (let [id (if (contains? db-property/first-stage-properties db-ident)
                  (let [id (:block/uuid (d/entity db db-ident))]
                    (assert (uuid? id) "First stage properties are not created yet")
                    id)
                  (d/squuid))
             prop-name (or original-name (name (:name m)))
             blocks (if closed-values
                      (db-property-util/build-closed-values
                       db
                       prop-name
                       {:block/schema schema :block/uuid id :closed-values closed-values}
                       {:icon-id (get default-property-uuids :logseq.property/icon)
                        :db-ident db-ident})
                      [(sqlite-util/build-new-property
                        prop-name
                        schema
                        (get default-property-uuids db-ident id)
                        {:db-ident db-ident})])]
         (update blocks 0 #(default-db/mark-block-as-built-in db %))))
     db-property/built-in-properties)))

(defn kv
  "Creates a key-value pair tx with the key under the :db/ident namespace :logseq.kv.
   For example, the :db/type key is stored under an entity with ident :logseq.kv.db/type"
  [key value]
  {:db/ident (keyword "logseq.kv" (str (namespace key) "-" (name key)))
   key value})

(defn build-db-initial-data
  [db* config-content]
  (let [db (d/db-with db*
                      (map (fn [ident]
                             {:db/ident ident
                              :block/name (name ident)
                              :block/uuid (random-uuid)}) db-property/first-stage-properties))
        initial-data [(kv :db/type "db")
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
        default-pages (->> (ldb/build-pages-tx (map default-db/page-title->block ["Contents"]))
                           (map #(default-db/mark-block-as-built-in db %)))
        default-properties (build-initial-properties db)
        db-ident->properties (zipmap
                              (map :db/ident default-properties)
                              default-properties)
        default-classes (map
                         (fn [[db-ident {:keys [schema original-name]}]]
                           (default-db/mark-block-as-built-in
                            db
                            (sqlite-util/build-new-class
                             (let [properties (mapv
                                               (fn [db-ident]
                                                 (let [id (:block/uuid (get db-ident->properties db-ident))]
                                                   (assert id (str "Built-in property " db-ident " is not defined yet"))
                                                   id))
                                               (:properties schema))]
                               (cond->
                                {:block/original-name (or original-name (name db-ident))
                                 :block/name (common-util/page-name-sanity-lc (name db-ident))
                                 :db/ident db-ident
                                 :block/uuid (d/squuid)}
                                 (seq properties)
                                 (assoc-in [:block/schema :properties] properties))))))
                         db-class/built-in-classes)]
    (vec (concat initial-data initial-files default-pages default-classes default-properties))))
