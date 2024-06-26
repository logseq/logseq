(ns frontend.db.react
  "Transact the tx with some specified relationship so that the components will
  be refreshed when subscribed data changed.
  It'll be great if we can find an automatically resolving and performant
  solution.
  "
  (:require [frontend.date :as date]
            [frontend.db.conn :as conn]
            [frontend.db.utils :as db-utils]
            [frontend.state :as state]
            [frontend.util :as util]
            [clojure.core.async :as async]
            [frontend.db.async.util :as db-async-util]
            [promesa.core :as p]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]))

;; Query atom of map of Key ([repo q inputs]) -> atom
;; TODO: replace with LRUCache, only keep the latest 20 or 50 items?

(defonce query-state (atom {}))

;; Current dynamic component
(def ^:dynamic *query-component* nil)

;; Which reactive queries are triggered by the current component
(def ^:dynamic *reactive-queries* nil)

;; component -> query-key
(defonce query-components (atom {}))

(defn set-new-result!
  [k new-result]
  (when-let [result-atom (get-in @query-state [k :result])]
    (reset! result-atom new-result)))

(defn clear-query-state!
  []
  (reset! query-state {}))

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
            @(:result result)))
    (:result result)))

(defn- <q-aux
  [repo db query-fn inputs-fn k query inputs]
  (let [kv? (and (vector? k) (= :kv (second k)))
        journals? (and (vector? k) (= :frontend.worker.react/journals (last k)))
        q (if (or journals? util/node-test?)
            (fn [query inputs] (apply d/q query db inputs))
            (fn [query inputs] (apply db-async-util/<q repo {} (cons query inputs))))]
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
  [repo k {:keys [use-cache? transform-fn query-fn inputs-fn disable-reactive? return-promise?]
           :or {use-cache? true
                transform-fn identity}} query & inputs]
  ;; {:pre [(s/valid? :frontend.worker.react/block k)]}
  (let [origin-key k
        k (vec (cons repo k))]
    (when-let [db (conn/get-db repo)]
      (let [result-atom (get-query-cached-result k)]
        (when-let [component *query-component*]
          (add-query-component! k component))
        (when-let [queries *reactive-queries*]
          (swap! queries conj origin-key))
        (if (and use-cache? result-atom)
          result-atom
          (let [result-atom (or result-atom (atom nil))
                p-or-value (<q-aux repo db query-fn inputs-fn k query inputs)]
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

(defn get-current-page
  []
  (let [match (:route-match @state/state)
        route-name (get-in match [:data :name])
        page (case route-name
               :page
               (get-in match [:path-params :name])
               (date/journal-name))]
    (when page
      (if (common-util/uuid-string? page)
        (db-utils/entity [:block/uuid (uuid page)])
        (ldb/get-page (conn/get-db) page)))))

(defn- execute-query!
  [graph db k {:keys [query inputs transform-fn query-fn inputs-fn result]
               :or {transform-fn identity}}]
  (p/let [p-or-value (<q-aux graph db query-fn inputs-fn k query inputs)
          result' (transform-fn p-or-value)]
    (when-not (= result' result)
      (set-new-result! k result'))))

(defn refresh-affected-queries!
  [repo-url affected-keys]
  (util/profile
   "refresh!"
   (let [db (conn/get-db repo-url)
         affected-keys-set (set affected-keys)
         state (->> (keep (fn [[k cache]]
                            (let [k' (vec (rest k))]
                              (when (and (= (first k) repo-url)
                                         (or (contains? affected-keys-set k')
                                             (contains? #{:custom :kv} (first k'))))
                                [k' cache]))) @query-state)
                    (into {}))
         all-keys (concat (distinct affected-keys)
                          (filter #(contains? #{:custom :kv} (first %)) (keys state)))]
     (doseq [k all-keys]
       (when-let [cache (get state k)]
         (let [{:keys [query query-fn]} cache
               custom? (= :custom (first k))]
           (when (or query query-fn)
             (try
               (let [f #(execute-query! repo-url db (vec (cons repo-url k)) cache)]
                 (when-not custom?
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
