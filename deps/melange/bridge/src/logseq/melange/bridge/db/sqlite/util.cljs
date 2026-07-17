(ns logseq.melange.bridge.db.sqlite.util
  "Utils fns for backend sqlite db"
  (:require [cljs-bean.transit]
            [cognitect.transit :as transit]
            ["@logseq/melange-js-api/common" :as melange-common]
            ["@logseq/melange-js-api/db" :as melange-db]
            [logseq.melange.bridge.common.util :as common-util]
            [logseq.melange.bridge.db.order :as db-order]
            [logseq.melange.bridge.platform.datascript :as d]
            [logseq.melange.bridge.runtime :as runtime]))

(defonce db-version-prefix (.-dbVersionPrefix (.-Config melange-common)))
(def ^:private sqlite-policy-api (.-SqlitePolicy melange-db))
(def ^:private sqlite-util-api (.-SqliteUtil melange-db))

(def ^:private write-handlers (cljs-bean.transit/writer-handlers))
(def ^:private read-handlers {})
(def write-transit-str
  (let [write-handlers* (->> (assoc d/transit-write-handlers
                                    (d/entity-type) (transit/write-handler (constantly "datascript/Entity")
                                                                     (fn [entity]
                                                                       (assert (some? (:db/id entity)))
                                                                       (assoc (d/entity-kv entity)
                                                                              :db/id (:db/id entity))))
                                    ExceptionInfo (transit/write-handler (constantly "error")
                                                                         (fn [e]
                                                                           {:message (ex-message e)
                                                                            :data (ex-data e)}))
                                    js/Error (transit/write-handler (constantly "js/Error")
                                                                    (fn [e] {:message (ex-message e)})))
                             (merge write-handlers))
        writer (transit/writer :json {:handlers write-handlers*})]
    (fn write-transit-str* [o]
      (try (transit/write writer o)
           (catch :default e
             (prn :logseq.db.sqlite.util/write-transit-str (type o) o)
             (js/console.trace)
             (throw e))))))

(def read-transit-str
  (let [read-handlers* (->> (assoc d/transit-read-handlers
                                   "datascript/Entity" identity
                                   "error" (fn [m] (ex-info (:message m) (:data m)))
                                   "js/Error" (fn [m] (js/Error. (:message m))))
                            (merge read-handlers))
        reader (transit/reader :json {:handlers read-handlers*})]
    (fn read-transit-str* [s]
      (transit/read reader s))))

(defn db-based-graph?
  [graph-name]
  ((.-dbBasedGraphNullable sqlite-policy-api) db-version-prefix graph-name))

(def block-with-timestamps common-util/block-with-timestamps)

(defn build-new-property
  "Build a standard new property so that it is is consistent across contexts. Takes
   an optional map with following keys:
   * :title - Case sensitive property name. Defaults to deriving this from db-ident
   * :block-uuid - :block/uuid for property"
  ([db-ident prop-schema] (build-new-property db-ident prop-schema {}))
  ([db-ident prop-schema options]
   ((.-buildProperty sqlite-util-api)
    (runtime/runtime-adapter)
    db-order/gen-key
    (fn [] ((.-nowMs (.-DateTime melange-common))))
    db-ident
    prop-schema
    options)))

(defn build-new-class
  "Build a standard new class so that it is consistent across contexts"
  [block]
  ((.-buildClassWith sqlite-util-api)
   (runtime/runtime-adapter)
   (fn [] ((.-nowMs (.-DateTime melange-common))))
   block))

(defn build-new-page
  "Builds a basic page to be transacted. A minimal version of gp-block/page-name->map"
  [title]
  ((.-buildPageWith sqlite-util-api)
   (runtime/runtime-adapter)
   (fn [] ((.-nowMs (.-DateTime melange-common))))
   title))

(defn kv
  "Creates a key-value pair tx with the key and value respectively stored under
  :db/ident and :kv/value. The key must be under the namespace :logseq.kv"
  [k value]
  ((.-kvWith sqlite-util-api)
   (runtime/runtime-adapter)
   k
   value))

(defn import-tx
  "Creates tx for an import given an import-type"
  [import-type]
  ((.-importTxWith sqlite-util-api)
   (runtime/runtime-adapter)
   (fn [] ((.-nowMs (.-DateTime melange-common))))
   import-type))
