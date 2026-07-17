(ns logseq.melange.bridge.runtime
  (:refer-clojure :exclude [sequence])
  (:require [clojure.string :as string]
            [flatland.ordered.map :refer [ordered-map]]))

(defn- array->pairs
  [entries]
  (mapv (fn [entry]
          [(aget entry 0) (aget entry 1)])
        (seq entries)))

(defn- pairs->array
  [pairs]
  (to-array (map (fn [[key value]] #js [key value]) pairs)))

(defn to-string
  "Converts a CLJS keyword to its qualified name and preserves other values."
  [value]
  (if (keyword? value)
    (subs (str value) 1)
    value))

(def keyword-from-string keyword)
(def symbol-from-string symbol)
(defn nil-value [] nil)
(def string-to-value identity)
(def string-lowercase string/lower-case)
(defn string-is-url
  [value]
  (try
    (some? (.-origin (js/URL. value)))
    (catch :default _error
      false)))
(def bool-to-value identity)
(def int-to-value identity)
(def float-to-value identity)
(def value-equals =)
(def value-truthy boolean)
(def value-to-string str)
(def value-is-nil nil?)
(def value-is-string string?)
(def value-is-bool boolean?)
(def value-is-number number?)
(def value-is-integer int?)
(def value-is-keyword keyword?)
(def value-is-uuid uuid?)
(def value-is-instant inst?)
(def instant-to-ms #(.getTime %))
(def value-is-vector vector?)
(def value-is-set set?)
(def value-is-map map?)
(def value-is-sequential sequential?)

(defn string-from-value [value]
  (assert (string? value) "value should be a string")
  value)

(defn bool-from-value [value]
  (assert (boolean? value) "value should be a boolean")
  value)

(defn float-from-value [value]
  (assert (number? value) "value should be a number")
  value)

(defn int-from-value [value]
  (assert (int? value) "value should be an integer")
  value)

(def uuid-to-string str)
(def uuid-from-string uuid)
(def collection-to-array to-array)
(def array-to-list #(apply list (array-seq %)))
(def vector-to-array to-array)
(def array-to-vector (comp vec seq))
(def set-to-array to-array)
(def array-to-set (comp set seq))
(def map-to-entries (comp pairs->array seq))
(def entries-to-map (comp (partial into {}) array->pairs))
(def map-get get)
(def map-assoc assoc)
(def map-dissoc dissoc)
(def map-contains contains?)
(def value-meta meta)
(def value-with-meta with-meta)
(def ordered-map-to-entries (comp pairs->array seq))

(defn entries-to-ordered-map
  [entries]
  (apply ordered-map (mapcat identity (array->pairs entries))))

(defn invoke-callback
  [callback value]
  (callback value))

(defn sequence
  [value]
  (seq value))

(defn sequence-first
  [value]
  (first value))

(defn sequence-rest
  [value]
  (rest value))

(defn sequence-cons
  [value values]
  (cons value values))

(defn lazy-sequence
  [thunk]
  (lazy-seq (thunk)))

(defn mutable-cell-value
  [cell]
  @cell)

(defn mutable-cell-reset
  [cell value]
  (reset! cell value))

(defn log-error
  [message]
  (js/console.error message))

(defn log-values
  [values]
  (apply prn (array-seq values)))

(defn reject-promise
  [message]
  (js/Promise.reject (js/Error. message)))

(defn runtime-adapter
  []
  #js {:keywordToString to-string
       :keywordFromString keyword-from-string
       :symbolFromString symbol-from-string
       :nilValue nil-value
       :stringToValue string-to-value
       :stringFromValue string-from-value
       :stringLowercase string-lowercase
       :stringIsUrl string-is-url
       :boolToValue bool-to-value
       :boolFromValue bool-from-value
       :intToValue int-to-value
       :intFromValue int-from-value
       :floatToValue float-to-value
       :floatFromValue float-from-value
       :valueEquals value-equals
       :valueTruthy value-truthy
       :valueToString value-to-string
       :valueIsNil value-is-nil
       :valueIsString value-is-string
       :valueIsBool value-is-bool
       :valueIsNumber value-is-number
       :valueIsInteger value-is-integer
       :valueIsKeyword value-is-keyword
       :valueIsUuid value-is-uuid
       :valueIsInstant value-is-instant
       :instantToMs instant-to-ms
       :valueIsVector value-is-vector
       :valueIsSet value-is-set
       :valueIsMap value-is-map
       :valueIsSequential value-is-sequential
       :uuidToString uuid-to-string
       :uuidFromString uuid-from-string
       :collectionToArray collection-to-array
       :arrayToList array-to-list
       :vectorToArray vector-to-array
       :arrayToVector array-to-vector
       :setToArray set-to-array
       :arrayToSet array-to-set
       :mapToEntries map-to-entries
       :entriesToMap entries-to-map
       :mapGet map-get
       :mapAssoc map-assoc
       :mapDissoc map-dissoc
       :mapContains map-contains
       :valueMeta value-meta
       :valueWithMeta value-with-meta
       :orderedMapToEntries ordered-map-to-entries
       :entriesToOrderedMap entries-to-ordered-map
       :invokeCallback invoke-callback
       :sequence sequence
       :sequenceFirst sequence-first
       :sequenceRest sequence-rest
       :sequenceCons sequence-cons
       :lazySequence lazy-sequence
       :mutableCellValue mutable-cell-value
       :mutableCellReset mutable-cell-reset
       :logError log-error
       :logValues log-values
       :rejectPromise reject-promise})
