(ns frontend.worker.rtc.op-mem-layer
  "Store client-ops in memory.
  And sync these ops to indexedDb automatically."
  (:require [clojure.core.async :as async :refer [<! go-loop timeout]]
            [clojure.set :as set]
            [frontend.worker.rtc.op-idb-layer :as op-idb-layer]
            [frontend.worker.state :as state]
            [malli.core :as m]
            [malli.transform :as mt]
            [promesa.core :as p]
            [logseq.db.sqlite.util :as sqlite-util]))

(def op-schema
  [:multi {:dispatch first}
   ["move"
    [:catn
     [:op :string]
     [:value [:map
              [:block-uuid :uuid]
              [:epoch :int]]]]]
   ["remove"
    [:catn
     [:op :string]
     [:value [:map
              [:block-uuid :uuid]
              [:epoch :int]]]]]
   ["update"
    [:catn
     [:op :string]
     [:value [:map
              [:block-uuid :uuid]
              [:updated-attrs {:optional true}
               [:map {:closed true}
                [:schema {:optional true} :nil]
                [:content {:optional true} :nil]
                [:link {:optional true} :nil]
                [:alias {:optional true} [:map
                                          [:add {:optional true} [:set :uuid]]
                                          [:retract {:optional true} [:set :uuid]]]]
                [:type {:optional true} [:map
                                         [:add {:optional true} [:set :string]]
                                         [:retract {:optional true} [:set :string]]]]
                [:tags {:optional true} [:map
                                         [:add {:optional true} [:set :uuid]]
                                         [:retract {:optional true} [:set :uuid]]]]
                [:properties {:optional true} [:map
                                               [:add {:optional true} [:set :uuid]]
                                               [:retract {:optional true} [:set :uuid]]]]]]
              [:epoch :int]]]]]
   ["update-page"
    [:catn
     [:op :string]
     [:value [:map
              [:block-uuid :uuid]
              [:epoch :int]]]]]
   ["remove-page"
    [:catn
     [:op :string]
     [:value [:map
              [:block-uuid :uuid]
              [:epoch :int]]]]]
   ["update-asset"
    [:catn
     [:op :string]
     [:value [:map
              [:asset-uuid :uuid]
              [:epoch :int]]]]]
   ["remove-asset"
    [:catn
     [:op :string]
     [:value [:map
              [:asset-uuid :uuid]
              [:epoch :int]]]]]])

(def ops-schema [:sequential op-schema])

(def ops-from-store-schema [:sequential [:catn
                                         [:key :int]
                                         [:op op-schema]]])

(def ops-from-store-coercer (m/coercer ops-from-store-schema mt/json-transformer))
(def ops-validator (m/validator ops-schema))
(def ops-coercer (m/coercer ops-schema mt/json-transformer))
(def ops-encoder (m/encoder ops-schema mt/json-transformer))


(def ops-store-value-schema
  [:map
   [:graph-uuid {:optional true} :string]
   [:local-tx {:optional true} :int]
   [:block-uuid->ops [:map-of :uuid
                      [:map-of [:enum :move :remove :update :update-page :remove-page] :any]]]
   [:asset-uuid->ops [:map-of :uuid
                      [:map-of [:enum :update-asset :remove-asset] :any]]]
   [:epoch->block-uuid-sorted-map [:map-of :int :uuid]]
   [:epoch->asset-uuid-sorted-map [:map-of :int :uuid]]])

(def ops-store-schema
  [:map-of :string                      ; repo-name
   [:map
    [:current-branch ops-store-value-schema]
    [:old-branch {:optional true} [:maybe ops-store-value-schema]]]])

(def ops-store-schema-coercer (m/coercer ops-store-schema))


(defonce ^:private *ops-store (atom {} :validator ops-store-schema-coercer))

(defn- merge-add-retract-maps
  [m1 m2]
  (let [{add1 :add retract1 :retract} m1
        {add2 :add retract2 :retract} m2
        add (set/union (set/difference add1 retract2) add2)
        retract (set/union (set/difference retract1 add2) retract2)]
    (when (or (seq add) (seq retract))
      (cond-> {}
        (seq add) (assoc :add add)
        (seq retract) (assoc :retract retract)))))

