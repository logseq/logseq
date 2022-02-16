(ns frontend.db.react
  "Transact the tx with some specified relationship so that the components will
  be refreshed when subscribed data changed.
  It'll be great if we can find an automatically resolving and performant
  solution.
  "
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.date :as date]
            [frontend.db.conn :as conn]
            [frontend.db.utils :as db-utils]
            [frontend.state :as state]
            [frontend.util :as util :refer [react]]
            [frontend.util.marker :as marker]
            [frontend.db-schema :as db-schema]))

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
  (swap! query-state dissoc k)
  (state/delete-reactive-query-db! k))

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

(defn- new-db
  [cached-result tx-data old-db k]
  (when (and (coll? cached-result)
             (map? (first cached-result)))
    (try
      (let [db (or old-db
                   (let [cached-result (util/remove-nils cached-result)]
                     (-> (d/empty-db db-schema/schema)
                         (d/with cached-result)
                         (:db-after))))]
        (:db-after (d/with db tx-data)))
      (catch js/Error e
        (prn "New db: " {:k k
                         :old-db old-db
                         :cached-result cached-result})
        (js/console.error e)
        old-db))))

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
            (if disable-reactive?
              result-atom
              (do
                (let [db' (new-db result nil nil k)]
                  (state/set-reactive-query-db! k db'))
                (add-q! k query inputs result-atom transform-fn query-fn inputs-fn)))))))))


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

(defn get-affected-queries-keys
  "Get affected queries through transaction datoms."
  [{:keys [tx-data]}]
  (let [blocks (->> (filter (fn [datom] (contains? #{:block/left :block/parent} (:a datom))) tx-data)
                    (map :v)
                    (distinct))
        refs (->> (filter (fn [datom] (= :block/refs (:a datom))) tx-data)
                  (map :v)
                  (distinct))
        other-blocks (->> (filter (fn [datom] (= "block" (namespace (:a datom)))) tx-data)
                          (map :e))
        blocks (-> (concat blocks other-blocks) distinct)
        affected-keys (concat
                       (mapcat
                        (fn [block-id]
                          (let [block-id (if (and (string? block-id) (util/uuid-string? block-id))
                                           [:block/uuid block-id]
                                           block-id)]
                            (when-let [block (db-utils/entity block-id)]
                              (let [page-id (:db/id (:block/page block))
                                    blocks [[:blocks (:block/uuid block)]]
                                    others (when page-id
                                             [[:page/blocks page-id]
                                              [:page/ref-pages page-id]])]
                                (concat blocks others)))))
                        blocks)

                       (when-let [current-page-id (:db/id (get-current-page))]
                         [[:page/ref-pages current-page-id]
                          [:page/mentioned-pages current-page-id]])

                       (map (fn [ref]
                              (let [entity (db-utils/entity ref)]
                                (if (:block/name entity) ; page
                                  [:page/blocks ref]
                                  [:block/refs-count ref])))
                         refs))
        others (some->>
                (filter (fn [ks]
                          (contains? #{:block/block :block/refed-blocks :block/unlinked-refs} (second ks)))
                        (keys @query-state))
                (map (fn [v] (vec (rest v)))))
        refed-pages (map
                      (fn [[k page-id]]
                        (when (and page-id (= k :block/refed-blocks))
                          [:page/ref-pages page-id]))
                      affected-keys)]
    (->>
     (util/concat-without-nil
      affected-keys
      refed-pages
      others)
     set)))

(defn refresh!
  "Re-compute corresponding queries (from tx) and refresh the related react components."
  [repo-url {:keys [tx-data tx-meta] :as tx}]
  (when (and repo-url
             (seq tx-data)
             (not (:skip-refresh? tx-meta)))
    (let [db (conn/get-conn repo-url)
          affected-keys (get-affected-queries-keys tx)]
      (doseq [[k cache] @query-state]
        (when (and
               (= (first k) repo-url)
               (or (get affected-keys (vec (rest k)))
                   (= :custom (second k))))
          (util/profile (str "Affected query key: " (rest k))
           (let [{:keys [query inputs transform-fn query-fn inputs-fn result]} cache]
             (when (or query query-fn)
               (try
                 (let [db' (when (and (vector? k) (not= (second k) :kv))
                             (let [query-db (state/get-reactive-query-db k)
                                   result (new-db @result tx-data query-db k)]
                               (state/set-reactive-query-db! k result)
                               result))
                       db (or db' db)
                       new-result (->
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
                                   transform-fn)]
                   (when-not (= new-result result)
                     (set-new-result! k new-result)))
                 (catch js/Error e
                   (js/console.error e)))))))))))

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
