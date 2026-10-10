(ns logseq.db.frontend.query-dsl
  "Pure parsing helpers shared by renderer and worker query DSL code."
  (:require [clojure.string :as string]
            [clojure.walk :as walk]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.frontend.property :as db-property]))

(def ^:private tag-placeholder "~~~tag-placeholder~~~")

(defn- quote-balanced-page-refs
  "Replaces each top-level [[...]] outside a string by (f [match title]), and
  keeps strings as they are. A [[ inside a ref opens a nested pair, so a
  title like `Project[[Gremlin Garden]]` is kept whole rather than cut at the
  first ]] (db-test #1374)."
  [s f]
  (let [n (count s)
        out (js/Array.)]
    (loop [i 0]
      (if (>= i n)
        (.join out "")
        (let [c (.charAt s i)]
          (cond
            ;; a string: copy through its closing quote, escapes included
            (= c "\"")
            (let [end (loop [j (inc i)]
                        (cond (>= j n) n
                              (= "\\" (.charAt s j)) (recur (+ j 2))
                              (= "\"" (.charAt s j)) (inc j)
                              :else (recur (inc j))))]
              (.push out (subs s i (min end n)))
              (recur end))

            (= "[[" (subs s i (+ i 2)))
            (let [end (loop [j (+ i 2) depth 1]
                        (cond (>= j n) nil
                              (= "[[" (subs s j (+ j 2))) (recur (+ j 2) (inc depth))
                              (= "]]" (subs s j (+ j 2))) (if (= depth 1)
                                                              (+ j 2)
                                                              (recur (+ j 2) (dec depth)))
                              :else (recur (inc j) depth)))]
              (if end
                (do (.push out (f [(subs s i end) (subs s (+ i 2) (- end 2))]))
                    (recur end))
                (do (.push out c) (recur (inc i)))))

            :else
            (do (.push out c) (recur (inc i)))))))))

(defn pre-transform
  [s]
  (if (common-util/wrapped-by-quotes? s)
    s
    (let [quoted-page-ref
          (fn [[match page-name]]
            (if (some? page-name)
              ;; The ref becomes an EDN string: a \ or " in the title (a tag
              ;; renamed to `Project"`) must be escaped, or the string ends early
              (let [page-name' (-> page-name
                                   (string/replace "\\" "\\\\")
                                   (string/replace "\"" "\\\"")
                                   (string/replace "#" tag-placeholder))]
                (str "\"" page-ref/left-brackets page-name' page-ref/right-brackets "\""))
              match))]
      (some-> s
              (quote-balanced-page-refs quoted-page-ref)
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
              ;; a string, escapes included, like the page-ref match above
              (string/replace #"\"(?:\\.|[^\"\\])+\""
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