(defn- merge-update-ops
  "op2-epoch > op1-epoch"
  [update-op1 update-op2]
  {:pre [(= "update" (first update-op1))
         (= "update" (first update-op2))
         (= (:block-uuid (second update-op1))
            (:block-uuid (second update-op2)))]}
  (let [epoch1 (:epoch (second update-op1))
        epoch2 (:epoch (second update-op2))]
    (if (> epoch1 epoch2)
      (merge-update-ops update-op2 update-op1)
      (let [updated-attrs1 (:updated-attrs (second update-op1))
            updated-attrs2 (:updated-attrs (second update-op2))
            alias (merge-add-retract-maps (:alias updated-attrs1) (:alias updated-attrs2))
            type (merge-add-retract-maps (:type updated-attrs1) (:type updated-attrs2))
            tags (merge-add-retract-maps (:tags updated-attrs1) (:tags updated-attrs2))
            properties (merge-add-retract-maps (:properties updated-attrs1) (:properties updated-attrs2))
            updated-attrs
            (cond-> (merge (select-keys updated-attrs1 [:schema :content :link])
                           (select-keys updated-attrs2 [:schema :content :link]))
              alias (assoc :alias alias)
              type (assoc :type type)
              tags (assoc :tags tags)
              properties (assoc :properties properties))]

        ["update" {:block-uuid (:block-uuid (second update-op1))
                   :updated-attrs updated-attrs
                   :epoch epoch2}]))))

(defn- block-uuid->min-epoch
  [block-uuid->ops block-uuid]
  (some->> (block-uuid->ops block-uuid)
           vals
           (map (comp :epoch second))
           seq
           (apply min)))

(defn- asset-uuid->min-epoch
  [asset-uuid->ops asset-uuid]
  (block-uuid->min-epoch asset-uuid->ops asset-uuid))

