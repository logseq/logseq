(ns frontend.worker.rtc.op-mem-layer
  "Store client-ops in memory.
  And sync these ops to indexedDb automatically."
  (:require [clojure.set :as set]
            [frontend.common.missionary-util :as c.m]
            [frontend.worker.rtc.const :as rtc-const]
            [frontend.worker.rtc.op-idb-layer :as op-idb-layer]
            [frontend.worker.state :as worker-state]
            [logseq.db :as ldb]
            [logseq.db.sqlite.util :as sqlite-util]
            [malli.core :as ma]
            [malli.transform :as mt]
            [missionary.core :as m]
            [promesa.core :as p]))

(def op-schema
  [:multi {:dispatch first}
   [:move
    [:catn
     [:op :keyword]
     [:t :int]
     [:value [:map
              [:block-uuid :uuid]]]]]
   [:remove
    [:catn
     [:op :keyword]
     [:t :int]
     [:value [:map
              [:block-uuid :uuid]]]]]
   [:update-page
    [:catn
     [:op :keyword]
     [:t :int]
     [:value [:map
              [:block-uuid :uuid]]]]]
   [:remove-page
    [:catn
     [:op :keyword]
     [:t :int]
     [:value [:map
              [:block-uuid :uuid]]]]]
   [:update
    [:catn
     [:op :keyword]
     [:t :int]
     [:value [:map
              [:block-uuid :uuid]
              [:av-coll [:sequential rtc-const/av-schema]]]]]]

   [:update-asset
    [:catn
     [:op :keyword]
     [:t :int]
     [:value [:map
              [:asset-uuid :uuid]]]]]
   [:remove-asset
    [:catn
     [:op :keyword]
     [:t :int]
     [:value [:map
              [:asset-uuid :uuid]]]]]])

(def ops-schema [:sequential op-schema])

(def ops-coercer (ma/coercer ops-schema mt/json-transformer))

(def ops-store-value-schema
  [:map
   [:graph-uuid {:optional true} :string]
   [:local-tx {:optional true} :int]
   [:block-uuid->ops [:map-of :uuid
                      [:map-of [:enum :move :remove :update :update-page :remove-page] :any]]]
   [:asset-uuid->ops [:map-of :uuid
                      [:map-of [:enum :update-asset :remove-asset] :any]]]
   [:t+block-uuid-sorted-set [:set [:cat :int :uuid]]]])

(def ops-store-schema
  [:map-of :string                      ; repo-name
   [:map
    [:current-branch ops-store-value-schema]
    [:old-branch {:optional true} [:maybe ops-store-value-schema]]]])

(def ops-store-schema-coercer (ma/coercer ops-store-schema))

(defonce *ops-store (atom {} :validator ops-store-schema-coercer))

(defn- merge-update-ops
  [update-op1 update-op2]
  {:pre [(= :update (first update-op1))
         (= :update (first update-op2))
         (= (:block-uuid (last update-op1))
            (:block-uuid (last update-op2)))]}
  (let [t1 (second update-op1)
        t2 (second update-op2)]
    (if (> t1 t2)
      (merge-update-ops update-op2 update-op1)
      (let [{av-coll1 :av-coll block-uuid :block-uuid} (last update-op1)
            av-coll2 (:av-coll (last update-op2))]
        [:update t2
         {:block-uuid block-uuid
          :av-coll (concat av-coll1 av-coll2)}]))))

(defn- block-uuid->min-t
  [block-uuid->ops block-uuid]
  (some->> (block-uuid->ops block-uuid)
           vals
           (map second)
           seq
           (apply min)))

(defn- update-t+block-uuid-sorted-set
  [t+block-uuid-sorted-set old-block-uuid->ops block-uuid->ops block-uuid]
  (let [origin-min-t (block-uuid->min-t old-block-uuid->ops block-uuid)
        min-t (block-uuid->min-t block-uuid->ops block-uuid)]
    (cond-> t+block-uuid-sorted-set
      origin-min-t (disj [origin-min-t block-uuid])
      true (conj [min-t block-uuid]))))

