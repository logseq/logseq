(ns frontend.db.query-react
  "Custom queries."
  (:require [clojure.string :as string]
            [clojure.walk :as walk]
            [frontend.db.async :as db-async]
            [frontend.db.react :as react]
            [frontend.extensions.sci :as sci]
            [frontend.state :as state]
            [frontend.util.datalog :as datalog-util]
            [lambdaisland.glogi :as log]
            [logseq.common.util.page-ref :as page-ref]
            [promesa.core :as p]))

(defn- seq-flatten
  [coll]
  (flatten (seq coll)))

(defn- query-current-page-title
  [query-opts]
  (when-let [f (:current-page-fn query-opts)]
    (f)))

(defn- current-page
  []
  (or (state/get-current-page)
      (:page (state/get-default-home))))

(defn- <resolve-inputs
  [repo inputs current-page-title]
  (p/let [today-title (db-async/<get-today-journal-title repo)]
    (db-async/<resolve-query-inputs repo inputs
                                    (cond-> {:current-page (current-page)
                                             :today-title today-title}
                                      current-page-title
                                      (assoc :current-page-title current-page-title)))))

(defn custom-query-result-transform
  [query-result remove-blocks q]
  (try
    (let [result (seq-flatten query-result)
          block? (:block/uuid (first result))
          result (if block?
                   (let [result (if (seq remove-blocks)
                                  (let [remove-blocks (set remove-blocks)]
                                    (remove (fn [h]
                                              (contains? remove-blocks (:block/uuid h)))
                                            result))
                                  result)]
                     result)
                   result)
          result-transform-fn (:result-transform q)]
      (if-let [result-transform (if (keyword? result-transform-fn)
                                  (get-in (state/get-config) [:query/result-transforms result-transform-fn])
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
         (and (list? f)
              (= (first f) '=)
              (= 3 (count f))
              (some page-ref? (rest f)))
         (let [[x y] (rest f)
               [page-ref sym] (if (page-ref? x) [x y] [y x])
               page-ref (string/lower-case page-ref)]
           (list 'contains? sym (page-ref/get-page-name page-ref)))

         :else
         f)) query)))

(defn- query-expects-rules?
  [query]
  (contains? (set (:in (datalog-util/query-vec->map query))) '%))

(defn react-query
  [repo {:keys [query inputs rules] :as query'} query-opts]
  (let [query (resolve-query query)
        repo (or repo (state/get-current-repo))
        rules-input (cond
                      (some? rules) rules
                      (query-expects-rules? query) [])
        current-page-title (query-current-page-title query-opts)
        inputs-key {:inputs inputs
                    :rules rules-input
                    :current-page (current-page)
                    :current-page-title current-page-title}
        inputs-fn (when (or (seq inputs) (some? rules-input))
                    (fn []
                      (p/let [resolved-inputs (if (seq inputs)
                                                (<resolve-inputs repo inputs current-page-title)
                                                [])]
                        (cond-> (vec resolved-inputs)
                          (some? rules-input)
                          (conj rules-input)))))
        k [:custom
           (or (:query-string query') (dissoc query' :title))
           (:today-query? query-opts)
           inputs-key]]
    [k (react/q repo k (cond-> query-opts
                         inputs-fn (assoc :inputs-fn inputs-fn))
                query)]))
