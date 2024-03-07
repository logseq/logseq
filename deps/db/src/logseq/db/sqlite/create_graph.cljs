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

(defn- mark-block-as-built-in
  [db block]
  (let [built-in-property-id (:block/uuid (d/entity db :built-in?))]
    (update block :block/properties assoc built-in-property-id true)))

(defn- build-initial-properties
  [db]
  (let [;; Some uuids need to be pre-defined since they are referenced by other properties
        default-property-uuids {:icon (d/squuid)}
        built-in-properties (->>
                             (map (fn [[k v]]
                                    (assert (keyword? k))
                                    [k (assoc v :db-ident (get v :db-ident k))])
                                  db-property/built-in-properties)
                             (into {}))]
    (mapcat
     (fn [[k-keyword {:keys [schema original-name closed-values db-ident]}]]
       (let [k-name (name k-keyword)
             id (if (contains? db-property/first-stage-properties k-keyword)
                  (let [id (:block/uuid (d/entity db k-keyword))]
                    (assert (uuid? id) "First stage properties are not created yet")
                    id)
                  (d/squuid))
             blocks (if closed-values
                      (db-property-util/build-closed-values
                       db
                       (or original-name k-name)
                       {:block/schema schema :block/uuid id :closed-values closed-values}
                       {:icon-id (get default-property-uuids :icon)
                        :db-ident db-ident})
                      [(sqlite-util/build-new-property
                        (or original-name k-name)
                        schema
                        (get default-property-uuids k-keyword id)
                        {:db-ident db-ident})])]
         (update blocks 0 #(mark-block-as-built-in db %))))
     built-in-properties)))

(defn build-db-initial-data
  [db* config-content]
  (let [db (d/db-with db*
                      (map (fn [p]
                             {:db/ident p
                              :block/name (name p)
                              :block/uuid (random-uuid)}) db-property/first-stage-properties))
        initial-data [{:db/ident :db/type :db/type "db"}
                      {:db/ident :schema/version :schema/version db-schema/version}]
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
                           (map #(mark-block-as-built-in db %)))
        default-properties (build-initial-properties db)
        name->properties (zipmap
                          (map :block/name default-properties)
                          default-properties)
        default-classes (map
                         (fn [[k-keyword {:keys [schema original-name]}]]
                           (let [k-name (name k-keyword)]
                             (mark-block-as-built-in
                              db
                              (sqlite-util/build-new-class
                               (let [properties (mapv
                                                 (fn [property-name]
                                                   (let [id (:block/uuid (get name->properties property-name))]
                                                     (assert id (str "Built-in property " property-name " is not defined yet"))
                                                     id))
                                                 (:properties schema))]
                                 (cond->
                                  {:block/original-name (or original-name k-name)
                                   :block/name (common-util/page-name-sanity-lc k-name)
                                   :block/uuid (d/squuid)}
                                   (seq properties)
                                   (assoc-in [:block/schema :properties] properties)))))))
                         db-class/built-in-classes)]
    (vec (concat initial-data initial-files default-pages default-classes default-properties))))
