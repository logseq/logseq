(ns frontend.db.react
  "Transact the tx with some specified relationship so that the components will
  be refreshed when subscribed data changed.
  It'll be great if we can find an automatically resolving and performant
  solution.
  "
  (:require [clojure.core.async :as async]
            [datascript.core :as d]
            [frontend.db.async.util :as db-async-util]
            [frontend.db.conn :as conn]
            [frontend.db.utils :as db-utils]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [promesa.core :as p]))

;; Query atom of map of Key ([repo q inputs]) -> atom

(defonce *query-state (atom {}))

;; [[repo q]]
(defonce *collapsed-queries (atom {}))

(def ^:private max-query-state-size 128)
(defonce ^:private *query-last-access (volatile! {}))

(defn- now-ms
  []
  (.now js/Date))

(defn- entry-last-access
  [[k _entry]]
  (or (get @*query-last-access k) 0))

(defn set-q-collapsed!
  [k collapsed?]
  (swap! *collapsed-queries assoc k collapsed?))

(defn- query-collapsed?
  [k]
  (@*collapsed-queries k))

;; component -> query-key
(defonce component->query-key (volatile! {}))
;; query-key -> component-set
(defonce query-key->components (volatile! {}))

(def ^:private query-key-prop "__logseq_query_key")

(defn- set-query-key!
  [result-atom k]
  (gobj/set result-atom query-key-prop k)
  result-atom)

(defn query-key
  [result-atom]
  (when result-atom
    (gobj/get result-atom query-key-prop)))

