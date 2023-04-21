(ns frontend.db.query-react
  "Custom queries."
  (:require [clojure.string :as string]
            [clojure.walk :as walk]
            [frontend.config :as config]
            [frontend.db.conn :as conn]
            [frontend.db.model :as model]
            [frontend.db.react :as react]
            [frontend.db.utils :as db-utils]
            [frontend.debug :as debug]
            [frontend.extensions.sci :as sci]
            [frontend.state :as state]
            [logseq.graph-parser.util.db :as db-util]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [frontend.util :as util]
            [frontend.date :as date]
            [lambdaisland.glogi :as log]))

(defn resolve-input
  "Wrapper around db-util/resolve-input which provides editor-specific state"
  ([db input]
   (resolve-input db input {}))
  ([db input opts]
   (db-util/resolve-input db
                          input
                          (merge {:current-page-fn (fn []
                                                     (or (state/get-current-page)
                                                         (:page (state/get-default-home))
                                                         (date/today)))}
                                 opts))))

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
          repo (or repo (state/get-current-repo))
          db (conn/get-db repo)
          resolve-with (select-keys query-opts [:current-page-fn :current-block-uuid])
          resolved-inputs (mapv #(resolve-input db % resolve-with) inputs)
          inputs (cond-> resolved-inputs
                         rules
                   (conj rules))
          k [:custom (or (:query-string query') query') inputs]]
      (pprint "inputs (post-resolution):" resolved-inputs)
      (pprint "query-opts:" query-opts)
      (pprint (str "time elapsed: " (.toFixed (- (.now js/performance) start-time) 2) "ms"))
      (apply react/q repo k query-opts query inputs))))
