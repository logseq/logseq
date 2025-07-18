(ns logseq.db.sqlite.util
  "Utils fns for backend sqlite db"
  (:require [cljs-bean.transit]
            [clojure.string :as string]
            [cognitect.transit :as transit]
            [datascript.core]
            [datascript.impl.entity :as de]
            [datascript.transit :as dt]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.uuid :as common-uuid]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]))

(defonce db-version-prefix common-config/db-version-prefix)

(def ^:private write-handlers (cljs-bean.transit/writer-handlers))
(def ^:private read-handlers {})

(def transit-w (transit/writer :json {:handlers write-handlers}))
(def transit-r (transit/reader :json {:handlers read-handlers}))
(defn transit-write
  [data]
  (transit/write transit-w data))

(defn transit-read
  [s]
  (transit/read transit-r s))

(def write-transit-str
  (let [write-handlers* (->> (assoc dt/write-handlers
                                    de/Entity (transit/write-handler (constantly "datascript/Entity")
                                                                     (fn [^de/entity entity]
                                                                       (assert (some? (:db/id entity)))
                                                                       (assoc (.-kv entity)
                                                                              :db/id (:db/id entity)))))
                             (merge write-handlers))
        writer (transit/writer :json {:handlers write-handlers*})]
    (fn write-transit-str* [o]
      (try (transit/write writer o)
           (catch :default e
             (prn ::write-transit-str o)
             (js/console.trace)
             (throw e))))))

(def read-transit-str
  (let [read-handlers* (->> (assoc dt/read-handlers
                                   "datascript/Entity" identity)
                            (merge read-handlers))
        reader (transit/reader :json {:handlers read-handlers*})]
    (fn read-transit-str* [s]
      (transit/read reader s))))

(defn db-based-graph?
  [graph-name]
  (when graph-name
    (string/starts-with? graph-name db-version-prefix)))

(def block-with-timestamps common-util/block-with-timestamps)

(defn build-new-property
  "Build a standard new property so that it is is consistent across contexts. Takes
   an optional map with following keys:
   * :title - Case sensitive property name. Defaults to deriving this from db-ident
   * :block-uuid - :block/uuid for property"
  ([db-ident prop-schema] (build-new-property db-ident prop-schema {}))
  ([db-ident prop-schema {:keys [title block-uuid ref-type? properties]}]
   (let [db-ident' (if (qualified-keyword? db-ident)
                     db-ident
                     (db-property/create-user-property-ident-from-name (name db-ident)))
         prop-name (or title (name db-ident'))
         prop-type (get prop-schema :logseq.property/type :default)]
     (merge
      (dissoc prop-schema :db/cardinality)
      (block-with-timestamps
       (cond->
        {:db/ident db-ident'
         :block/tags #{:logseq.class/Property}
         :logseq.property/type prop-type
         :block/name (common-util/page-name-sanity-lc (name prop-name))
         :block/uuid (or block-uuid (common-uuid/gen-uuid :db-ident-block-uuid db-ident'))
         :block/title (name prop-name)
         :db/index true
         :db/cardinality (if (#{:many :db.cardinality/many} (:db/cardinality prop-schema))
                           :db.cardinality/many
                           :db.cardinality/one)
         :block/order (db-order/gen-key)}
         (or ref-type? (contains? db-property-type/all-ref-property-types prop-type))
         (assoc :db/valueType :db.type/ref)
         (seq properties)
         (merge properties)))))))

(defn build-new-class
  "Build a standard new class so that it is consistent across contexts"
  [block]
  {:pre [(qualified-keyword? (:db/ident block))]}
  (block-with-timestamps
   (cond-> (merge block
                  {:block/tags (set (conj (:block/tags block) :logseq.class/Tag))})
     (and (not= (:db/ident block) :logseq.class/Root)
          (nil? (:logseq.property.class/extends block)))
     (assoc :logseq.property.class/extends :logseq.class/Root))))

(defn build-new-page
  "Builds a basic page to be transacted. A minimal version of gp-block/page-name->map"
  [title]
  (block-with-timestamps
   (cond->
    {:block/name (common-util/page-name-sanity-lc title)
     :block/title title
     :block/uuid (common-uuid/gen-uuid :builtin-block-uuid title)
     :block/tags #{:logseq.class/Page}}
     (contains? #{common-config/quick-add-page-name} title)
     (assoc :logseq.property/hide? true))))

(defn kv
  "Creates a key-value pair tx with the key and value respectively stored under
  :db/ident and :kv/value. The key must be under the namespace :logseq.kv"
  [k value]
  {:pre [(= "logseq.kv" (namespace k))]}
  {:db/ident k
   :kv/value value})

(defn import-tx
  "Creates tx for an import given an import-type"
  [import-type]
  (concat [(kv :logseq.kv/import-type import-type)
          ;; Timestamp is useful as this can occur much later than :logseq.kv/graph-created-at
           (kv :logseq.kv/imported-at (common-util/time-ms))]
          (mapv
           ;; Don't import some RTC related entities
           (fn [db-ident] [:db/retractEntity db-ident])
           [:logseq.kv/graph-uuid
            :logseq.kv/graph-local-tx
            :logseq.kv/remote-schema-version])))