(defn ^:large-vars/cleanup-todo add-ops-aux
  [ops block-uuid->ops epoch->block-uuid-sorted-map asset-uuid->ops epoch->asset-uuid-sorted-map]
  (loop [block-uuid->ops block-uuid->ops
         epoch->block-uuid-sorted-map epoch->block-uuid-sorted-map
         asset-uuid->ops asset-uuid->ops
         epoch->asset-uuid-sorted-map epoch->asset-uuid-sorted-map
         [op & others] ops]
    (if-not op
      {:block-uuid->ops block-uuid->ops
       :asset-uuid->ops asset-uuid->ops
       :epoch->block-uuid-sorted-map epoch->block-uuid-sorted-map
       :epoch->asset-uuid-sorted-map epoch->asset-uuid-sorted-map}
      (let [[op-type value] op
            {:keys [block-uuid asset-uuid epoch]} value
            exist-ops (some-> block-uuid block-uuid->ops)
            exist-asset-ops (some-> asset-uuid asset-uuid->ops)]
        (case op-type
          "move"
          (let [already-removed? (some-> (get exist-ops :remove) second :epoch (> epoch))]
            (if already-removed?
              (recur block-uuid->ops epoch->block-uuid-sorted-map
                     asset-uuid->ops epoch->asset-uuid-sorted-map others)
              (let [block-uuid->ops* (-> block-uuid->ops
                                         (assoc-in [block-uuid :move] op)
                                         (update block-uuid dissoc :remove))
                    origin-min-epoch (block-uuid->min-epoch block-uuid->ops block-uuid)
                    min-epoch (block-uuid->min-epoch block-uuid->ops* block-uuid)]
                (recur (-> block-uuid->ops
                           (assoc-in [block-uuid :move] op)
                           (update block-uuid dissoc :remove))
                       (-> epoch->block-uuid-sorted-map
                           (dissoc origin-min-epoch)
                           (assoc min-epoch block-uuid))
                       asset-uuid->ops epoch->asset-uuid-sorted-map others))))
          "update"
          (let [already-removed? (some-> (get exist-ops :remove) second :epoch (> epoch))]
            (if already-removed?
              (recur block-uuid->ops epoch->block-uuid-sorted-map
                     asset-uuid->ops epoch->asset-uuid-sorted-map others)
              (let [origin-update-op (get-in block-uuid->ops [block-uuid :update])
                    op* (if origin-update-op (merge-update-ops origin-update-op op) op)
                    block-uuid->ops* (-> block-uuid->ops
                                         (assoc-in [block-uuid :update] op*)
                                         (update block-uuid dissoc :remove))
                    origin-min-epoch (block-uuid->min-epoch block-uuid->ops block-uuid)
                    min-epoch (block-uuid->min-epoch block-uuid->ops* block-uuid)]
                (recur block-uuid->ops*
                       (-> epoch->block-uuid-sorted-map
                           (dissoc origin-min-epoch)
                           (assoc min-epoch block-uuid))
                       asset-uuid->ops epoch->asset-uuid-sorted-map others))))
          "remove"
          (let [add-after-remove? (some-> (get exist-ops :move) second :epoch (> epoch))]
            (if add-after-remove?
              (recur block-uuid->ops epoch->block-uuid-sorted-map
                     asset-uuid->ops epoch->asset-uuid-sorted-map others)
              (let [block-uuid->ops* (assoc block-uuid->ops block-uuid {:remove op})
                    origin-min-epoch (block-uuid->min-epoch block-uuid->ops block-uuid)
                    min-epoch (block-uuid->min-epoch block-uuid->ops* block-uuid)]
                (recur block-uuid->ops*
                       (-> epoch->block-uuid-sorted-map
                           (dissoc origin-min-epoch)
                           (assoc min-epoch block-uuid))
                       asset-uuid->ops epoch->asset-uuid-sorted-map others))))
          "update-page"
          (let [already-removed? (some-> (get exist-ops :remove-page) second :epoch (> epoch))]
            (if already-removed?
              (recur block-uuid->ops epoch->block-uuid-sorted-map
                     asset-uuid->ops epoch->asset-uuid-sorted-map others)
              (let [block-uuid->ops* (-> block-uuid->ops
                                         (assoc-in [block-uuid :update-page] op)
                                         (update block-uuid dissoc :remove-page))
                    origin-min-epoch (block-uuid->min-epoch block-uuid->ops block-uuid)
                    min-epoch (block-uuid->min-epoch block-uuid->ops* block-uuid)]
                (recur block-uuid->ops*
                       (-> epoch->block-uuid-sorted-map
                           (dissoc origin-min-epoch)
                           (assoc min-epoch block-uuid))
                       asset-uuid->ops epoch->asset-uuid-sorted-map others))))
          "remove-page"
          (let [add-after-remove? (some-> (get exist-ops :update-page) second :epoch (> epoch))]
            (if add-after-remove?
              (recur block-uuid->ops epoch->block-uuid-sorted-map
                     asset-uuid->ops epoch->asset-uuid-sorted-map others)
              (let [block-uuid->ops* (assoc block-uuid->ops block-uuid {:remove-page op})
                    origin-min-epoch (block-uuid->min-epoch block-uuid->ops block-uuid)
                    min-epoch (block-uuid->min-epoch block-uuid->ops* block-uuid)]
                (recur block-uuid->ops*
                       (-> epoch->block-uuid-sorted-map
                           (dissoc origin-min-epoch)
                           (assoc min-epoch block-uuid))
                       asset-uuid->ops epoch->asset-uuid-sorted-map others))))
          "update-asset"
          (let [already-removed? (some-> (get exist-asset-ops :remove-asset) second :epoch (> epoch))]
            (if already-removed?
              (recur block-uuid->ops epoch->block-uuid-sorted-map
                     asset-uuid->ops epoch->asset-uuid-sorted-map others)
              (let [asset-uuid->ops* (assoc asset-uuid->ops asset-uuid {:update-asset op})
                    origin-min-epoch (asset-uuid->min-epoch asset-uuid->ops asset-uuid)
                    min-epoch (asset-uuid->min-epoch asset-uuid->ops* asset-uuid)]
                (recur block-uuid->ops epoch->block-uuid-sorted-map
                       asset-uuid->ops*
                       (-> epoch->asset-uuid-sorted-map
                           (dissoc origin-min-epoch)
                           (assoc min-epoch asset-uuid))
                       others))))
          "remove-asset"
          (let [add-after-remove? (some-> (get exist-asset-ops :update-asset) second :epoch (> epoch))]
            (if add-after-remove?
              (recur block-uuid->ops epoch->block-uuid-sorted-map
                     asset-uuid->ops epoch->asset-uuid-sorted-map others)
              (let [asset-uuid->ops* (assoc asset-uuid->ops asset-uuid {:remove-asset op})
                    origin-min-epoch (asset-uuid->min-epoch asset-uuid->ops asset-uuid)
                    min-epoch (asset-uuid->min-epoch asset-uuid->ops* asset-uuid)]
                (recur block-uuid->ops epoch->block-uuid-sorted-map
                       asset-uuid->ops*
                       (-> epoch->asset-uuid-sorted-map
                           (dissoc origin-min-epoch)
                           (assoc min-epoch asset-uuid))
                       others))))
          )))))


