(ns logseq.db.sqlite.create-graph
  "Helper fns for creating a DB graph"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.common.uuid :as common-uuid]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.build :as db-property-build]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.util :as sqlite-util]))

(defn- mark-block-as-built-in [block]
  (assoc block :logseq.property/built-in? true))

(defn build-initial-properties*
  [built-in-properties]
  (mapcat
   (fn [[db-ident {:keys [schema title closed-values] :as m}]]
     (let [prop-name (or title (name (:name m)))
           blocks (if closed-values
                    (db-property-build/build-closed-values
                     db-ident
                     prop-name
                     {:db/ident db-ident :block/schema schema :closed-values closed-values}
                     {})
                    [(sqlite-util/build-new-property
                      db-ident
                      schema
                      {:title prop-name})])]
       blocks))
   (dissoc built-in-properties :logseq.property/built-in?)))

(defn- build-initial-properties
  "Builds initial properties and their closed values and marks them
  as built-in?. Returns their tx data as well as data needed for subsequent build steps"
  []
  (let [built-in-property-schema (get-in db-property/built-in-properties [:logseq.property/built-in? :schema])
        built-in-property (sqlite-util/build-new-property
                           :logseq.property/built-in?
                           built-in-property-schema
                           {:title (name :logseq.property/built-in?)})
        mark-block-as-built-in' (fn [block]
                                  (mark-block-as-built-in {:block/uuid (:block/uuid block)}))
        properties (build-initial-properties* db-property/built-in-properties)
        ;; Tx order matters. built-in-property must come first as all properties depend on it.
        tx (concat [built-in-property]
                   properties
                   ;; Adding built-ins must come after initial properties
                   [(mark-block-as-built-in' built-in-property)]
                   (map mark-block-as-built-in' properties)
                   (keep #(when (= "closed value" (:block/type %)) (mark-block-as-built-in' %))
                         properties))]
    (doseq [m tx]
      (when-let [block-uuid (and (:db/ident m) (:block/uuid m))]
        (assert (string/starts-with? (str block-uuid) "00000002") m)))

    {:tx tx
     :properties (filter #(= (:block/type %) "property") properties)}))

(defn kv
  "Creates a key-value pair tx with the key and value respectively stored under
  :db/ident and :kv/value.  The key must be under the namespace :logseq.kv"
  [key value]
  {:pre [(= "logseq.kv" (namespace key))]}
  {:db/ident key
   :kv/value value})

(def built-in-pages-names
  #{"Contents"})

(defn- validate-tx-for-duplicate-idents [tx]
  (when-let [conflicting-idents
             (->> (keep :db/ident tx)
                  frequencies
                  (keep (fn [[k v]] (when (> v 1) k)))
                  (remove #{:logseq.class/Root})
                  seq)]
    (throw (ex-info (str "The following :db/idents are not unique and clobbered each other: "
                         (vec conflicting-idents))
                    {:idents conflicting-idents}))))

(defn- build-initial-classes [db-ident->properties]
  (map
   (fn [[db-ident {:keys [schema title]}]]
     (let [title' (or title (name db-ident))]
       (mark-block-as-built-in
        (sqlite-util/build-new-class
         (let [properties (mapv
                           (fn [db-ident]
                             (let [property (get db-ident->properties db-ident)]
                               (assert property (str "Built-in property " db-ident " is not defined yet"))
                               db-ident))
                           (:properties schema))]
           (cond->
            {:block/title title'
             :block/name (common-util/page-name-sanity-lc title')
             :db/ident db-ident
             :block/uuid (common-uuid/gen-uuid :db-ident-block-uuid db-ident)}
             (seq properties)
             (assoc :class/schema.properties properties)))))))
   db-class/built-in-classes))

(defn build-db-initial-data
  "Builds tx of initial data for a new graph including key values, initial files,
   built-in properties and built-in classes"
  [config-content]
  (let [initial-data [(kv :logseq.kv/db-type "db")
                      (kv :logseq.kv/schema-version db-schema/version)
                      ;; Empty property value used by db.type/ref properties
                      {:db/ident :logseq.property/empty-placeholder}
                      {:db/ident :logseq.class/Root}]
        initial-files [{:block/uuid (d/squuid)
                        :file/path (str "logseq/" "config.edn")
                        :file/content config-content
                        :file/created-at (js/Date.)
                        :file/last-modified-at (js/Date.)}
                       {:block/uuid (d/squuid)
                        :file/path (str "logseq/" "custom.css")
                        :file/content ""
                        :file/created-at (js/Date.)
                        :file/last-modified-at (js/Date.)}
                       {:block/uuid (d/squuid)
                        :file/path (str "logseq/" "custom.js")
                        :file/content ""
                        :file/created-at (js/Date.)
                        :file/last-modified-at (js/Date.)}]
        {properties-tx :tx :keys [properties]} (build-initial-properties)
        db-ident->properties (zipmap (map :db/ident properties) properties)
        default-classes (build-initial-classes db-ident->properties)
        default-pages (->> (map sqlite-util/build-new-page built-in-pages-names)
                           (map mark-block-as-built-in))
        tx (vec (concat initial-data properties-tx default-classes
                        initial-files default-pages))]
    (validate-tx-for-duplicate-idents tx)
    tx))