(defn- remove-query-key-from-component-indexes!
  [k]
  (vswap! query-key->components dissoc k)
  (vswap! component->query-key
          (fn [m]
            (reduce-kv
             (fn [result component query-keys]
               (let [query-keys' (disj query-keys k)]
                 (if (seq query-keys')
                   (assoc result component query-keys')
                   result)))
             {}
             m))))

(defn- evict-query-state!
  []
  (when (> (count @*query-state) max-query-state-size)
    (let [drop-count (- (count @*query-state) max-query-state-size)
          drop-keys (->> @*query-state
                         (remove (fn [[k _cache]]
                                   (seq (get @query-key->components k))))
                         (sort-by entry-last-access)
                         (take drop-count)
                         (map key)
                         vec)]
      (when (seq drop-keys)
        (swap! *query-state #(apply dissoc % drop-keys))
        (doseq [k drop-keys]
          (remove-query-key-from-component-indexes! k))))))

(defn set-new-result!
  [k new-result]
  (when-let [result-atom (get-in @*query-state [k :result])]
    (reset! result-atom new-result)))

(defn clear-query-state!
  []
  (reset! *query-state {})
  (reset! *collapsed-queries {})
  (vreset! *query-last-access {})
  (vreset! component->query-key {})
  (vreset! query-key->components {}))

(defn add-q!
  [k query inputs result-atom transform-fn query-fn inputs-fn]
  (swap! *query-state assoc k {:query query
                               :inputs inputs
                               :result result-atom
                               :transform-fn transform-fn
                               :query-fn query-fn
                               :inputs-fn inputs-fn})
  (vswap! *query-last-access assoc k (now-ms))
  (evict-query-state!)
  result-atom)

(defn remove-q!
  [k]
  (when-not (and (= (second k) :custom) (nth k 3))                   ; today query
    (swap! *query-state dissoc k)
    (vswap! *query-last-access dissoc k)))

(defn add-query-component!
  [k component]
  (when (and k component)
    (vswap! component->query-key update component (fnil conj #{}) k)
    (vswap! query-key->components update k (fnil conj #{}) component)))

(defn remove-query-component!
  [component]
  (when-let [queries (get @component->query-key component)]
    (doseq [query queries]
      (vswap! query-key->components
              (fn [m]
                (if-let [components* (not-empty (disj (get m query) component))]
                  (assoc m query components*)
                  (dissoc m query))))
      (when (empty? (get @query-key->components query))
        (remove-q! query))))
  (vswap! component->query-key dissoc component))

(defn- request-query-component-render!
  [component]
  (when (fn? component)
    (component)))

(defn- refresh-query-components!
  [k]
  (doseq [component (get @query-key->components k)]
    (request-query-component-render! component)))

;; Reactive query

(defn get-query-cached-result
  [k]
  (when-let [result (get @*query-state k)]
    (vswap! *query-last-access assoc k (now-ms))
    (when (satisfies? IWithMeta @(:result result))
      (set! (.-state (:result result))
            @(:result result)))
    (:result result)))

(defn- <q-aux
  [repo db query-fn inputs-fn k query inputs built-in-query?]
  (let [kv? (and (vector? k) (= :kv (second k)))
        q (if util/node-test?
            (fn [query inputs] (apply d/q query db inputs))
            (fn [query inputs]
              (let [q-f #(apply db-async-util/<q repo {:transact-db? false
                                                       :advanced-query? true} (cons query inputs))]
                (if built-in-query?
                  ;; delay built-in-queries to not block journal rendering
                  (p/let [_ (p/delay 100)]
                    (q-f))
                  (q-f)))))]
    (when (or query-fn query kv?)
      (cond
        query-fn
        (query-fn db nil)

        kv?
        (db-utils/entity db (last k))

        inputs-fn
        (let [inputs (inputs-fn)]
          (q query inputs))

        (seq inputs)
        (q query inputs)

        :else
        (q query nil)))))

(defn q
  [repo k {:keys [use-cache? transform-fn query-fn inputs-fn
                  disable-reactive? return-promise? built-in-query?]
           :or {use-cache? true
                transform-fn identity}} query & inputs]
  ;; {:pre [(s/valid? :frontend.worker.react/block k)]}
  (let [k (vec (cons repo k))]
    (when-let [db (conn/get-db repo)]
      (let [result-atom (get-query-cached-result k)]
        (if (and use-cache? result-atom)
          (set-query-key! result-atom k)
          (let [result-atom (set-query-key! (or result-atom (atom nil)) k)
                p-or-value (<q-aux repo db query-fn inputs-fn k query inputs built-in-query?)]
            (when-not disable-reactive?
              (add-q! k query inputs result-atom transform-fn query-fn inputs-fn))
            (cond
              return-promise?
              p-or-value

              (p/promise? p-or-value)
              (do
                (p/let [result p-or-value
                        result' (transform-fn result)]
                  (reset! result-atom result'))
                result-atom)

              :else
              (let [result' (transform-fn p-or-value)]
                ;; Don't notify watches now
                (set! (.-state result-atom) result')
                result-atom))))))))

(defn- execute-query!
  [graph db k {:keys [query inputs transform-fn query-fn inputs-fn result built-in-query?]
               :or {transform-fn identity}}]
  (p/let [p-or-value (<q-aux graph db query-fn inputs-fn k query inputs built-in-query?)
          result' (transform-fn p-or-value)]
    (when-not (= result' result)
      (set-new-result! k result'))
    (refresh-query-components! k)))

(defn refresh-affected-queries!
  [repo-url affected-keys & {:keys [skip-kv-custom-keys?]
                             :or {skip-kv-custom-keys? false}}]
  (util/profile
    "refresh!"
    (let [db (conn/get-db repo-url)
          affected-keys-set (set affected-keys)
          state (->> (keep (fn [[k cache]]
                             (let [k' (vec (rest k))]
                               (when (and (= (first k) repo-url)
                                          (or (contains? affected-keys-set k')
                                              (contains? #{:custom :kv} (first k'))))
                                 [k' cache]))) @*query-state)
                     (into {}))
          all-keys (concat (distinct affected-keys)
                           (when-not skip-kv-custom-keys?
                             (filter #(contains? #{:custom :kv} (first %)) (keys state))))]
      (doseq [k all-keys]
        (when-let [cache (get state k)]
          (let [{:keys [query query-fn]} cache
                custom? (= :custom (first k))]
            (when (or query query-fn)
              (try
                (let [f #(execute-query! repo-url db (vec (cons repo-url k)) cache)]
                  (if custom?
                   ;; perf: don't execute custom queries if they were collapsed
                    (when-not (query-collapsed? k)
                      (async/put! (state/get-reactive-custom-queries-chan) [f query]))
                    (f)))
                (catch :default e
                  (js/console.error e)
                  nil)))))))))

(defn refresh!
  "Re-compute corresponding queries (from tx) and refresh the related react components."
  [repo-url affected-keys]
  (when (and repo-url (seq affected-keys))
    (refresh-affected-queries! repo-url affected-keys)))

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