(defn ^:large-vars/cleanup-todo add-ops-aux
  [ops block-uuid->ops t+block-uuid-sorted-set]
  (loop [block-uuid->ops block-uuid->ops
         t+block-uuid-sorted-set t+block-uuid-sorted-set
         [op & others] ops]
    (if-not op
      {:block-uuid->ops block-uuid->ops
       :t+block-uuid-sorted-set t+block-uuid-sorted-set}
      (let [[op-type t value] op
            {:keys [block-uuid]} value
            exist-ops (some-> block-uuid block-uuid->ops)]
        (case op-type
          :move
          (let [already-removed? (some-> (get exist-ops :remove) second (> t))]
            (if already-removed?
              (recur block-uuid->ops t+block-uuid-sorted-set others)
              (let [block-uuid->ops* (-> block-uuid->ops
                                         (assoc-in [block-uuid :move] op)
                                         (update block-uuid dissoc :remove))
                    t+block-uuid-sorted-set*
                    (update-t+block-uuid-sorted-set t+block-uuid-sorted-set
                                                    block-uuid->ops
                                                    block-uuid->ops*
                                                    block-uuid)]
                (recur block-uuid->ops* t+block-uuid-sorted-set* others))))
          :update
          (let [already-removed? (some-> (get exist-ops :remove) second (> t))]
            (if already-removed?
              (recur block-uuid->ops t+block-uuid-sorted-set others)
              (let [origin-update-op (get-in block-uuid->ops [block-uuid :update])
                    op* (if origin-update-op (merge-update-ops origin-update-op op) op)
                    block-uuid->ops* (-> block-uuid->ops
                                         (assoc-in [block-uuid :update] op*)
                                         (update block-uuid dissoc :remove))
                    t+block-uuid-sorted-set*
                    (update-t+block-uuid-sorted-set t+block-uuid-sorted-set
                                                    block-uuid->ops
                                                    block-uuid->ops*
                                                    block-uuid)]
                (recur block-uuid->ops* t+block-uuid-sorted-set* others))))
          :remove
          (let [add-after-remove? (some-> (get exist-ops :move) second (> t))]
            (if add-after-remove?
              (recur block-uuid->ops t+block-uuid-sorted-set others)
              (let [block-uuid->ops* (assoc block-uuid->ops block-uuid {:remove op})
                    t+block-uuid-sorted-set*
                    (update-t+block-uuid-sorted-set t+block-uuid-sorted-set
                                                    block-uuid->ops
                                                    block-uuid->ops*
                                                    block-uuid)]
                (recur block-uuid->ops* t+block-uuid-sorted-set* others))))
          :update-page
          (let [already-removed? (some-> (get exist-ops :remove-page) second (> t))]
            (if already-removed?
              (recur block-uuid->ops t+block-uuid-sorted-set others)
              (let [block-uuid->ops* (-> block-uuid->ops
                                         (assoc-in [block-uuid :update-page] op)
                                         (update block-uuid dissoc :remove-page))
                    t+block-uuid-sorted-set*
                    (update-t+block-uuid-sorted-set t+block-uuid-sorted-set
                                                    block-uuid->ops
                                                    block-uuid->ops*
                                                    block-uuid)]
                (recur block-uuid->ops* t+block-uuid-sorted-set* others))))
          :remove-page
          (let [add-after-remove? (some-> (get exist-ops :update-page) second (> t))]
            (if add-after-remove?
              (recur block-uuid->ops t+block-uuid-sorted-set others)
              (let [block-uuid->ops* (assoc block-uuid->ops block-uuid {:remove-page op})
                    t+block-uuid-sorted-set*
                    (update-t+block-uuid-sorted-set t+block-uuid-sorted-set
                                                    block-uuid->ops
                                                    block-uuid->ops*
                                                    block-uuid)]
                (recur block-uuid->ops* t+block-uuid-sorted-set* others)))))))))

