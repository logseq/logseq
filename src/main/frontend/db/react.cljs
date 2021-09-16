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
            [frontend.util :as util :refer [profile react]]
            [frontend.util.marker :as marker]
            [frontend.db.rules :as rules]))

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
        state (->> (filter (fn [[[_repo k] v]]
                             (contains? #{:blocks :block/block :custom} k)) state)
                   (into {}))]
    (reset! query-state state)))

(defn get-current-repo-refs-keys
  []
  (when-let [current-repo (state/get-current-repo)]
    (->>
     (map (fn [[repo k id]]
            (when (and (= repo current-repo)
                       (contains? #{:block/refed-blocks :block/unlinked-refs} k))
              [k id]))
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

(defn get-page-blocks-cache-atom
  [repo page-id]
  (:result (get @query-state [repo :page/blocks page-id])))

(defn get-block-blocks-cache-atom
  [repo block-id]
  (:result (get @query-state [repo :block/block block-id])))

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

(defn add-rules-to-inputs
  [inputs]
  (conj (vec inputs) rules/rules))

(defn q
  [repo k {:keys [use-cache? transform-fn query-fn inputs-fn]
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
            (add-q! k query inputs result-atom transform-fn query-fn inputs-fn)))))))



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
      (let [page-name (string/lower-case page)]
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

(defn get-related-keys
  [{:keys [key data]}]
  (cond
    (coll? key)
    [key]

    :else
    (case key
      (:block/change :block/insert)
      (when-let [blocks (seq data)]
        (let [pre-block? (:block/pre-block? (first blocks))
              current-priority (get-current-priority)
              current-marker (get-current-marker)
              current-page-id (:db/id (get-current-page))
              {:block/keys [page]} (first blocks)
              related-keys (->>
                            (util/concat-without-nil
                             (mapcat
                              (fn [block]
                                (when-let [page-id (:db/id (:block/page block))]
                                  [[:blocks (:block/uuid block)]
                                   [:page/blocks page-id]
                                   [:page/ref-pages page-id]]))
                              blocks)

                             (when pre-block?
                               [[:contents]
                                [:page/published]])

                             ;; affected priority
                             (when current-priority
                               [[:priority/blocks current-priority]])

                             (when current-marker
                               [[:marker/blocks current-marker]])

                             (when current-page-id
                               [[:page/ref-pages current-page-id]
                                ;; [:block/refed-blocks current-page-id]
                                [:page/mentioned-pages current-page-id]])

                             (apply concat
                               (for [{:block/keys [refs]} blocks]
                                 (mapcat (fn [ref]
                                           (when-let [block (if (and (map? ref) (:block/name ref))
                                                              (db-utils/entity [:block/name (:block/name ref)])
                                                              (db-utils/entity ref))]
                                             [[:page/blocks (:db/id (:block/page block))]
                                              ;; [:block/refed-blocks (:db/id block)]
                                              ]))
                                         refs))))
                            (distinct))
              refed-pages (map
                           (fn [[k page-id]]
                             (when (= k :block/refed-blocks)
                               [:page/ref-pages page-id]))
                            related-keys)
              all-refed-blocks (get-current-repo-refs-keys)
              custom-queries (some->>
                              (filter (fn [v]
                                        (and (= (first v) (state/get-current-repo))
                                             (= (second v) :custom)))
                                      (keys @query-state))
                              (map (fn [v]
                                     (vec (drop 1 v)))))
              block-blocks (some->>
                            (filter (fn [v]
                                      (and (= (first v) (state/get-current-repo))
                                           (= (second v) :block/block)))
                                    (keys @query-state))
                            (map (fn [v]
                                   (vec (drop 1 v)))))]
          (->>
           (util/concat-without-nil
            related-keys
            refed-pages
            all-refed-blocks
            custom-queries
            block-blocks)
           distinct)))
      [[key]])))

(defn refresh!
  [repo-url {:keys [key data] :as handler-opts}]
  (let [related-keys (get-related-keys handler-opts)
        db (conn/get-conn repo-url)]
    (doseq [related-key related-keys]
      (let [related-key (vec (cons repo-url related-key))]
        (when-let [cache (get @query-state related-key)]
          (let [{:keys [query inputs transform-fn query-fn inputs-fn]} cache]
            (when (or query query-fn)
              (let [new-result (->
                                (cond
                                  query-fn
                                  (profile
                                   "Query:"
                                   (doall (query-fn db)))

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
                (set-new-result! related-key new-result)))))))))

(defn transact-react!
  [repo-url tx-data {:keys [key data] :as handler-opts}]
  (when-not config/publishing?
    (let [repo-url (or repo-url (state/get-current-repo))
          tx-data (->> (util/remove-nils tx-data)
                       (remove nil?))
          get-conn (fn [] (conn/get-conn repo-url false))]
      (when (and (seq tx-data) (get-conn))
        (d/transact! (get-conn) (vec tx-data))
        (refresh! repo-url handler-opts)))))

(defn set-key-value
  [repo-url key value]
  (if value
    (transact-react! repo-url [(kv key value)]
                     {:key [:kv key]})
    (remove-key! repo-url key)))

(defn sub-key-value
  ([key]
   (sub-key-value (state/get-current-repo) key))
  ([repo-url key]
   (when (conn/get-conn repo-url)
     (-> (q repo-url [:kv key] {} key key)
         react
         key))))