(def empty-ops-store-value {:current-branch {:block-uuid->ops {}
                                             :epoch->block-uuid-sorted-map (sorted-map-by <)
                                             :asset-uuid->ops {}
                                             :epoch->asset-uuid-sorted-map (sorted-map-by <)}})

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
          old-epoch->block-uuid-sorted-map :epoch->block-uuid-sorted-map
          old-branch-asset-uuid->ops :asset-uuid->ops
          old-epoch->asset-uuid-sorted-map :epoch->asset-uuid-sorted-map
          :as old-branch} :old-branch
         {:keys [block-uuid->ops epoch->block-uuid-sorted-map
                 asset-uuid->ops epoch->asset-uuid-sorted-map]} :current-branch}
        (get @*ops-store repo)
        {:keys [block-uuid->ops epoch->block-uuid-sorted-map]}
        (add-ops-aux ops block-uuid->ops epoch->block-uuid-sorted-map
                                    asset-uuid->ops epoch->asset-uuid-sorted-map)
        {old-branch-block-uuid->ops :block-uuid->ops old-epoch->block-uuid-sorted-map :epoch->block-uuid-sorted-map}
        (when old-branch
          (add-ops-aux ops old-branch-block-uuid->ops old-epoch->block-uuid-sorted-map
                                      old-branch-asset-uuid->ops old-epoch->asset-uuid-sorted-map))]
    (swap! *ops-store update repo
           (fn [{:keys [current-branch old-branch]}]
             (cond-> {:current-branch
                      (assoc current-branch
                             :block-uuid->ops block-uuid->ops
                             :epoch->block-uuid-sorted-map epoch->block-uuid-sorted-map)}
               old-branch
               (assoc :old-branch
                      (assoc old-branch
                             :block-uuid->ops old-branch-block-uuid->ops
                             :epoch->block-uuid-sorted-map old-epoch->block-uuid-sorted-map)))))))

(defn add-asset-ops!
  [repo ops]
  (assert (contains? (@*ops-store repo) :current-branch) (@*ops-store repo))
  (let [ops (ops-coercer ops)
        {{old-branch-block-uuid->ops :block-uuid->ops
          old-epoch->block-uuid-sorted-map :epoch->block-uuid-sorted-map
          old-branch-asset-uuid->ops :asset-uuid->ops
          old-epoch->asset-uuid-sorted-map :epoch->asset-uuid-sorted-map
          :as old-branch} :old-branch
         {:keys [block-uuid->ops epoch->block-uuid-sorted-map
                 asset-uuid->ops epoch->asset-uuid-sorted-map]} :current-branch}
        (get @*ops-store repo)
        {:keys [asset-uuid->ops epoch->asset-uuid-sorted-map]}
        (add-ops-aux ops block-uuid->ops epoch->block-uuid-sorted-map
                     asset-uuid->ops epoch->asset-uuid-sorted-map)
        {old-branch-asset-uuid->ops :asset-uuid->ops old-epoch->asset-uuid-sorted-map :epoch->asset-uuid-sorted-map}
        (when old-branch
          (add-ops-aux ops old-branch-block-uuid->ops old-epoch->block-uuid-sorted-map
                       old-branch-asset-uuid->ops old-epoch->asset-uuid-sorted-map))]
    (swap! *ops-store update repo
           (fn [{:keys [current-branch old-branch]}]
             (cond-> {:current-branch
                      (assoc current-branch
                             :asset-uuid->ops asset-uuid->ops
                             :epoch->asset-uuid-sorted-map epoch->asset-uuid-sorted-map)}
               old-branch
               (assoc :old-branch
                      (assoc old-branch
                             :asset-uuid->ops old-branch-asset-uuid->ops
                             :epoch->asset-uuid-sorted-map old-epoch->asset-uuid-sorted-map)))))))

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