(def ^:private sorted-set-by-t (sorted-set-by (fn [[t1 x] [t2 y]]
                                                (let [r (compare t1 t2)]
                                                  (if (not= r 0)
                                                    r
                                                    (compare x y))))))

(def ^:private empty-ops-store-value {:current-branch {:block-uuid->ops {}
                                                       :asset-uuid->ops {}
                                                       :t+block-uuid-sorted-set sorted-set-by-t}})

(defn init-empty-ops-store!
  [repo]
  (swap! *ops-store assoc repo empty-ops-store-value))

(defn remove-ops-store!
  [repo]
  (swap! *ops-store dissoc repo))

(defn add-ops!
  [repo ops]
  (assert (contains? (@*ops-store repo) :current-branch) (@*ops-store repo))
  (let [ops (ops-coercer ops)
        {{old-branch-block-uuid->ops :block-uuid->ops
          old-t+block-uuid-sorted-set :t+block-uuid-sorted-set
          :as old-branch} :old-branch
         {:keys [block-uuid->ops t+block-uuid-sorted-set]} :current-branch}
        (get @*ops-store repo)
        {:keys [block-uuid->ops t+block-uuid-sorted-set]}
        (add-ops-aux ops block-uuid->ops t+block-uuid-sorted-set)
        {old-branch-block-uuid->ops :block-uuid->ops old-t+block-uuid-sorted-set :t+block-uuid-sorted-set}
        (when old-branch
          (add-ops-aux ops old-branch-block-uuid->ops old-t+block-uuid-sorted-set))]
    (swap! *ops-store update repo
           (fn [{:keys [current-branch old-branch]}]
             (cond-> {:current-branch
                      (assoc current-branch
                             :block-uuid->ops block-uuid->ops
                             :t+block-uuid-sorted-set t+block-uuid-sorted-set)}
               old-branch
               (assoc :old-branch
                      (assoc old-branch
                             :block-uuid->ops old-branch-block-uuid->ops
                             :t+block-uuid-sorted-set old-t+block-uuid-sorted-set)))))))

(defn update-local-tx!
  [repo t]
  (assert (contains? (@*ops-store repo) :current-branch))
  (swap! *ops-store update-in [repo :current-branch] assoc :local-tx t))

(defn update-graph-uuid!
  [repo graph-uuid]
  (assert (contains? (@*ops-store repo) :current-branch))
  (swap! *ops-store update repo
         (fn [{:keys [current-branch old-branch]}]
           (cond-> {:current-branch (assoc current-branch :graph-uuid graph-uuid)}
             old-branch (assoc :old-branch (assoc old-branch :graph-uuid graph-uuid))))))

(defn new-branch!
  "Make a copy of current repo-ops-store, and also store in `*ops-store`.
  The following `add-ops` apply on both old-branch and new-branch(current).
  use `rollback` to replace current-branch with old-branch.
  use `commit` to remove old-branch."
  [repo]
  (let [{:keys [current-branch]} (get @*ops-store repo)]
    (assert (some? current-branch) repo)
    (swap! *ops-store assoc-in [repo :old-branch] current-branch)))

(defn rollback!
  [repo]
  (when-let [old-branch (get-in @*ops-store [repo :old-branch])]
    (assert (some? old-branch))
    (swap! *ops-store assoc repo {:current-branch old-branch})))

(defn commit!
  [repo]
  (swap! *ops-store update repo dissoc :old-branch))

(defn get-min-t-block-ops
  [repo]
  (let [repo-ops-store (get @*ops-store repo)
        {:keys [t+block-uuid-sorted-set block-uuid->ops]} (:current-branch repo-ops-store)]
    (assert (contains? repo-ops-store :current-branch) repo)
    (when-let [[t block-uuid] (first t+block-uuid-sorted-set)]
      (if (contains? block-uuid->ops block-uuid)
        {:block-uuid block-uuid
         :ops (block-uuid->ops block-uuid)}

        (throw (ex-info "unavailable" {:t t :block-uuid block-uuid :block-uuid->ops block-uuid->ops}))
        ;; if not found, remove item in :t+block-uuid-sorted-set and retry
        ;; (do (swap! *ops-store update-in [repo :current-branch] assoc
        ;;            :t+block-uuid-sorted-set (disj t+block-uuid-sorted-set [t block-uuid]))
        ;;     (get-min-t-block-ops repo))
        ))))

