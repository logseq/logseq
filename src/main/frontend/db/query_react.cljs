(ns frontend.db.query-react
  "Custom queries."
  (:require [cljs-time.core :as t]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [frontend.config :as config]
            [frontend.db.model :as model]
            [frontend.db.react :as react]
            [frontend.db.utils :as db-utils :refer [date->int]]
            [frontend.debug :as debug]
            [frontend.extensions.sci :as sci]
            [frontend.state :as state]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [frontend.util :as util]
            [frontend.date :as date]
            [lambdaisland.glogi :as log]))

(defn resolve-input
  [input]
  (cond
    (= :right-now-ms input) (util/time-ms)
    (= :start-of-today-ms input) (util/today-at-local-ms 0 0 0 0)
    (= :end-of-today-ms input) (util/today-at-local-ms 24 0 0 0)

    (= :today input)
    (date->int (t/today))
    (= :yesterday input)
    (date->int (t/minus (t/today) (t/days 1)))
    (= :tomorrow input)
    (date->int (t/plus (t/today) (t/days 1)))
    (= :current-page input)
    (some-> (or (state/get-current-page)
                (:page (state/get-default-home))
                (date/today)) string/lower-case)

    (and (keyword? input)
         (util/safe-re-find #"^\d+d(-before)?$" (name input)))
    (let [input (name input)
          days (parse-long (re-find #"^\d+" input))]
      (date->int (t/minus (t/today) (t/days days))))
    (and (keyword? input)
         (util/safe-re-find #"^\d+d(-after)?$" (name input)))
    (let [input (name input)
          days (parse-long (re-find #"^\d+" input))]
      (date->int (t/plus (t/today) (t/days days))))

    (and (string? input) (page-ref/page-ref? input))
    (-> (page-ref/get-page-name input)
        (string/lower-case))

    :else
    input))

(defn custom-query-result-transform
  [query-result remove-blocks q]
  (try
    (let [result (db-utils/seq-flatten query-result)
          block? (:block/uuid (first result))
          result (if block?
                   (let [result (if (seq remove-blocks)
                                  (let [remove-blocks (set remove-blocks)]
                                    (remove (fn [h]
                                              (contains? remove-blocks (:block/uuid h)))
                                            result))
                                  result)]
                     (model/with-pages result))
                   result)
          result-transform-fn (:result-transform q)]
      (if-let [result-transform (if (keyword? result-transform-fn)
                                  (get-in (state/sub-config) [:query/result-transforms result-transform-fn])
                                  result-transform-fn)]
        (if-let [f (sci/eval-string (pr-str result-transform))]
          (try
            (sci/call-fn f result)
            (catch :default e
              (log/error :sci/call-error e)
              result))
          result)
        result))
    (catch :default e
      (log/error :query/failed e))))

(defn- resolve-query
  [query]
  (let [page-ref? #(and (string? %) (page-ref/page-ref? %))]
    (walk/postwalk
     (fn [f]
       (cond
         ;; backward compatible
         ;; 1. replace :page/ => :block/
         (and (keyword? f) (= "page" (namespace f)))
         (keyword "block" (name f))

         (and (keyword? f) (contains? #{:block/ref-pages :block/ref-blocks} f))
         :block/refs

         (and (list? f)
              (= (first f) '=)
              (= 3 (count f))
              (some page-ref? (rest f)))
         (let [[x y] (rest f)
               [page-ref sym] (if (page-ref? x) [x y] [y x])
               page-ref (string/lower-case page-ref)]
           (list 'contains? sym (page-ref/get-page-name page-ref)))

         (and (vector? f)
              (= (first f) 'page-property)
              (keyword? (util/nth-safe f 2)))
         (update f 2 (fn [k] (keyword (string/replace (name k) "_" "-"))))

         :else
         f)) query)))

(defn react-query
  [repo {:keys [query inputs rules] :as query'} query-opts]
  (let [pprint (if config/dev? debug/pprint (fn [_] nil))
        start-time (.now js/performance)]
    (pprint "================")
    (pprint "Use the following to debug your datalog queries:")
    (pprint query')
    (let [query (resolve-query query)
          resolved-inputs (mapv resolve-input inputs)
          inputs (cond-> resolved-inputs
                         rules
                         (conj rules))
          repo (or repo (state/get-current-repo))
          k [:custom (or (:query-string query') query')]]
      (pprint "inputs (post-resolution):" resolved-inputs)
      (pprint "query-opts:" query-opts)
      (pprint (str "time elapsed: " (.toFixed (- (.now js/performance) start-time) 2) "ms"))
      (apply react/q repo k query-opts query inputs))))