(defn get-min-epoch-block-ops
  [repo]
  (let [repo-ops-store (get @*ops-store repo)
        {:keys [epoch->block-uuid-sorted-map block-uuid->ops]} (:current-branch repo-ops-store)]
    (assert (contains? repo-ops-store :current-branch) repo)
    (when-let [[_epoch block-uuid] (first epoch->block-uuid-sorted-map)]
      (assert (contains? block-uuid->ops block-uuid))
      {:block-uuid block-uuid
       :ops (block-uuid->ops block-uuid)})))

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

(defn get-graph-uuid
  [repo]
  (some-> (get @*ops-store repo)
          :current-branch
          :graph-uuid))

(defn get-local-tx
  [repo]
  (some-> (get @*ops-store repo)
          :current-branch
          :local-tx))

(defn get-unpushed-block-update-count
  [repo]
  (some-> (get @*ops-store repo)
          :current-branch
          :block-uuid->ops
          keys
          count))

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
        {:keys [epoch->block-uuid-sorted-map block-uuid->ops]} (:current-branch repo-ops-store)]
    (assert (contains? repo-ops-store :current-branch) repo)
    (let [min-epoch (block-uuid->min-epoch block-uuid->ops block-uuid)]
      (swap! *ops-store update-in [repo :current-branch] assoc
             :block-uuid->ops (dissoc block-uuid->ops block-uuid)
             :epoch->block-uuid-sorted-map (dissoc epoch->block-uuid-sorted-map min-epoch)))))

(comment
  (defn remove-asset-ops!
   [repo asset-uuid]
   {:pre [(uuid? asset-uuid)]}
   (let [repo-ops-store (get @*ops-store repo)
         {:keys [epoch->asset-uuid-sorted-map asset-uuid->ops]} (:current-branch repo-ops-store)]
     (assert (contains? repo-ops-store :current-branch) repo)
     (let [min-epoch (asset-uuid->min-epoch asset-uuid->ops asset-uuid)]
       (swap! *ops-store update-in [repo :current-branch] assoc
              :asset-uuid->ops (dissoc asset-uuid->ops asset-uuid)
              :epoch->asset-uuid-sorted-map (dissoc epoch->asset-uuid-sorted-map min-epoch))))))


(defn <init-load-from-indexeddb!
  [repo]
  (p/let [all-data (op-idb-layer/<read repo)
          all-data-m (into {} all-data)
          local-tx (get all-data-m "local-tx")]
    (when local-tx
      (let [graph-uuid (get all-data-m "graph-uuid")
            ops (->> all-data
                     (filter (comp number? first))
                     (sort-by first <)
                     ops-from-store-coercer
                     (map second))
            {:keys [block-uuid->ops epoch->block-uuid-sorted-map asset-uuid->ops epoch->asset-uuid-sorted-map]}
            (add-ops-aux ops {} (sorted-map-by <) {} (sorted-map-by <))
            r (cond-> {:block-uuid->ops block-uuid->ops
                       :epoch->block-uuid-sorted-map epoch->block-uuid-sorted-map
                       :asset-uuid->ops asset-uuid->ops
                       :epoch->asset-uuid-sorted-map epoch->asset-uuid-sorted-map}
                graph-uuid (assoc :graph-uuid graph-uuid)
                local-tx (assoc :local-tx local-tx))]
        (assert (ops-validator ops) ops)
        (swap! *ops-store update repo #(-> %
                                           (assoc :current-branch r)
                                           (dissoc :old-branch)))
        (prn ::<init-load-from-indexeddb! repo)))))

(defn <sync-to-idb-layer!
  [repo]
  (let [repo-ops-store (get @*ops-store repo)
        {:keys [block-uuid->ops local-tx graph-uuid]} (:current-branch repo-ops-store)
        ops (mapcat vals (vals block-uuid->ops))
        ops* (ops-encoder ops)]
    (op-idb-layer/<reset! repo ops* graph-uuid local-tx)))

(defn run-sync-loop
  []
  (go-loop []
    (<! (timeout 3000))
    (when-let [repo (state/get-current-repo)]
      (when (and (sqlite-util/db-based-graph? repo)
                 (contains? (@*ops-store repo) :current-branch))
        (<! (<sync-to-idb-layer! repo))))
    (recur)))

#_:clj-kondo/ignore
(defonce _sync-loop (run-sync-loop))


(defn rtc-db-graph?
  "Is db-graph & RTC enabled"
  [repo]
  (and (sqlite-util/db-based-graph? repo)
       (some? (get-local-tx repo))))