(defn get-block-ops
  [repo block-uuid]
  (let [repo-ops-store (get @*ops-store repo)
        {:keys [block-uuid->ops]} (:current-branch repo-ops-store)]
    (assert (contains? repo-ops-store :current-branch) repo)
    (block-uuid->ops block-uuid)))

(defn get-all-ops
  [repo]
  (some->> (get @*ops-store repo)
           :current-branch
           :block-uuid->ops
           vals
           (mapcat vals)))

(defn get-local-tx
  [repo]
  (some-> (get @*ops-store repo)
          :current-branch
          :local-tx))

(defn get-unpushed-block-update-count
  [repo]
  (or
   (some-> (get @*ops-store repo)
           :current-branch
           :block-uuid->ops
           keys
           count)
   0))

(comment
  (defn get-unpushed-asset-update-count
    [repo]
    (some-> (get @*ops-store repo)
            :current-branch
            :asset-uuid->ops
            keys
            count)))

(defn intersection-block-uuids
  [repo block-uuid-coll]
  (some->> (get @*ops-store repo)
           :current-branch
           :block-uuid->ops
           keys
           set
           (set/intersection (set block-uuid-coll))))

(defn remove-block-ops!
  [repo block-uuid]
  {:pre [(uuid? block-uuid)]}
  (let [repo-ops-store (get @*ops-store repo)
        {:keys [t+block-uuid-sorted-set block-uuid->ops]} (:current-branch repo-ops-store)]
    (assert (contains? repo-ops-store :current-branch) repo)
    (let [min-t (block-uuid->min-t block-uuid->ops block-uuid)]
      (swap! *ops-store update-in [repo :current-branch] assoc
             :block-uuid->ops (dissoc block-uuid->ops block-uuid)
             :t+block-uuid-sorted-set (disj t+block-uuid-sorted-set [min-t block-uuid])))))


(defn <init-load-from-indexeddb2!
  [repo]
  (p/let [v (op-idb-layer/<read2 repo)]
    (when v
      (let [v (assoc v
                     :t+block-uuid-sorted-set
                     (apply conj sorted-set-by-t (:t+block-uuid-sorted-set v)))]
        (swap! *ops-store assoc repo {:current-branch v})
        (prn ::<init-load-from-indexeddb! repo)))))

(defn new-task--sync-to-idb
  [repo]
  (m/sp
    (when-let [v (:current-branch (@*ops-store repo))]
      (m/? (c.m/await-promise (op-idb-layer/<reset2! repo v))))))

(defn- new-task--sync-to-idb-loop
  []
  (m/sp
    (let [*v-hash (atom nil)]
      (loop []
        (m/? (m/sleep 3000))
        (let [repo (worker-state/get-current-repo)
              conn (worker-state/get-datascript-conn repo)]
          (when (and repo conn
                     (ldb/db-based-graph? @conn))
            (when-let [v (:current-branch (@*ops-store repo))]
              (let [v-hash (hash v)]
                (when (not= v-hash @*v-hash)
                  (m/? (c.m/await-promise (op-idb-layer/<reset2! repo v)))
                  (reset! *v-hash v-hash))))))
        (recur)))))

#_:clj-kondo/ignore
(defonce _sync-loop-canceler (c.m/run-task (new-task--sync-to-idb-loop) ::sync-to-idb-loop))

(defn rtc-db-graph?
  "Is db-graph & RTC enabled"
  [repo]
  (and (sqlite-util/db-based-graph? repo)
       (or (exists? js/process)
           (some? (get-local-tx repo)))))
