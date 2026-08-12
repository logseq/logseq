(ns logseq.db.frontend.query-dsl
  "Pure parsing helpers shared by renderer and worker query DSL code."
  (:require [clojure.string :as string]
            [clojure.walk :as walk]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.frontend.property :as db-property]))

(def ^:private tag-placeholder "~~~tag-placeholder~~~")

(defn pre-transform
  [s]
  (if (common-util/wrapped-by-quotes? s)
    s
    (let [quoted-page-ref
          (fn [matches]
            (let [match' (string/replace (second matches) "#" tag-placeholder)]
              (str "\"" page-ref/left-brackets match' page-ref/right-brackets "\"")))]
      (some-> s
              (string/replace #"\"?\[\[(.*?)\]\]\"?" quoted-page-ref)
              (string/replace #"\(between ([^\)]+)\)"
                              (fn [[_ x]]
                                (->> (string/split x #" ")
                                     (remove string/blank?)
                                     (map (fn [value]
                                            (if (or (contains? #{"+" "-"} (first value))
                                                    (and (common-util/safe-re-find #"\d" (first value))
                                                         (some #(string/ends-with? value %)
                                                               ["y" "m" "d" "h" "min"])))
                                              (keyword (name value))
                                              value)))
                                     (string/join " ")
                                     (common-util/format "(between %s)"))))
              (string/replace #"\"[^\"]+\""
                              #(string/replace % "#" tag-placeholder))
              (string/replace " #" " #tag ")
              (string/replace #"^#" "#tag ")
              (string/replace tag-placeholder "#")))))

(defn simplify-query
  [query]
  (if (string? query)
    query
    (walk/postwalk
     (fn [form]
       (if (and (coll? form)
                (contains? #{'and 'or} (first form))
                (= 2 (count form)))
         (second form)
         form))
     query)))

(defn get-timestamp-property
  [form]
  (let [property-name (second form)]
    (when (or (keyword? property-name)
              (symbol? property-name)
              (string? property-name))
      (let [property (-> property-name
                         name
                         string/lower-case
                         (string/replace "_" "-")
                         keyword)]
        (if (db-property/property? property)
          property
          (case property
            :created-at :block/created-at
            :updated-at :block/updated-at
            nil))))))

(def custom-readers
  {:readers {'tag page-ref/->page-ref}})
