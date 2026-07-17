(ns logseq.melange.bridge.common.util
  "CLJS representation and capability boundary for shared utility behavior."
  (:require ["@logseq/melange-js-api/common" :as common-api]
            [cljs.reader :as reader]
            [goog.string :as gstring]
            [logseq.melange.bridge.common.log :as log]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private util-api (.-Util common-api))
(def ^:private date-time-api (.-DateTime common-api))

(defn json->clj
  "Parses JSON and recursively converts its string keys to CLJS keywords."
  [json-string]
  (-> json-string
      (js/JSON.parse)
      (js->clj :keywordize-keys true)))

(defn distinct-by
  "Returns a lazy sequence retaining the first value for each derived key."
  [f coll]
  ((.-distinctLazyWith util-api)
   (runtime/runtime-adapter)
   f
   coll))

(defn distinct-by-last-wins
  "Returns values with only the last value retained for each derived key."
  [f coll]
  {:pre [(sequential? coll)]}
  (seq ((.-distinctByLastWinsWith util-api)
        (runtime/runtime-adapter)
        f
        coll)))

(defn safe-read-string
  "Reads an EDN string and returns nil after an optional log on parse failure."
  ([content]
   (safe-read-string {} content))
  ([{:keys [log-error?] :or {log-error? true} :as opts} content]
   ((.-safeReadStringWith util-api)
    (runtime/runtime-adapter)
    reader/read-string
    #(log/error :parse/read-string-failed %)
    (dissoc opts :log-error?)
    content
    (boolean log-error?))))

(defn safe-read-map-string
  "Reads an EDN string and returns an empty map after logging a parse failure."
  ([content]
   (safe-read-map-string {} content))
  ([opts content]
   ((.-safeReadMapStringWith util-api)
    (runtime/runtime-adapter)
    reader/read-string
    #(log/error :parse/read-string-failed %)
    opts
    content)))

(defn format
  "Formats values with Closure's printf-compatible formatter."
  [fmt & args]
  (apply gstring/format fmt args))

(defn block-with-timestamps
  "Returns a block with one current update timestamp and a preserved or initialized creation timestamp."
  [block]
  ((.-blockWithTimestampsWith util-api)
   (runtime/runtime-adapter)
   (fn [] ((.-nowMs date-time-api)))
   block))

(defn by-sorting
  "Builds a comparator from ordered value extractors and directions."
  [sorting]
  (let [criteria (to-array
                  (map (fn [{:keys [get-value asc?]}]
                         #js {:getValue get-value
                              :ascending (boolean asc?)})
                       sorting))]
    (fn [left right]
      ((.-compareByWith util-api)
       (runtime/runtime-adapter)
       compare
       criteria
       left
       right))))
