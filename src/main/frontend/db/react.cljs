(ns frontend.db.react
  "Transact the tx with some specified relationship so that the components will
  be refreshed when subscribed data changed.
  It'll be great if we can find an automatically resolving and performant
  solution.
  "
  (:require [datascript.core :as d]
            [frontend.date :as date]
            [frontend.db.conn :as conn]
            [frontend.db.utils :as db-utils]
            [frontend.state :as state]
            [frontend.util :as util :refer [react]]
            [cljs.spec.alpha :as s]
            [clojure.core.async :as async]))

;;; keywords specs for reactive query, used by `react/q` calls
;; ::block
;; pull-block react-query
(s/def ::block (s/tuple #(= ::block %) int?))
;; ::page-blocks
;; get page-blocks react-query
(s/def ::page-blocks (s/tuple #(= ::page-blocks %) int?))
;; ::block-and-children
;; get block&children react-query
(s/def ::block-and-children (s/tuple #(= ::block-and-children %) uuid?))

;; ::journals
;; get journal-list react-query
(s/def ::journals (s/tuple #(= ::journals %)))
;; ::page<-pages
;; get PAGES referencing PAGE
(s/def ::page<-pages (s/tuple #(= ::page<-pages %) int?))
;; ::refs
;; get BLOCKS referencing PAGE or BLOCK
(s/def ::refs (s/tuple #(= ::refs %) int?))
;; custom react-query
(s/def ::custom any?)

(s/def ::react-query-keys (s/or :block ::block
                                :page-blocks ::page-blocks
                                :block-and-children ::block-and-children
                                :journals ::journals
                                :page<-pages ::page<-pages
                                :refs ::refs
                                :custom ::custom))

(s/def ::affected-keys (s/coll-of ::react-query-keys))

;; Query atom of map of Key ([repo q inputs]) -> atom
;; TODO: replace with LRUCache, only keep the latest 20 or 50 items?

(defonce query-state (atom {}))

;; Current dynamic component
(def ^:dynamic *query-component* nil)

;; Which reactive queries are triggered by the current component
(def ^:dynamic *reactive-queries* nil)

;; component -> query-key
(defonce query-components (atom {}))

(defn- get-blocks-range
  [result-atom new-result]
  (let [block? (and (coll? new-result)
                    (map? (first new-result))
                    (:block/uuid (first new-result)))]
    (when block?
      {:old [(:db/id (first @result-atom))
             (:db/id (last @result-atom))]
       :new [(:db/id (first new-result))
             (:db/id (last new-result))]})))

(defn set-new-result!
  [k new-result tx-report]
  (when-let [result-atom (get-in @query-state [k :result])]
    (when tx-report
      (when-let [range (get-blocks-range result-atom new-result)]
        (state/set-state! [:ui/pagination-blocks-range (get-in tx-report [:db-after :max-tx])] range)))
    (reset! result-atom new-result)))

(defn swap-new-result!
  [k f]
  (when-let [result-atom (get-in @query-state [k :result])]
    (let [new-result' (f @result-atom)]
      (reset! result-atom new-result'))))

(defn kv
  [key value]
  {:db/id -1
   :db/ident key
   key value})

(defn remove-key!
  [repo-url key]
  (db-utils/transact! repo-url [[:db.fn/retractEntity [:db/ident key]]])
  (set-new-result! [repo-url :kv key] nil nil))

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
  [k query time inputs result-atom transform-fn query-fn inputs-fn]
  (let [time' (int (util/safe-parse-float time))] ;; for robustness. `time` should already be float
    (swap! query-state assoc k {:query query
                                :query-time time'
                                :inputs inputs
                                :result result-atom
                                :transform-fn transform-fn
                                :query-fn query-fn
                                :inputs-fn inputs-fn}))
  result-atom)

(defn remove-q!
  [k]
  (swap! query-state dissoc k))

(defn add-query-component!
  [key component]
  (when (and key component)
    (swap! query-components update component (fn [col] (set (conj col key))))))

(defn remove-query-component!
  [component]
  (when-let [queries (get @query-components component)]
    (let [all-queries (apply concat (vals @query-components))]
      (doseq [query queries]
        (let [matched-queries (filter #(= query %) all-queries)]
          (when (= 1 (count matched-queries))
            (remove-q! query))))))
  (swap! query-components dissoc component))

;; TODO: rename :custom to :query/custom
(defn remove-custom-query!
  [repo query]
  (remove-q! [repo :custom query]))

;; Reactive query

(defn get-query-cached-result
  [k]
  (when-let [result (get @query-state k)]
    (when (satisfies? IWithMeta @(:result result))
      (set! (.-state (:result result))
           (with-meta @(:result result) {:query-time (:query-time result)})))
    (:result result)))

(defn q
  [repo k {:keys [use-cache? transform-fn query-fn inputs-fn disable-reactive?]
           :or {use-cache? true
                transform-fn identity}} query & inputs]
  {:pre [(s/valid? ::react-query-keys k)]}
  (let [kv? (and (vector? k) (= :kv (first k)))
        origin-key k
        k (vec (cons repo k))]
    (when-let [db (conn/get-db repo)]
      (let [result-atom (get-query-cached-result k)]
        (when-let [component *query-component*]
          (add-query-component! k component))
        (when-let [queries *reactive-queries*]
          (swap! queries conj origin-key))
        (if (and use-cache? result-atom)
          result-atom
          (let [{:keys [result time]} (util/with-time
                                        (-> (cond
                                              query-fn
                                              (query-fn db nil nil)

                                              inputs-fn
                                              (let [inputs (inputs-fn)]
                                                (apply d/q query db inputs))

                                              kv?
                                              (db-utils/entity db (last k))

                                              (seq inputs)
                                              (apply d/q query db inputs)

                                              :else
                                              (d/q query db))
                                            transform-fn))
                result-atom (or result-atom (atom nil))]
            ;; Don't notify watches now
            (set! (.-state result-atom) result)
            (if disable-reactive?
              result-atom
              (add-q! k query time inputs result-atom transform-fn query-fn inputs-fn))))))))


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

(defn- get-block-parents
  [db id]
  (let [get-parent (fn [id] (:db/id (:block/parent (db-utils/entity db id))))]
    (loop [result [id]
           id id]
      (if-let [parent (get-parent id)]
        (recur (conj result parent) parent)
        result))))

(defn- get-blocks-parents-from-both-dbs
  [db-after db-before block-entities]
  (let [current-db-parent-ids (->> (set (keep :block/parent block-entities))
                                   (mapcat (fn [parent]
                                             (get-block-parents db-after (:db/id parent)))))
        before-db-parent-ids (->> (map :db/id block-entities)
                                  (mapcat (fn [id]
                                            (get-block-parents db-before id))))]
    (set (concat current-db-parent-ids before-db-parent-ids))))

(defn get-affected-queries-keys
  "Get affected queries through transaction datoms."
  [{:keys [tx-data db-before db-after]}]
  {:post [(s/valid? ::affected-keys %)]}
  (let [blocks (->> (filter (fn [datom] (contains? #{:block/left :block/parent :block/page} (:a datom))) tx-data)
                    (map :v)
                    (distinct))
        refs (->> (filter (fn [datom]
                            (when (contains? #{:block/refs :block/path-refs} (:a datom))
                              (not= (:v datom)
                                    (:db/id (:block/page (db-utils/entity (:e datom))))))) tx-data)
                  (map :v)
                  (distinct))
        other-blocks (->> (filter (fn [datom] (= "block" (namespace (:a datom)))) tx-data)
                          (map :e))
        blocks (-> (concat blocks other-blocks) distinct)
        block-entities (keep (fn [block-id]
                              (let [block-id (if (and (string? block-id) (util/uuid-string? block-id))
                                               [:block/uuid block-id]
                                               block-id)]
                                (db-utils/entity block-id))) blocks)
        affected-keys (concat
                       (mapcat
                        (fn [block]
                          (let [page-id (or
                                         (when (:block/name block) (:db/id block))
                                         (:db/id (:block/page block)))
                                blocks [[::block (:db/id block)]]
                                path-refs (:block/path-refs block)
                                path-refs' (->> (keep (fn [ref]
                                                        (when-not (= (:db/id ref) page-id)
                                                          [[::refs (:db/id ref)]
                                                           [::block (:db/id ref)]])) path-refs)
                                                (apply concat))
                                page-blocks (when page-id
                                              [[::page-blocks page-id]])]
                            (concat blocks page-blocks path-refs')))
                        block-entities)

                       (mapcat
                        (fn [ref]
                          [[::refs ref]
                           [::block ref]])
                        refs)

                       (when-let [current-page-id (:db/id (get-current-page))]
                         [[::page<-pages current-page-id]]))
        parent-ids (get-blocks-parents-from-both-dbs db-after db-before block-entities)
        block-children-keys (->>
                             (keys @query-state)
                             (keep (fn [ks]
                                     (when (and (= ::block-and-children (second ks))
                                                (contains? parent-ids (last ks)))
                                       (vec (rest ks))))))]
    (->>
     (util/concat-without-nil
      affected-keys
      block-children-keys)
     set)))

(defn- execute-query!
  [graph db k tx {:keys [query query-time inputs transform-fn query-fn inputs-fn result]}
   {:keys [skip-query-time-check?]}]
  (when (or skip-query-time-check?
            (<= (or query-time 0) 80))
    (let [new-result (->
                     (cond
                       query-fn
                       (let [result (query-fn db tx result)]
                         (if (coll? result)
                           (doall result)
                           result))

                       inputs-fn
                       (let [inputs (inputs-fn)]
                         (apply d/q query db inputs))

                       (keyword? query)
                       (db-utils/get-key-value graph query)

                       (seq inputs)
                       (apply d/q query db inputs)

                       :else
                       (d/q query db))
                     transform-fn)]
     (when-not (= new-result result)
       (set-new-result! k new-result tx)))))

(defn path-refs-need-recalculated?
  [tx-meta]
  (when-let [outliner-op (:outliner-op tx-meta)]
    (not (or
          (contains? #{:collapse-expand-blocks :delete-blocks} outliner-op)
          (:undo? tx-meta) (:redo? tx-meta)))))

(defn refresh!
  "Re-compute corresponding queries (from tx) and refresh the related react components."
  [repo-url {:keys [tx-data tx-meta] :as tx}]
  (when (and repo-url
             (not (:skip-refresh? tx-meta)))
    (when (seq tx-data)
      (let [db (conn/get-db repo-url)
            affected-keys (get-affected-queries-keys tx)]
        (doseq [[k cache] @query-state]
          (let [custom? (= :custom (second k))
                kv? (= :kv (second k))]
            (when (and
                   (= (first k) repo-url)
                   (or (get affected-keys (vec (rest k)))
                       custom?
                       kv?))
              (let [{:keys [query query-fn]} cache
                    {:keys [custom-query?]} (state/edit-in-query-or-refs-component)]
                (util/profile
                 (str "refresh! " (rest k))
                 (when (or query query-fn)
                   (try
                     (let [f #(execute-query! repo-url db k tx cache {:skip-query-time-check? custom-query?})]
                       ;; Detects whether user is editing in a custom query, if so, execute the query immediately
                       (if (and custom? (not custom-query?))
                         (async/put! (state/get-reactive-custom-queries-chan) [f query])
                         (f)))
                     (catch :default e
                       (js/console.error e)))))))))))))

(defn set-key-value
  [repo-url key value]
  (if value
    (db-utils/transact! repo-url [(kv key value)])
    (remove-key! repo-url key)))

(defn sub-key-value
  ([key]
   (sub-key-value (state/get-current-repo) key))
  ([repo-url key]
   (when (conn/get-db repo-url)
     (let [m (some-> (q repo-url [:kv key] {} key key) react)]
       (if-let [result (get m key)]
         result
         m)))))

(defn run-custom-queries-when-idle!
  []
  (let [chan (state/get-reactive-custom-queries-chan)]
    (async/go-loop []
      (let [[f query] (async/<! chan)]
        (try
          (if (state/input-idle? (state/get-current-repo))
            (f)
            (do
              (async/<! (async/timeout 2000))
              (async/put! chan [f query])))
          (catch :default error
            (let [type :custom-query/failed]
              (js/console.error (str type "\n" query))
              (js/console.error error)))))
      (recur))
    chan))
