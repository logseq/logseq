(ns logseq.melange.bridge.common.collection
  "CLJS collection representation conversion for typed Melange Common consumers."
  (:require ["@logseq/melange-js-api/common" :as common-api]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private util (.-Util common-api))

(defn remove-nils-non-nested
  "Removes entries with `nil` values from the top level of `entries`."
  [entries]
  (let [entry-arrays (to-array (map (fn [[key value]] #js [key value]) entries))
        retained (.removeNilEntries util entry-arrays)]
    (reduce (fn [result entry]
              (assoc result (aget entry 0) (aget entry 1)))
            {}
            (seq retained))))

(defn fast-remove-nils
  "Removes `nil` items and top-level `nil` map values from `values`."
  [values]
  (.fastRemoveNilsWith util (runtime/runtime-adapter) values))

(defn concat-without-nil
  "Concatenates `collections` and removes `nil` values from the result."
  [& collections]
  (let [arrays (to-array (map to-array collections))
        retained (.concatPresentValues util arrays)]
    (map identity retained)))
