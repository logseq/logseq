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
(s/def ::block (s/tuple #(= ::block %) uuid?))
;; ::page-blocks
;; get page-blocks react-query
(s/def ::page-blocks (s/tuple #(= ::page-blocks %) int?))
;; ::block-and-children
;; get block&children react-query
(s/def ::block-and-children (s/tuple #(= ::block-and-children %) uuid?))
;; ::journals
;; get journal-list react-query
(s/def ::journals (s/tuple #(= ::journals %)))
;; ::page->pages
;; get PAGES referenced by PAGE
(s/def ::page->pages (s/tuple #(= ::page->pages %) int?))
;; ::page<-pages
;; get PAGES referencing PAGE
(s/def ::page<-pages (s/tuple #(= ::page<-pages %) int?))
;; ::page<-blocks-or-block<-blocks
;; get BLOCKS referencing PAGE or BLOCK
(s/def ::page<-blocks-or-block<-blocks
  (s/tuple #(= ::page<-blocks-or-block<-blocks %) int?))
;; FIXME: this react-query has performance issues
(s/def ::page-unlinked-refs (s/tuple #(= ::page-unlinked-refs %) int?))
;; ::block<-block-ids
;; get BLOCK-IDS referencing BLOCK
(s/def ::block<-block-ids (s/tuple #(= ::block<-block-ids %) int?))
;; custom react-query
(s/def ::custom any?)

(s/def ::react-query-keys (s/or :block ::block
                                :page-blocks ::page-blocks
                                :block-and-children ::block-and-children
                                :journals ::journals
                                :page->pages ::page->pages
                                :page<-pages ::page<-pages
                                :page<-blocks-or-block<-blocks ::page<-blocks-or-block<-blocks
                                :page-unlinked-refs ::page-unlinked-refs
                                :block<-block-ids ::block<-block-ids
                                :custom ::custom))

(s/def ::affected-keys (s/coll-of ::react-query-keys))

;; Query atom of map of Key ([repo q inputs]) -> atom
;; TODO: replace with LRUCache, only keep the latest 20 or 50 items?

(defonce query-state (atom {}))

(def ^:dynamic *query-component*)

;; component -> query-key
(defonce query-components (atom {}))

(defn set-new-result!
  [k new-result]
  (when-let [result-atom (get-in @query-state [k :result])]
    (reset! result-atom new-result)))

(defn swap-new-result!
  [k f]
  (when-let [result-atom (get-in @query-state [k :result])]
    (swap! result-atom f)))

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
  (swap! query-state dissoc k))

(defn add-query-component!
  [key component]
  (when (and key component)
    (swap! query-components assoc component key)))

(defn remove-query-component!
  [component]
  (when-let [query (get @query-components component)]
    (let [matched-queries (filter #(= query %) (vals @query-components))]
      (when (= 1 (count matched-queries))
        (remove-q! query))))
  (swap! query-components dissoc component))

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

(defn get-query-cached-result
  [k]
  (:result (get @query-state k)))

(defn q
  [repo k {:keys [use-cache? transform-fn query-fn inputs-fn disable-reactive?]
           :or {use-cache? true
                transform-fn identity}} query & inputs]
  {:pre [(s/valid? ::react-query-keys k)]}
  (let [kv? (and (vector? k) (= :kv (first k)))
        k (vec (cons repo k))]
    (when-let [conn (conn/get-conn repo)]
      (let [result-atom (get-query-cached-result k)]
        (when-let [component *query-component*]
          (add-query-component! k component))
        (if (and use-cache? result-atom)
          result-atom
          (let [result (cond
                         query-fn
                         (query-fn conn nil nil)

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
              (add-q! k query inputs result-atom transform-fn query-fn inputs-fn))))))))


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

(defn get-affected-queries-keys
  "Get affected queries through transaction datoms."
  [{:keys [tx-data]}]
  {:post [(s/valid? ::affected-keys %)]}

  (let [blocks (->> (filter (fn [datom] (contains? #{:block/left :block/parent :block/page} (:a datom))) tx-data)
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
                              (let [page-id (or
                                             (when (:block/name block) (:db/id block))
                                             (:db/id (:block/page block)))
                                    blocks [[::block (:block/uuid block)]]
                                    others (when page-id
                                             [[::page-blocks page-id]
                                              [::page->pages page-id]])]
                                (concat blocks others)))))
                        blocks)

                       (when-let [current-page-id (:db/id (get-current-page))]
                         [[::page->pages current-page-id]
                          [::page<-pages current-page-id]])

                       (map (fn [ref]
                              (let [entity (db-utils/entity ref)]
                                (if (:block/name entity) ; page
                                  [::page-blocks ref]
                                  [::page-blocks (:db/id (:block/page entity))])))
                            refs))
        others (->>
                (keys @query-state)
                (filter (fn [ks]
                          (contains? #{::block-and-children
                                       ::page<-blocks-or-block<-blocks}
                                     (second ks))))
                (map (fn [v] (vec (rest v)))))]
    (->>
     (util/concat-without-nil
      affected-keys
      others)
     set)))

(defn- execute-query!
  [graph db k tx {:keys [query inputs transform-fn query-fn inputs-fn result]}]
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
      (set-new-result! k new-result))))

(defn refresh!
  "Re-compute corresponding queries (from tx) and refresh the related react components."
  [repo-url {:keys [tx-data tx-meta] :as tx}]
  (when (and repo-url
             (seq tx-data)
             (not (:skip-refresh? tx-meta)))
    (let [db (conn/get-conn repo-url)
          affected-keys (get-affected-queries-keys tx)]
      (doseq [[k cache] @query-state]
        (let [custom? (= :custom (second k))
              kv? (= :kv (second k))]
          (when (and
                 (= (first k) repo-url)
                 (or (get affected-keys (vec (rest k)))
                     custom?
                     kv?))
            (let [{:keys [query query-fn]} cache]
              (when (or query query-fn)
                (try
                  (let [f #(execute-query! repo-url db k tx cache)]
                    (if (and custom?
                             ;; modifying during cards review need to be executed immediately
                             (not (:cards-query? (meta query))))
                      (async/put! (state/get-reactive-custom-queries-chan) [f query])
                      (f)))
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
          (catch js/Error error
            (let [type :custom-query/failed]
              (js/console.error (str type "\n" query))
              (js/console.error error)))))
      (recur))
    chan))
