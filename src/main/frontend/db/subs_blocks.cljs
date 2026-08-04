(ns frontend.db.subs-blocks
  "Block slot hydration and renderer delta application."
  (:require [clojure.set :as set]
            [frontend.db.subs-slots :refer [block-changed?
                     ready-block-slot
                     ready-children-slot
                     ready-resource-slot
                     require-block!
                     require-revision!
                     require-uuid!
                     slot-revision
                     tombstone-slot]]))

(defn- mounted?
  [context slot-type key]
  (seq (get-in @(:listeners context) [slot-type key])))

(defn- listeners-for
  [context slot-type key]
  (vals (get-in @(:listeners context) [slot-type key])))

(defn- notify-key!
  [context slot-type key]
  (doseq [listener (listeners-for context slot-type key)]
    (listener)))

(defn- notify-keys!
  [context slot-type keys]
  (doseq [key keys]
    (notify-key! context slot-type key)))

(defn- commit-transition!
  [context transition]
  (let [result (volatile! nil)]
    (swap! (:store context)
           (fn [store]
             (let [next (transition store)]
               (vreset! result next)
               (first next))))
    @result))

(defn- loaded-block-slot
  [block-uuid basis-rev current block]
  (let [block (require-block! block-uuid block)]
    (cond
      (and (= :tombstone (:kind current))
           (> (:rev current) basis-rev))
      current

      (and (= :ready (:kind current))
           (not (block-changed? (get-in current [:snapshot :value]) block)))
      current

      :else
      (ready-block-slot basis-rev block))))

(defn- current-load?
  [store generation basis-rev slot-type key]
  (and (= generation (:generation store))
       (>= basis-rev (slot-revision (get-in store [slot-type key])))))

