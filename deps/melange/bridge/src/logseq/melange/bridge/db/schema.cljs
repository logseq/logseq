(ns logseq.melange.bridge.db.schema
  "CLJS keyword map conversion for the typed Melange DataScript schema catalog."
  (:require ["@logseq/melange-js-api/db" :as db-api]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private schema-api (.-Schema db-api))
(def ^:private schema-version-api (.-SchemaVersion db-api))

(defn- keyword-set
  [values]
  (set (map keyword (seq values))))

(def schema
  (into {}
        (map (fn [[attribute uniqueness value-type has-index? cardinality]]
               [(keyword attribute)
                (cond-> {}
                  uniqueness (assoc :db/unique (keyword uniqueness))
                  value-type (assoc :db/valueType (keyword value-type))
                  cardinality (assoc :db/cardinality (keyword cardinality))
                  has-index? (assoc :db/index true))])
             (seq (.-entries schema-api)))))

(def retract-attributes
  (keyword-set (.-retractAttributes schema-api)))

(def ref-type-attributes
  (keyword-set (.-refTypeAttributes schema-api)))

(def card-many-attributes
  (keyword-set (.-cardManyAttributes schema-api)))

(def card-many-ref-type-attributes
  (keyword-set (.-cardManyRefTypeAttributes schema-api)))

(def card-one-ref-type-attributes
  (keyword-set (.-cardOneRefTypeAttributes schema-api)))

(def db-non-ref-attributes
  (keyword-set (.-dbNonRefAttributes schema-api)))

(defn schema-version?
  [value]
  ((.-valueIsVersionWith schema-version-api)
   (runtime/runtime-adapter)
   value))

(defn- encoded-version->map
  [^js encoded]
  {:major (.-major encoded)
   :minor (.-minor encoded)})

(defn parse-schema-version
  "Returns a schema-version map for a compatible map, sequence, integer, or string."
  [value]
  (if-let [encoded ((.-decodeValueWith schema-version-api)
                    (runtime/runtime-adapter)
                    value)]
    (encoded-version->map encoded)
    (throw (ex-info (str "Bad schema version: " value) {:data value}))))

(defn compare-schema-version
  [left right]
  ((.-compareValuesWith schema-version-api)
   (runtime/runtime-adapter)
   left
   right))

(def version
  (encoded-version->map (.-version schema-version-api)))

(defn major-version
  [value]
  (:major (parse-schema-version value)))

(defn schema-version->string
  [value]
  (if-let [result ((.-stringValueWith schema-version-api)
                   (runtime/runtime-adapter)
                   value)]
    result
    (throw (ex-info "Not a schema-version" {:data value}))))
