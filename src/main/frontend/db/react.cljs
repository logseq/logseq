(ns frontend.db.react
  "Transact the tx with some specified relationship so that the components will
  be refreshed when subscribed data changed.
  It'll be great if we can find an automatically resolving and performant
  solution.
  "
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db.conn :as conn]
            [frontend.db.utils :as db-utils]
            [frontend.state :as state]
            [frontend.util :as util :refer [react]]
            [frontend.util.marker :as marker]
            [frontend.db-schema :as db-schema]
            [frontend.date :as date]))

;; Query atom of map of Key ([repo q inputs]) -> atom
;; TODO: replace with LRUCache, only keep the latest 20 or 50 items?

(defonce query-state (atom {}))

(def ^:dynamic *query-component*)

;; key -> components
(defonce query-components (atom {}))

(defn set-new-result!
  [k new-result]
  (when-let [result-atom (get-in @query-state [k :result])]
    (reset! result-atom new-result)))

;; KV

(defn kv
  [key value]
  {:db/id -1
   :db/ident key
   key value})

(defn remove-key!
  [repo-url key]
  (db-utils/transact! repo-url [[:db.fn/retractEntity [:db/ident key]]])
  (set-new-result! [repo-url :kv key] nil))

(defn clear-query-state!
  []
  (reset! query-state {}))

