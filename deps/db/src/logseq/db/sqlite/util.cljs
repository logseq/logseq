(ns logseq.db.sqlite.util
  "Utils fns for backend sqlite db"
  (:require [clojure.string :as string]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.common.util :as common-util]
            [cognitect.transit :as transit]
            [datascript.transit :as dt]
            [datascript.impl.entity :as de]
            [cljs-bean.transit]))

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
                            (merge (cljs-bean.transit/writer-handlers)))]
    (fn write-transit-str* [o]
      (transit/write (transit/writer :json {:handlers write-handlers}) o))))

(def read-transit-str
  (let [read-handlers (assoc dt/read-handlers
                             "datascript/Entity" identity)]
    (fn read-transit-str* [s] (transit/read (transit/reader :json {:handlers read-handlers}) s))))

(defn db-based-graph?
  [graph-name]
  (string/starts-with? graph-name db-version-prefix))

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

(def property-ref-types #{:page :block :date :object})

(defn build-new-property
  "Build a standard new property so that it is is consistent across contexts"
  [db-ident prop-name prop-schema]
  (assert (keyword? db-ident))
  (let [db-ident' (if (or (= "user.property" (namespace db-ident))
                          (string/starts-with? (namespace db-ident) "logseq."))
                    db-ident
                    (keyword "user.property" (name db-ident)))]
    (block-with-timestamps
     (cond->
      {:db/ident db-ident'
       :block/type "property"
       :block/schema (merge {:type :default} prop-schema)
       :block/original-name (name prop-name)}
       (= :many (:cardinality prop-schema))
       (assoc :db/cardinality :db.cardinality/many)
       (not= :many (:cardinality prop-schema))
       (assoc :db/cardinality :db.cardinality/one)
       (contains? property-ref-types (:type prop-schema))
       (assoc :db/valueType :db.type/ref)
       true
       (assoc :db/index true)))))


(defn build-new-class
  "Build a standard new class so that it is is consistent across contexts"
  [block]
  (block-with-timestamps
   (merge {:block/type "class"
           :block/journal? false
           :block/format :markdown}
          block)))