(defn- apply-block-load*
  [context generation block-uuid {:keys [basis-rev blocks]}]
  (require-revision! :basis-rev basis-rev)
  (let [[_ {:keys [changed-blocks]}]
        (commit-transition!
         context
         (fn [store]
           (if-not (current-load? store generation basis-rev :blocks block-uuid)
             [store {:changed-blocks #{}}]
             (let [[store changed-blocks]
                   (reduce-kv
                    (fn [[store changed-blocks] loaded-uuid block]
                      (let [current (get-in store [:blocks loaded-uuid])
                            next-slot (loaded-block-slot loaded-uuid basis-rev
                                                         current block)]
                        (if (identical? current next-slot)
                          [store changed-blocks]
                          [(assoc-in store [:blocks loaded-uuid] next-slot)
                           (conj changed-blocks loaded-uuid)])))
                    [store #{}]
                    blocks)
                   [store changed-blocks]
                   (if (contains? blocks block-uuid)
                     [store changed-blocks]
                     (let [current (get-in store [:blocks block-uuid])
                           next-slot (if (and (= :tombstone (:kind current))
                                              (>= (:rev current) basis-rev))
                                       current
                                       (tombstone-slot basis-rev))]
                       (if (identical? current next-slot)
                         [store changed-blocks]
                         [(assoc-in store [:blocks block-uuid] next-slot)
                          (conj changed-blocks block-uuid)])))]
               [store {:changed-blocks changed-blocks}]))))]
    (notify-keys! context :blocks changed-blocks)))

(defn- require-child-items!
  [parent-uuid items]
  (->> items
       (map (fn [[child-uuid order :as item]]
              (when-not (= 2 (count item))
                (throw (ex-info "Invalid direct-child item"
                                {:parent-uuid parent-uuid :item item})))
              (require-uuid! :block/uuid child-uuid)
              (when-not (string? order)
                (throw (ex-info "Invalid direct-child order"
                                {:parent-uuid parent-uuid
                                 :block-uuid child-uuid
                                 :block-order order})))
              [child-uuid order]))
       (sort-by second)
       vec))

(defn resource-dependencies
  [resource-key value]
  (case (first resource-key)
    :journal-bundle
    {:bundles {(second resource-key) value}}

    :journals
    {:bundles (:bundles value)}

    :journal-window
    {:bundles (:bundles value)}

    :view-data
    {:initial-blocks (:initial-blocks value)}

    {}))

(defn- require-block-bundle!
  [root-uuid value]
  (when-not (and (map? value)
                 (= #{:root-uuid :blocks :children} (set (keys value))))
    (throw (ex-info "Invalid block bundle value"
                    {:root-uuid root-uuid})))
  (require-uuid! :root-uuid root-uuid)
  (let [{bundle-root-uuid :root-uuid :keys [blocks children]} value]
    (when-not (= root-uuid bundle-root-uuid)
      (throw (ex-info "Block bundle root does not match"
                      {:root-uuid root-uuid
                       :bundle-root-uuid bundle-root-uuid})))
    (when-not (map? blocks)
      (throw (ex-info "Invalid block bundle blocks"
                      {:root-uuid root-uuid})))
    (when-not (map? children)
      (throw (ex-info "Invalid block bundle children"
                      {:root-uuid root-uuid})))
    (when-not (and (contains? blocks root-uuid)
                   (set/subset? (set (keys children)) (set (keys blocks))))
      (throw (ex-info "Block bundle memberships require canonical blocks"
                      {:root-uuid root-uuid})))
    (let [blocks (into {}
                       (map (fn [[block-uuid block]]
                              [block-uuid (require-block! block-uuid block)]))
                       blocks)
          block-uuids (set (keys blocks))
          children
          (into {}
                (map
                 (fn [[parent-uuid membership]]
                   (when-not (and (map? membership)
                                  (= #{:parent-tx-id :items}
                                     (set (keys membership))))
                     (throw (ex-info "Invalid block bundle membership"
                                     {:parent-uuid parent-uuid})))
                   (let [parent-tx-id
                         (require-revision! :block/tx-id
                                            (:parent-tx-id membership))
                         items (require-child-items! parent-uuid
                                                     (:items membership))]
                     (when-not (= parent-tx-id
                                  (get-in blocks [parent-uuid :block/tx-id]))
                       (throw (ex-info "Block bundle membership revision mismatch"
                                       {:parent-uuid parent-uuid
                                        :parent-tx-id parent-tx-id})))
                     (doseq [[child-uuid] items]
                       (when-not (contains? block-uuids child-uuid)
                         (throw (ex-info "Block bundle child has no canonical block"
                                         {:parent-uuid parent-uuid
                                          :block-uuid child-uuid}))))
                     [parent-uuid {:parent-tx-id parent-tx-id
                                   :items items}])))
                children)]
      {:root-uuid root-uuid
       :blocks blocks
       :children children})))

(declare apply-block-tree-load!)

(defn- apply-children-load*
  [context generation parent-uuid {:keys [blocks children] :as response}]
  (if (and blocks children)
    (apply-block-tree-load! context generation parent-uuid response)
    (let [{:keys [basis-rev parent-tx-id items]} response]
      (require-revision! :basis-rev basis-rev)
      (require-revision! :block/tx-id parent-tx-id)
      (let [items (require-child-items! parent-uuid items)
            next-slot (ready-children-slot basis-rev parent-tx-id items)
            [_ {:keys [changed?]}]
            (commit-transition!
             context
             (fn [store]
               (if-not (current-load? store generation basis-rev
                                       :children parent-uuid)
                 [store {:changed? false}]
                 (let [current (get-in store [:children parent-uuid])]
                   [(assoc-in store [:children parent-uuid] next-slot)
                    {:changed? (not= current next-slot)}]))))]
        (when changed?
          (notify-key! context :children parent-uuid))))))

(defn- bundle-has-newer-slot?
  [store basis-rev {:keys [blocks children]}]
  (or (some #(> (slot-revision (get-in store [:blocks %])) basis-rev)
            (keys blocks))
      (some #(> (slot-revision (get-in store [:children %])) basis-rev)
            (keys children))))

(def ^:private empty-delta-effects
  {:changed-blocks #{}
   :seeded-blocks #{}
   :changed-children #{}
   :seeded-children #{}
   :stale-children #{}
   :stale-resources #{}
   :changed-resources #{}
   :applied? false})

(defn- seed-block-bundle
  [store basis-rev {:keys [blocks children]} effects]
  (let [[store effects]
        (reduce-kv
         (fn [[store effects] block-uuid block]
           (let [current (get-in store [:blocks block-uuid])
                 next-slot (loaded-block-slot block-uuid basis-rev current block)]
             (if (identical? current next-slot)
               [store effects]
               [(assoc-in store [:blocks block-uuid] next-slot)
                (update effects :changed-blocks conj block-uuid)])))
         [store effects]
         blocks)]
    (reduce-kv
     (fn [[store effects] parent-uuid {:keys [parent-tx-id items]}]
       (let [current (get-in store [:children parent-uuid])
             next-slot (ready-children-slot basis-rev parent-tx-id items)]
         (if (= current next-slot)
           [store effects]
           [(assoc-in store [:children parent-uuid] next-slot)
            (update effects :changed-children conj parent-uuid)])))
     [store effects]
     children)))

(defn- apply-block-tree-load!
  [context generation parent-uuid {:keys [basis-rev parent-tx-id items blocks children]}]
  (require-revision! :basis-rev basis-rev)
  (let [bundle (require-block-bundle!
                parent-uuid
                {:root-uuid parent-uuid
                 :blocks blocks
                 :children children})
        root-membership (get children parent-uuid)]
    (when-not (= {:parent-tx-id parent-tx-id
                  :items (require-child-items! parent-uuid items)}
                 root-membership)
      (throw (ex-info "Block tree root membership does not match"
                      {:parent-uuid parent-uuid})))
    (let [[_ {:keys [changed-blocks changed-children]}]
          (commit-transition!
           context
           (fn [store]
             (if (or (not= generation (:generation store))
                     (bundle-has-newer-slot? store basis-rev bundle))
               [store empty-delta-effects]
               (seed-block-bundle store basis-rev bundle
                                  empty-delta-effects))))]
      (notify-keys! context :blocks changed-blocks)
      (notify-keys! context :children changed-children))))

(defn- normalize-resource-value
  [resource-key value]
  (let [kind (first resource-key)
        {:keys [bundles initial-blocks]}
        (resource-dependencies resource-key value)
        bundles (into {}
                      (map (fn [[root-uuid bundle]]
                             [root-uuid
                              (require-block-bundle! root-uuid bundle)]))
                      bundles)
        initial-blocks (into {}
                             (map (fn [[block-uuid block]]
                                    [block-uuid
                                     (require-block! block-uuid block)]))
                             initial-blocks)]
    {:bundles bundles
     :initial-blocks initial-blocks
     :value (cond
              (= :journal-bundle kind)
              (get bundles (second resource-key))

              (contains? #{:journals :journal-window} kind)
              (assoc value :bundles bundles)

              (and (= :view-data kind)
                   (contains? value :initial-blocks))
              (assoc value :initial-blocks initial-blocks)

              :else
              value)}))

(defn- apply-resource-load*
  [context generation resource-key {:keys [basis-rev key watch-keys value]}]
  (require-revision! :basis-rev basis-rev)
  (when-not (= resource-key key)
    (throw (ex-info "Resource key does not match its subscription key"
                    {:resource-key resource-key :response-key key})))
  (when-not (set? watch-keys)
    (throw (ex-info "Invalid resource watch keys"
                    {:resource-key resource-key :watch-keys watch-keys})))
  (let [{:keys [bundles initial-blocks value]}
        (normalize-resource-value resource-key value)
        next-slot (ready-resource-slot basis-rev watch-keys value)
        [_ {:keys [reload? changed-resource? changed-blocks changed-children]}]
        (commit-transition!
         context
         (fn [store]
             (let [current (get-in store [:resources resource-key])
                   stale? (or (not= generation (:generation store))
                              (< basis-rev (:rev store))
                              (< basis-rev (slot-revision current))
                              (some #(bundle-has-newer-slot? store basis-rev %)
                                    (vals bundles))
                              (some #(> (slot-revision (get-in store [:blocks %]))
                                        basis-rev)
                                    (keys initial-blocks)))]
               (if stale?
                 [store (assoc empty-delta-effects
                               :reload? (= generation (:generation store)))]
                 (let [effects (cond-> empty-delta-effects
                                 (not= current next-slot)
                                 (assoc :changed-resource? true))
                       [store effects]
                       (reduce (fn [[store effects] bundle]
                                 (seed-block-bundle store basis-rev bundle effects))
                               [(if (= current next-slot)
                                  store
                                  (assoc-in store [:resources resource-key]
                                            next-slot))
                                effects]
                               (vals bundles))]
                   (seed-block-bundle store basis-rev
                                      {:blocks initial-blocks :children {}}
                                      effects))))))]
    (when reload?
      ((:schedule-resource-reload! context) resource-key))
    (notify-keys! context :children changed-children)
    (notify-keys! context :blocks changed-blocks)
    (when changed-resource?
      (notify-key! context :resources resource-key))))

(defn- apply-block-replacement
  [context store block-uuid block seed-block-uuids effects]
  (let [block (require-block! block-uuid block)
        current (get-in store [:blocks block-uuid])
        mounted-block? (mounted? context :blocks block-uuid)
        seed? (contains? seed-block-uuids block-uuid)]
    (if (or (and (nil? current)
                 (not mounted-block?)
                 (not seed?))
            (> (slot-revision current) (:rev store))
            (and (= :ready (:kind current))
                 (not (block-changed? (get-in current [:snapshot :value]) block))))
      [store effects]
      [(assoc-in store [:blocks block-uuid]
                 (cond-> (ready-block-slot (:rev store) block)
                   (and seed? (not mounted-block?))
                   (assoc :seeded? true)))
       (cond-> (update effects :changed-blocks conj block-uuid)
         (and seed? (not mounted-block?))
         (update :seeded-blocks conj block-uuid))])))

(defn- inserted-child-uuids
  [children]
  (into #{}
        (mapcat (fn [[_parent-uuid patch]]
                  (map first (:upsert patch))))
        children))

(defn- remove-seeded-slots
  [slots context slot-type keys basis-rev]
  (reduce
   (fn [slots key]
     (let [slot (get slots key)]
       (if (and (not (mounted? context slot-type key))
                (:seeded? slot)
                (= basis-rev (:basis-rev slot)))
         (dissoc slots key)
         slots)))
   slots
   keys))

(defn- schedule-seeded-slots-gc!
  [context block-uuids parent-uuids basis-rev]
  ((:set-seeded-block-gc-timeout! context)
   #(swap! (:store context)
           (fn [store]
             (-> store
                 (update :blocks remove-seeded-slots context :blocks
                         block-uuids basis-rev)
                 (update :children remove-seeded-slots context :children
                         parent-uuids basis-rev))))
   2000))

(defn- apply-tombstone
  [context store delta-rev block-uuid tombstone effects]
  (require-uuid! :block/uuid block-uuid)
  (let [tombstone-rev (require-revision! :rev (:rev tombstone))
        current (get-in store [:blocks block-uuid])]
    (when-not (= delta-rev tombstone-rev)
      (throw (ex-info "Tombstone revision does not match delta"
                      {:delta-rev delta-rev
                       :block-uuid block-uuid
                       :tombstone-rev tombstone-rev})))
    (if (or (and (nil? current)
                 (not (mounted? context :blocks block-uuid)))
            (> (slot-revision current) delta-rev)
            (and (= :tombstone (:kind current))
                 (>= (:rev current) tombstone-rev)))
      [store effects]
      [(assoc-in store [:blocks block-uuid]
                 (tombstone-slot tombstone-rev))
       (update effects :changed-blocks conj block-uuid)])))

(defn- child-patch-items
  [parent-uuid items remove-items upsert-items]
  (let [remove-items (set (require-child-items! parent-uuid remove-items))
        upsert-items (require-child-items! parent-uuid upsert-items)
        upsert-uuids (set (map first upsert-items))]
    (->> items
         (remove (fn [[child-uuid :as item]]
                   (or (contains? remove-items item)
                       (contains? upsert-uuids child-uuid))))
         (concat upsert-items)
         (sort-by second)
         vec)))

(defn- apply-child-patch
  [context store parent-uuid {removed :remove patch-rev :rev :keys [base-rev upsert]}
   seed? parent-tx-id effects]
  (require-uuid! :block/uuid parent-uuid)
  (require-revision! :base-rev base-rev)
  (require-revision! :rev patch-rev)
  (when-not (= patch-rev (:rev store))
    (throw (ex-info "Child patch revision does not match delta"
                    {:parent-uuid parent-uuid
                     :delta-rev (:rev store)
                     :patch-rev patch-rev})))
  (let [current (get-in store [:children parent-uuid])]
    (cond
      (nil? current)
      (cond
      seed?
      (let [_ (require-revision! :block/tx-id parent-tx-id)
            items (child-patch-items parent-uuid [] removed upsert)]
          [(assoc-in store [:children parent-uuid]
                         (assoc (ready-children-slot patch-rev parent-tx-id items)
                                :seeded? true))
           (-> effects
               (update :changed-children conj parent-uuid)
               (update :seeded-children conj parent-uuid))])

      (mounted? context :children parent-uuid)
      [(assoc-in store [:children parent-uuid :stale-rev] (:rev store))
       (update effects :stale-children conj parent-uuid)]

      :else
      [store effects])

      (> (slot-revision current) (:rev store))
      [store effects]

      (= patch-rev (:basis-rev current))
      [store effects]

      (= base-rev (:basis-rev current))
      (let [items (child-patch-items parent-uuid (:items current) removed upsert)]
        [(assoc-in store [:children parent-uuid]
                   (ready-children-slot patch-rev (:tx-id current) items))
         (update effects :changed-children conj parent-uuid)])

      :else
      [(assoc-in store [:children parent-uuid :stale-rev] (:rev store))
       (cond-> effects
         (mounted? context :children parent-uuid)
         (update :stale-children conj parent-uuid))])))

(defn- advance-unpatched-children
  [store previous-rev blocks child-patches]
  (reduce-kv
   (fn [store parent-uuid current]
     (if (and (not (contains? child-patches parent-uuid))
              (= :ready (:kind current))
              (= previous-rev (:basis-rev current)))
       (cond-> (assoc-in store [:children parent-uuid :basis-rev] (:rev store))
         (contains? blocks parent-uuid)
         (assoc-in [:children parent-uuid :tx-id]
                   (get-in blocks [parent-uuid :block/tx-id])))
       store))
   store
   (:children store)))

(defn- invalidate-resources
  [context store affected-keys deleted effects]
  (reduce-kv
   (fn [[store effects] resource-key slot]
     (let [owner-uuid (second resource-key)]
       (cond
         (and (uuid? owner-uuid) (contains? deleted owner-uuid))
         [(assoc-in store [:resources resource-key]
                    (tombstone-slot (:rev store)))
          (update effects :changed-resources conj resource-key)]

         (and (mounted? context :resources resource-key)
              (<= (slot-revision slot) (:rev store))
              (seq (set/intersection affected-keys (:watch-keys slot))))
         [(assoc-in store [:resources resource-key :stale-rev] (:rev store))
          (update effects :stale-resources conj resource-key)]

         :else
         [store effects])))
   [store effects]
   (:resources store)))

(defn- apply-delta-to-store
  [context store {:keys [graph-id rev blocks deleted children affected-keys]}]
  (if (or (not= graph-id (:graph-id store))
          (<= rev (:rev store)))
    [store empty-delta-effects]
    (let [seed-block-uuids (inserted-child-uuids children)
          effects (assoc empty-delta-effects :applied? true)
          previous-rev (:rev store)
          store (assoc store :rev rev)
          store (advance-unpatched-children store previous-rev blocks children)
          [store effects]
          (reduce-kv
           (fn [[store effects] block-uuid block]
             (apply-block-replacement context store block-uuid block
                                      seed-block-uuids effects))
           [store effects]
           blocks)
          [store effects]
          (reduce-kv
           (fn [[store effects] block-uuid tombstone]
             (apply-tombstone context store rev block-uuid tombstone effects))
           [store effects]
           deleted)
          [store effects]
          (reduce-kv
           (fn [[store effects] parent-uuid patch]
             (apply-child-patch context store parent-uuid patch
                                (contains? seed-block-uuids parent-uuid)
                                (get-in blocks [parent-uuid :block/tx-id])
                                effects))
           [store effects]
           children)]
      (invalidate-resources context store affected-keys deleted effects))))

(defn- apply-delta*
  [context {:keys [graph-id rev blocks deleted children affected-keys] :as delta}]
  (require-revision! :rev rev)
  (when-not (map? delta)
    (throw (ex-info "Invalid renderer delta" {:delta delta})))
  (when-not (map? blocks)
    (throw (ex-info "Invalid renderer block replacements" {:blocks blocks})))
  (when-not (map? deleted)
    (throw (ex-info "Invalid renderer tombstones" {:deleted deleted})))
  (when-not (map? children)
    (throw (ex-info "Invalid renderer child patches" {:children children})))
  (when-not (set? affected-keys)
    (throw (ex-info "Invalid renderer affected keys"
                    {:affected-keys affected-keys})))
  (when (seq (set/intersection (set (keys blocks)) (set (keys deleted))))
    (throw (ex-info "A block cannot be replaced and deleted in one delta"
                    {:rev rev})))
  (let [[_ {:keys [applied? changed-blocks seeded-blocks
                   changed-children seeded-children stale-children
                   stale-resources changed-resources]}]
        (commit-transition!
         context
         #(apply-delta-to-store context %
                                {:graph-id graph-id
                                 :rev rev
                                 :blocks blocks
                                 :deleted deleted
                                 :children children
                                 :affected-keys affected-keys}))]
    (when applied?
      (notify-keys! context :children changed-children)
      (notify-keys! context :blocks changed-blocks)
      (notify-keys! context :resources changed-resources)
      (when (or (seq seeded-blocks) (seq seeded-children))
        (schedule-seeded-slots-gc! context seeded-blocks seeded-children rev))
      (doseq [parent-uuid stale-children]
        ((:request-reload! context) [:children parent-uuid]
                                     #((:start-children-load! context) parent-uuid)))
      (doseq [resource-key stale-resources]
        ((:schedule-resource-reload! context) resource-key)))
    applied?))

(defn apply-block-load!
  [context generation block-uuid response]
  (apply-block-load* context generation block-uuid response))

(defn apply-children-load!
  [context generation parent-uuid response]
  (apply-children-load* context generation parent-uuid response))

(defn apply-resource-load!
  [context generation resource-key response]
  (apply-resource-load* context generation resource-key response))

(defn apply-delta!
  [context delta]
  (apply-delta* context delta))
