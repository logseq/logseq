(ns frontend.db.file-based.async
  "File based async queries"
  (:require [promesa.core :as p]
            [frontend.db.async.util :as db-async-util]
            [clojure.string :as string]
            [logseq.common.util.page-ref :as page-ref]))

(def <q db-async-util/<q)

(defn <file-based-get-all-properties
  [graph]
  (p/let [properties (<q graph {:transact-db? false}
                         '[:find [?p ...]
                           :where
                           [_ :block/properties ?p]])
          properties (remove (fn [m] (empty? m)) properties)]
    (->> (map keys properties)
         (apply concat)
         distinct
         sort
         (map name)
         (map #(hash-map :block/title %)))))

(defn- property-value-for-refs-and-text
  "Given a property value's refs and full text, determines the value to
  autocomplete"
  [[refs text]]
  (if (or (not (coll? refs)) (= 1 (count refs)))
    text
    (map #(cond
            (string/includes? text (page-ref/->page-ref %))
            (page-ref/->page-ref %)
            (string/includes? text (str "#" %))
            (str "#" %)
            :else
            %)
         refs)))

(defn <get-file-based-property-values
  [graph property]
  (p/let [result (<q graph {:transact-db? false}
                     '[:find ?property-val ?text-property-val
                       :in $ ?property
                       :where
                       [?b :block/properties ?p]
                       [?b :block/properties-text-values ?p2]
                       [(get ?p ?property) ?property-val]
                       [(get ?p2 ?property) ?text-property-val]]
                     property)]
    (->>
     result
     (map property-value-for-refs-and-text)
     (map (fn [x] (if (coll? x) x [x])))
     (apply concat)
     (map str)
     (remove string/blank?)
     distinct
     sort)))
