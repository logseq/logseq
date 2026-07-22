(ns logseq.melange.bridge.db.order
  "DataScript and mutable-state boundary for typed fractional order behavior."
  (:require [logseq.melange.bridge.platform.datascript :as d]
            [logseq.melange.bridge.runtime :as runtime]
            #?(:cljs ["@logseq/melange-js-api/db" :as db-api])))

#?(:cljs
   (def ^:private order-api (.-Order db-api))
   :clj
   (def ^:private order-api nil))

(defn reset-max-key!
  "Advances the OCaml-owned tracker or an explicitly supplied maximum-key atom."
  ([key]
   ((.-advanceTrackedMaxKey order-api) key))
  ([max-key-atom key]
   ((.-advanceCellWith order-api)
    (runtime/runtime-adapter)
    max-key-atom
    key)))

(defn gen-key
  "Generates one fractional order key between optional `start` and `end` bounds."
  ([]
   ((.-generateTrackedKeyBetween order-api) nil nil))
  ([end]
   ((.-generateTrackedKeyBetween order-api) nil end))
  ([start end & {:keys [max-key-atom]
                 :as options}]
   ((.-generateKeyWithStateWith order-api)
    (runtime/runtime-adapter)
    (contains? options :max-key-atom)
    max-key-atom
    start
    end)))

(defn get-max-order
  "Returns the greatest indexed `:block/order` value in `db`."
  [db]
  ((.-maxOrderWith order-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db))

(defn gen-n-keys
  "Generates `n` persistent fractional order keys between optional bounds."
  [n start end & {:keys [max-key-atom]
                  :as options}]
  (vec
   ((.-generateNKeysWithStateWith order-api)
    (runtime/runtime-adapter)
    (contains? options :max-key-atom)
    max-key-atom
    n
    start
    end)))

(defn validate-order-key?
  "Returns true for a valid fractional order key and throws for invalid input."
  [key]
  ((.-validateOrderKey order-api) key))

(defn get-prev-order
  "Returns the nearest preceding order for a property or closed value."
  [db property value-id]
  ((.-previousOrderWith order-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   property
   value-id))

(defn get-next-order
  "Returns the nearest following order for a property or closed value."
  [db property value-id]
  ((.-nextOrderWith order-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   property
   value-id))