(defn clear-query-state-without-refs-and-embeds!
  []
  (let [state @query-state
        state (->> (filter (fn [[[_repo k] _v]]
                             (contains? #{:blocks :block/block :custom} k)) state)
                   (into {}))]
    (reset! query-state state)))

(defn get-current-repo-refs-keys
  [{:keys [data]}]
  (when-let [current-repo (state/get-current-repo)]
    (->>
     (map (fn [[repo k id]]
            (when (and (= repo current-repo)
                       (contains? #{:block/refed-blocks :block/unlinked-refs} k))
              (if (= k :block/refed-blocks)
                (if (every? (fn [m]
                              (when (map? m)
                                (= id (:db/id (:block/page m))))) data)
                  nil
                  [k id])
                [k id])))
       (keys @query-state))
     (remove nil?))))

;; TODO: Add components which subscribed to a specific query
(defn add-q!
  [k query inputs result-atom transform-fn query-fn inputs-fn]
  (swap! query-state assoc k {:query query
                              :inputs inputs
                              :result result-atom
                              :transform-fn transform-fn
                              :query-fn query-fn
                              :inputs-fn inputs-fn})
  result-atom)

(defn remove-q!
  [k]
  (swap! query-state dissoc k))

(defn add-query-component!
  [key component]
  (swap! query-components update key
         (fn [components]
           (distinct (conj components component)))))

(defn remove-query-component!
  [component]
  (reset!
   query-components
   (->> (for [[k components] @query-components
              :let [new-components (remove #(= component %) components)]]
          (if (empty? new-components) ; no subscribed components
            (do (remove-q! k)
                nil)
            [k new-components]))
        (keep identity)
        (into {}))))

;; TODO: rename :custom to :query/custom
(defn remove-custom-query!
  [repo query]
  (remove-q! [repo :custom query]))

;; Reactive query


(defn query-entity-in-component
  ([id-or-lookup-ref]
   (db-utils/entity (state/get-current-repo) id-or-lookup-ref))
  ([repo id-or-lookup-ref]
   (let [k [:entity id-or-lookup-ref]
         result-atom (:result (get @query-state k))]
     (when-let [component *query-component*]
       (add-query-component! k component))
     (when-let [db (conn/get-conn repo)]
       (let [result (d/entity db id-or-lookup-ref)
             result-atom (or result-atom (atom nil))]
         (set! (.-state result-atom) result)
         (add-q! k nil nil result-atom identity identity identity))))))

(defn q
  [repo k {:keys [use-cache? transform-fn query-fn inputs-fn disable-reactive?]
           :or {use-cache? true
                transform-fn identity}} query & inputs]
  (let [kv? (and (vector? k) (= :kv (first k)))
        k (vec (cons repo k))]
    (when-let [conn (conn/get-conn repo)]
      (let [result-atom (:result (get @query-state k))]
        (when-let [component *query-component*]
          (add-query-component! k component))
        (if (and use-cache? result-atom)
          result-atom
          (let [result (cond
                         query-fn
                         (query-fn conn)

                         inputs-fn
                         (let [inputs (inputs-fn)]
                           (apply d/q query conn inputs))

                         kv?
                         (d/entity conn (last k))

                         (seq inputs)
                         (apply d/q query conn inputs)

                         :else
                         (d/q query conn))
                result (transform-fn result)
                result-atom (or result-atom (atom nil))]
            ;; Don't notify watches now
            (set! (.-state result-atom) result)
            (if-not disable-reactive?
              (add-q! k query inputs result-atom transform-fn query-fn inputs-fn)
              result-atom)))))))



;; TODO: Extract several parts to handlers


(defn get-current-page
  []
  (let [match (:route-match @state/state)
        route-name (get-in match [:data :name])
        page (case route-name
               :page
               (get-in match [:path-params :name])

               :file
               (get-in match [:path-params :path])

               (date/journal-name))]
    (when page
      (let [page-name (util/page-name-sanity-lc page)]
        (db-utils/entity [:block/name page-name])))))

(defn get-current-priority
  []
  (let [match (:route-match @state/state)
        route-name (get-in match [:data :name])]
    (when (= route-name :page)
      (when-let [page-name (get-in match [:path-params :name])]
        (and (contains? #{"a" "b" "c"} (string/lower-case page-name))
             (string/upper-case page-name))))))

(defn get-current-marker
  []
  (let [match (:route-match @state/state)
        route-name (get-in match [:data :name])]
    (when (= route-name :page)
      (when-let [page-name (get-in match [:path-params :name])]
        (and (marker/marker? page-name)
             (string/upper-case page-name))))))

(defn- new-db
  [cached-result tx-data old-db]
  (let [cached-result (util/remove-nils cached-result)
        db (or old-db
               (-> (d/empty-db db-schema/schema)
                   (d/with cached-result)
                   (:db-after)))]
    (:db-after (d/with db tx-data))))

(defonce current-page-db (atom nil))

;; TODO: incremental or delayed queries (e.g. only run custom queries when idle)
(defn refresh!
  [repo-url {:keys [tx-data tx-meta]}]
  (when (and repo-url
             (seq tx-data)
             (not (:skip-refresh? tx-meta)))
    (let [db (conn/get-conn repo-url)
          current-page (or (state/get-current-page)
                           (date/today))
          current-page (db-utils/entity [:block/name (util/page-name-sanity-lc current-page)])]
      (doseq [[k cache] @query-state]
        (when (and (= (first k) repo-url) cache)
          (let [{:keys [query inputs transform-fn query-fn inputs-fn result]} cache]
            (when (or query query-fn)
              (try
                (let [db (if (and (coll? @result)
                                  (:db/id (first @result)))
                           (let [current-page? (and
                                                (= :page/blocks (second k))
                                                (= (:db/id current-page) (nth k 2)))
                                 new-db (if current-page?
                                          (new-db @result tx-data @current-page-db)
                                          (new-db @result tx-data nil))]
                             (when current-page?
                               (reset! current-page-db new-db))
                             new-db)
                           db)
                      new-result (util/profile (str "refresh: " (rest k))
                                               (->
                                                (cond
                                                  query-fn
                                                  (let [result (query-fn db)]
                                                    (if (coll? result)
                                                      (doall result)
                                                      result))

                                                  inputs-fn
                                                  (let [inputs (inputs-fn)]
                                                    (apply d/q query db inputs))

                                                  (keyword? query)
                                                  (db-utils/get-key-value repo-url query)

                                                  (seq inputs)
                                                  (apply d/q query db inputs)

                                                  :else
                                                  (d/q query db))
                                                transform-fn))]
                  (when-not (= new-result result)
                    (set-new-result! k new-result)))
                (catch js/Error e
                  (js/console.error e))))))))))

(defn set-key-value
  [repo-url key value]
  (if value
    (db-utils/transact! repo-url [(kv key value)])
    (remove-key! repo-url key)))

(defn sub-key-value
  ([key]
   (sub-key-value (state/get-current-repo) key))
  ([repo-url key]
   (when (conn/get-conn repo-url)
     (let [m (some-> (q repo-url [:kv key] {} key key) react)]
       (if-let [result (get m key)]
         result
         m)))))
