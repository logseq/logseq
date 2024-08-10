(ns logseq.db.sqlite.util
  "Utils fns for backend sqlite db"
  (:require [cljs-bean.transit]
            [clojure.string :as string]
            [cognitect.transit :as transit]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [datascript.transit :as dt]
            [logseq.common.util :as common-util]
            [logseq.common.uuid :as common-uuid]
            [logseq.common.config :as common-config]
            [logseq.db.frontend.order :as db-order]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.frontend.schema :as db-schema]))

(defonce db-version-prefix "logseq_db_")
(defonce file-version-prefix "logseq_local_")

(def transit-w (transit/writer :json))
(def transit-r (transit/reader :json))
(defn transit-write
  [data]
  (transit/write transit-w data))

(defn transit-read
  [str]
  (transit/read transit-r str))

(def write-transit-str
  (let [write-handlers (->> (assoc dt/write-handlers
                                   de/Entity (transit/write-handler (constantly "datascript/Entity")
                                                                    (fn [^de/entity entity]
                                                                      (assert (some? (:db/id entity)))
                                                                      (assoc (.-kv entity)
                                                                             :db/id (:db/id entity)))))
                            (merge (cljs-bean.transit/writer-handlers)))
        writer (transit/writer :json {:handlers write-handlers})]
    (fn write-transit-str* [o]
      (try (transit/write writer o)
           (catch :default e
             (prn ::write-transit-str o)
             (throw e))))))

(def read-transit-str
  (let [read-handlers (assoc dt/read-handlers
                             "datascript/Entity" identity)
        reader (transit/reader :json {:handlers read-handlers})]
    (fn read-transit-str* [s] (transit/read reader s))))

(defn db-based-graph?
  [graph-name]
  (when graph-name
    (string/starts-with? graph-name db-version-prefix)))

(defn local-file-based-graph?
  [s]
  (and (string? s)
       (string/starts-with? s file-version-prefix)))

(defn get-schema
  "Returns schema for given repo"
  [repo]
  (if (db-based-graph? repo)
    db-schema/schema-for-db-based-graph
    db-schema/schema))

(defn block-with-timestamps
  "Adds updated-at timestamp and created-at if it doesn't exist"
  [block]
  (let [updated-at (common-util/time-ms)
        block (cond->
               (assoc block :block/updated-at updated-at)
                (nil? (:block/created-at block))
                (assoc :block/created-at updated-at))]
    block))

(defn build-new-property
  "Build a standard new property so that it is is consistent across contexts. Takes
   an optional map with following keys:
   * :title - Case sensitive property name. Defaults to deriving this from db-ident
   * :block-uuid - :block/uuid for property"
  ([db-ident prop-schema] (build-new-property db-ident prop-schema {}))
  ([db-ident prop-schema {:keys [title block-uuid ref-type?]}]
   (assert (keyword? db-ident))
   (let [db-ident' (if (qualified-keyword? db-ident)
                     db-ident
                     (db-property/create-user-property-ident-from-name (name db-ident)))
         prop-name (or title (name db-ident'))
         classes (:classes prop-schema)
         prop-schema (assoc prop-schema :type (get prop-schema :type :default))]
     (block-with-timestamps
      (cond->
       {:db/ident db-ident'
        :block/type "property"
        :block/format :markdown
        :block/schema (merge {:type :default} (dissoc prop-schema :classes :cardinality))
        :block/name (common-util/page-name-sanity-lc (name prop-name))
        :block/uuid (or block-uuid (common-uuid/gen-uuid :db-ident-block-uuid db-ident'))
        :block/title (name prop-name)
        :db/index true
        :db/cardinality (if (= :many (:cardinality prop-schema))
                          :db.cardinality/many
                          :db.cardinality/one)
        :block/order (db-order/gen-key)}
        (seq classes)
        (assoc :property/schema.classes classes)
        (or ref-type? (contains? (conj db-property-type/ref-property-types :entity) (:type prop-schema)))
        (assoc :db/valueType :db.type/ref))))))

(defn build-new-class
  "Build a standard new class so that it is consistent across contexts"
  [block]
  {:pre [(qualified-keyword? (:db/ident block))]}
  (block-with-timestamps
   (cond-> (merge block
                  {:block/type "class"
                   :block/format :markdown})
     (not= (:db/ident block) :logseq.class/Root)
     (assoc :class/parent :logseq.class/Root))))

(defn build-new-page
  "Builds a basic page to be transacted. A minimal version of gp-block/page-name->map"
  [page-name]
  (block-with-timestamps
   {:block/name (common-util/page-name-sanity-lc page-name)
    :block/title page-name
    :block/uuid (d/squuid)
    :block/format :markdown
    :block/type "page"}))

(defn page?
  [block]
  (contains? #{"page" "journal" "whiteboard" "class" "property" "hidden"}
             (:block/type block)))

(defn class?
  [entity]
  (= (:block/type entity) "class"))
(defn property?
  [entity]
  (= (:block/type entity) "property"))
(defn closed-value?
  [entity]
  (= (:block/type entity) "closed value"))
(defn whiteboard?
  "Given a page entity or map, check if it is a whiteboard page"
  [page]
  (= (:block/type page) "whiteboard"))

(defn journal?
  "Given a page entity or map, check if it is a journal page"
  [page]
  (= (:block/type page) "journal"))

(defn hidden?
  [page]
  (when page
    (if (string? page)
      (or (string/starts-with? page "$$$")
          (= common-config/favorites-page-name page))
      (= (:block/type page) "hidden"))))
