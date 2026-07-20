(ns frontend.db.query-dsl
  "Renderer wrapper for simple query APIs.

  Query execution belongs to the db worker. This namespace only keeps pure
  query-string transforms used by UI controls and dispatches query requests to
  worker thread APIs."
  (:require [clojure.string :as string]
            [clojure.walk :as walk]
            [frontend.db.async :as db-async]
            [frontend.template :as template]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.frontend.property :as db-property]))

(defonce tag-placeholder "~~~tag-placeholder~~~")

(defn pre-transform
  [s]
  (if (common-util/wrapped-by-quotes? s)
    s
    (let [quoted-page-ref (fn [matches]
                            (let [match' (string/replace (second matches) "#" tag-placeholder)]
                              (str "\"" page-ref/left-brackets match' page-ref/right-brackets "\"")))]
      (some-> s
              (string/replace #"\"?\[\[(.*?)\]\]\"?" quoted-page-ref)
              (string/replace #"\(between ([^\)]+)\)"
                              (fn [[_ x]]
                                (->> (string/split x #" ")
                                     (remove string/blank?)
                                     (map (fn [x]
                                            (if (or (contains? #{"+" "-"} (first x))
                                                    (and (common-util/safe-re-find #"\d" (first x))
                                                         (some #(string/ends-with? x %) ["y" "m" "d" "h" "min"])))
                                              (keyword (name x))
                                              x)))
                                     (string/join " ")
                                     (common-util/format "(between %s)"))))
              (string/replace #"\"[^\"]+\"" (fn [s] (string/replace s "#" tag-placeholder)))
              (string/replace " #" " #tag ")
              (string/replace #"^#" "#tag ")
              (string/replace tag-placeholder "#")))))

(defn simplify-query
  [query]
  (if (string? query)
    query
    (walk/postwalk
     (fn [f]
       (if (and
            (coll? f)
            (contains? #{'and 'or} (first f))
            (= 2 (count f)))
         (second f)
         f))
     query)))

(defn- resolve-timestamp-property
  [e]
  (let [k (second e)]
    (when (or (keyword? k) (symbol? k) (string? k))
      (let [k' (-> k
                   name
                   string/lower-case
                   (string/replace "_" "-")
                   keyword)]
        (if (db-property/property? k')
          k'
          (case k'
            :created-at :block/created-at
            :updated-at :block/updated-at
            nil))))))

(defn get-timestamp-property
  [e]
  (when-let [k (resolve-timestamp-property e)]
    (when (keyword? k)
      k)))

(def custom-readers
  {:readers {'tag (fn [x] (page-ref/->page-ref x))}})

(defn pre-transform-query
  [q]
  (let [q' (template/resolve-dynamic-template! q)]
    (pre-transform q')))

(def db-block-attrs
  "Block fields needed to render query results without a renderer DB."
  [:db/id :block/uuid :block/title :block/raw-title])

(defn- require-query-string!
  [query-string]
  (when-not (and (string? query-string)
                 (not (string/blank? query-string))
                 (not= "\"\"" query-string))
    (throw (ex-info "Invalid DSL query" {:query query-string})))
  query-string)

(defn- require-custom-query!
  [query-m]
  (when-not (and (map? query-m) (seq (:query query-m)))
    (throw (ex-info "Invalid custom query" {:query query-m})))
  query-m)

(defn query
  "Runs a dsl query with query as a string. Primary use is from '/query' or '{{query }}'."
  ([repo query-string]
   (query repo query-string {}))
  ([repo query-string query-opts]
   (require-query-string! query-string)
   (db-async/<invoke-db-worker :thread-api/query-dsl-query
                               repo
                               query-string
                               {:cards? (:cards? query-opts)
                                :block-attrs db-block-attrs})))

(defn custom-query
  "Runs a dsl query with query as a seq. Primary use is from advanced query."
  [repo query-m _query-opts]
  (require-custom-query! query-m)
  (db-async/<invoke-db-worker :thread-api/query-dsl-custom-query
                              repo
                              query-m
                              {:block-attrs db-block-attrs}))
