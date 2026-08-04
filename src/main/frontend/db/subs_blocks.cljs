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

(def ^:dynamic *store nil)
(def ^:dynamic *listeners nil)
(def ^:dynamic *request-reload! nil)
(def ^:dynamic *start-children-load! nil)
(def ^:dynamic *schedule-resource-reload! nil)
(def ^:dynamic *set-seeded-block-gc-timeout! nil)

(defn- mounted?
  [slot-type key]
  (seq (get-in @*listeners [slot-type key])))

(defn- listeners-for
  [slot-type key]
  (vals (get-in @*listeners [slot-type key])))

(defn- notify-key!
  [slot-type key]
  (doseq [listener (listeners-for slot-type key)]
    (listener)))

(defn- notify-keys!
  [slot-type keys]
  (doseq [key keys]
    (notify-key! slot-type key)))

(defn- request-reload!
  [request-key start-load!]
  (*request-reload! request-key start-load!))

(defn- start-children-load!
  [parent-uuid]
  (*start-children-load! parent-uuid))

(defn- schedule-resource-reload!
  [resource-key]
  (*schedule-resource-reload! resource-key))

(defn- set-seeded-block-gc-timeout!
  [callback delay-ms]
  (*set-seeded-block-gc-timeout! callback delay-ms))

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

(defn- apply-block-load*
  [generation block-uuid {:keys [basis-rev blocks]}]
  (require-revision! :basis-rev basis-rev)
  (let [changed-blocks (volatile! #{})]
    (swap! *store
           (fn [store]
             (let [current (get-in store [:blocks block-uuid])]
               (if (or (not= generation (:generation store))
                       (< basis-rev (slot-revision current)))
                 store
                 (let [store
                       (reduce-kv
                        (fn [store loaded-uuid block]
                          (let [current (get-in store [:blocks loaded-uuid])
                                next-slot (loaded-block-slot loaded-uuid
                                                             basis-rev
                                                             current
                                                             block)]
                            (if (identical? current next-slot)
                              store
                              (do
                                (vswap! changed-blocks conj loaded-uuid)
                                (assoc-in store [:blocks loaded-uuid]
                                          next-slot)))))
                        store
                        blocks)]
                   (if (contains? blocks block-uuid)
                     store
                     (let [current (get-in store [:blocks block-uuid])
                           next-slot (if (and (= :tombstone (:kind current))
                                              (>= (:rev current) basis-rev))
                                       current
                                       (tombstone-slot basis-rev))]
                       (if (identical? current next-slot)
                         store
                         (do
                           (vswap! changed-blocks conj block-uuid)
                           (assoc-in store [:blocks block-uuid]
                                     next-slot))))))))))
    (notify-keys! :blocks @changed-blocks)))

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

(defn- journal-bundle-key?
  [resource-key]
  (= :journal-bundle (first resource-key)))

(defn resource-bundles
  [resource-key value]
  (case (first resource-key)
    :journal-bundle
    {(second resource-key) value}

    :journals
    (:bundles value)

    :journal-window
    (:bundles value)

    {}))

(defn resource-blocks
  [resource-key value]
  (if (= :view-data (first resource-key))
    (:initial-blocks value)
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
  [generation parent-uuid {:keys [blocks children] :as response}]
  (if (and blocks children)
    (apply-block-tree-load! generation parent-uuid response)
    (let [{:keys [basis-rev parent-tx-id items]} response]
      (require-revision! :basis-rev basis-rev)
      (require-revision! :block/tx-id parent-tx-id)
      (let [items (require-child-items! parent-uuid items)
            next-slot (ready-children-slot basis-rev parent-tx-id items)
            changed? (volatile! false)]
        (swap! *store
               (fn [store]
                 (let [current (get-in store [:children parent-uuid])]
                   (if (or (not= generation (:generation store))
                           (< basis-rev (slot-revision current)))
                     store
                     (do
                       (when-not (= current next-slot)
                         (vreset! changed? true))
                       (assoc-in store [:children parent-uuid] next-slot))))))
        (when @changed?
          (notify-key! :children parent-uuid))))))

(defn- bundle-has-newer-slot?
  [store basis-rev {:keys [blocks children]}]
  (or (some #(> (slot-revision (get-in store [:blocks %])) basis-rev)
            (keys blocks))
      (some #(> (slot-revision (get-in store [:children %])) basis-rev)
            (keys children))))

(defn- seed-block-bundle
  [store basis-rev {:keys [blocks children]}
   changed-blocks changed-children]
  (let [store
        (reduce-kv
         (fn [store block-uuid block]
           (let [current (get-in store [:blocks block-uuid])
                 next-slot (loaded-block-slot block-uuid basis-rev current block)]
             (if (identical? current next-slot)
               store
               (do
                 (vswap! changed-blocks conj block-uuid)
                 (assoc-in store [:blocks block-uuid] next-slot)))))
         store
         blocks)]
    (reduce-kv
     (fn [store parent-uuid {:keys [parent-tx-id items]}]
       (let [current (get-in store [:children parent-uuid])
             next-slot (ready-children-slot basis-rev parent-tx-id items)]
         (if (= current next-slot)
           store
           (do
             (vswap! changed-children conj parent-uuid)
             (assoc-in store [:children parent-uuid] next-slot)))))
     store
     children)))

(defn- apply-block-tree-load!
  [generation parent-uuid {:keys [basis-rev parent-tx-id items blocks children]}]
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
    (let [changed-blocks (volatile! #{})
          changed-children (volatile! #{})]
      (swap! *store
             (fn [store]
               (if (or (not= generation (:generation store))
                       (bundle-has-newer-slot? store basis-rev bundle))
                 store
                 (seed-block-bundle store basis-rev bundle
                                    changed-blocks changed-children))))
      (notify-keys! :blocks @changed-blocks)
      (notify-keys! :children @changed-children))))

(defn- apply-resource-load*
  [generation resource-key {:keys [basis-rev key watch-keys value]}]
  (require-revision! :basis-rev basis-rev)
  (when-not (= resource-key key)
    (throw (ex-info "Resource key does not match its subscription key"
                    {:resource-key resource-key :response-key key})))
  (when-not (set? watch-keys)
    (throw (ex-info "Invalid resource watch keys"
                    {:resource-key resource-key :watch-keys watch-keys})))
  (let [bundles (into {}
                      (map (fn [[root-uuid bundle]]
                             [root-uuid
                              (require-block-bundle! root-uuid bundle)]))
                      (resource-bundles resource-key value))
        initial-blocks (into {}
                             (map (fn [[block-uuid block]]
                                    [block-uuid
                                     (require-block! block-uuid block)]))
                             (resource-blocks resource-key value))
        value (cond
                (journal-bundle-key? resource-key)
                (get bundles (second resource-key))

                (contains? #{:journals :journal-window}
                           (first resource-key))
                (assoc value :bundles bundles)

                (and (= :view-data (first resource-key))
                     (contains? value :initial-blocks))
                (assoc value :initial-blocks initial-blocks)

                :else
                value)
        next-slot (ready-resource-slot basis-rev watch-keys value)
        changed-resource? (volatile! false)
        changed-blocks (volatile! #{})
        changed-children (volatile! #{})
        stale-response? (volatile! false)]
    (swap! *store
           (fn [store]
             (let [current (get-in store [:resources resource-key])]
               (if (or (not= generation (:generation store))
                       (< basis-rev (:rev store))
                       (< basis-rev (slot-revision current))
                       (some #(bundle-has-newer-slot? store basis-rev %)
                             (vals bundles))
                       (some #(> (slot-revision (get-in store [:blocks %]))
                                 basis-rev)
                             (keys initial-blocks)))
                 (do
                   (when (= generation (:generation store))
                     (vreset! stale-response? true))
                   store)
                 (let [store (if (= current next-slot)
                               store
                               (do
                                 (vreset! changed-resource? true)
                                 (assoc-in store [:resources resource-key]
                                           next-slot)))
                       store (reduce (fn [store bundle]
                                       (seed-block-bundle
                                        store basis-rev bundle
                                        changed-blocks changed-children))
                                     store
                                     (vals bundles))]
                   (seed-block-bundle store basis-rev
                                      {:blocks initial-blocks :children {}}
                                      changed-blocks changed-children))))))
    (when @stale-response?
      (schedule-resource-reload! resource-key))
    (notify-keys! :children @changed-children)
    (notify-keys! :blocks @changed-blocks)
    (when @changed-resource?
      (notify-key! :resources resource-key))))

(defn- apply-block-replacement
  [store block-uuid block seed-block-uuids changed-blocks seeded-blocks]
  (let [block (require-block! block-uuid block)
        current (get-in store [:blocks block-uuid])
        mounted-block? (mounted? :blocks block-uuid)
        seed? (contains? seed-block-uuids block-uuid)]
    (if (or (and (nil? current)
                 (not mounted-block?)
                 (not seed?))
            (> (slot-revision current) (:rev store))
            (and (= :ready (:kind current))
                 (not (block-changed? (get-in current [:snapshot :value]) block))))
      store
      (do
        (vswap! changed-blocks conj block-uuid)
        (when (and seed? (not mounted-block?))
          (vswap! seeded-blocks conj block-uuid))
        (assoc-in store [:blocks block-uuid]
                  (cond-> (ready-block-slot (:rev store) block)
                    (and seed? (not mounted-block?))
                    (assoc :seeded? true)))))))

(defn- inserted-child-uuids
  [children]
  (into #{}
        (mapcat (fn [[_parent-uuid patch]]
                  (map first (:upsert patch))))
        children))

(defn- schedule-seeded-slots-gc!
  [block-uuids parent-uuids basis-rev]
  (let [store *store
        listeners *listeners]
    (set-seeded-block-gc-timeout!
     (fn []
       (binding [*store store
                 *listeners listeners]
         (swap! *store
                (fn [store]
                  (-> store
                      (update :blocks
                              (fn [blocks]
                                (reduce
                                 (fn [blocks block-uuid]
                                   (let [slot (get blocks block-uuid)]
                                     (if (and (not (mounted? :blocks block-uuid))
                                              (:seeded? slot)
                                              (= basis-rev (:basis-rev slot)))
                                       (dissoc blocks block-uuid)
                                       blocks)))
                                 blocks
                                 block-uuids)))
                      (update :children
                              (fn [children]
                                (reduce
                                 (fn [children parent-uuid]
                                   (let [slot (get children parent-uuid)]
                                     (if (and (not (mounted? :children parent-uuid))
                                              (:seeded? slot)
                                              (= basis-rev (:basis-rev slot)))
                                       (dissoc children parent-uuid)
                                       children)))
                                 children
                                 parent-uuids))))))))
     2000)))

(defn- apply-tombstone
  [store delta-rev block-uuid tombstone changed-blocks]
  (require-uuid! :block/uuid block-uuid)
  (let [tombstone-rev (require-revision! :rev (:rev tombstone))
        current (get-in store [:blocks block-uuid])]
    (when-not (= delta-rev tombstone-rev)
      (throw (ex-info "Tombstone revision does not match delta"
                      {:delta-rev delta-rev
                       :block-uuid block-uuid
                       :tombstone-rev tombstone-rev})))
    (if (or (and (nil? current)
                 (not (mounted? :blocks block-uuid)))
            (> (slot-revision current) delta-rev)
            (and (= :tombstone (:kind current))
                 (>= (:rev current) tombstone-rev)))
      store
      (do
        (vswap! changed-blocks conj block-uuid)
        (assoc-in store [:blocks block-uuid]
                  (tombstone-slot tombstone-rev))))))

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
  [store parent-uuid {removed :remove patch-rev :rev :keys [base-rev upsert]}
   seed? parent-tx-id changed-children seeded-children stale-children]
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
          (vswap! changed-children conj parent-uuid)
          (vswap! seeded-children conj parent-uuid)
          (assoc-in store [:children parent-uuid]
                    (assoc (ready-children-slot patch-rev parent-tx-id items)
                           :seeded? true)))

        (mounted? :children parent-uuid)
        (do
          (vswap! stale-children conj parent-uuid)
          (assoc-in store [:children parent-uuid :stale-rev]
                    (:rev store)))

        :else
        store)

      (> (slot-revision current) (:rev store))
      store

      (= patch-rev (:basis-rev current))
      store

      (= base-rev (:basis-rev current))
      (let [items (child-patch-items parent-uuid (:items current) removed upsert)]
        (vswap! changed-children conj parent-uuid)
        (assoc-in store [:children parent-uuid]
                  (ready-children-slot patch-rev (:tx-id current) items)))

      :else
      (do
        (when (mounted? :children parent-uuid)
          (vswap! stale-children conj parent-uuid))
        (assoc-in store [:children parent-uuid :stale-rev]
                  (:rev store))))))

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
  [store affected-keys deleted stale-resources changed-resources]
  (reduce-kv
   (fn [store resource-key slot]
     (let [owner-uuid (second resource-key)]
       (cond
         (and (uuid? owner-uuid) (contains? deleted owner-uuid))
         (do
           (vswap! changed-resources conj resource-key)
           (assoc-in store [:resources resource-key]
                     (tombstone-slot (:rev store))))

         (and (mounted? :resources resource-key)
              (<= (slot-revision slot) (:rev store))
              (seq (set/intersection affected-keys (:watch-keys slot))))
         (do
           (vswap! stale-resources conj resource-key)
           (assoc-in store [:resources resource-key :stale-rev]
                     (:rev store)))

         :else
         store)))
   store
   (:resources store)))

(defn- apply-delta*
  [{:keys [graph-id rev blocks deleted children affected-keys] :as delta}]
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
  (let [changed-blocks (volatile! #{})
        seeded-blocks (volatile! #{})
        changed-children (volatile! #{})
        seeded-children (volatile! #{})
        stale-children (volatile! #{})
        stale-resources (volatile! #{})
        changed-resources (volatile! #{})
        applied? (volatile! false)]
    (swap! *store
           (fn [store]
             (if (or (not= graph-id (:graph-id store))
                     (<= rev (:rev store)))
               store
               (let [previous-rev (:rev store)
                     seed-block-uuids (inserted-child-uuids children)
                     store (assoc store :rev rev)
                     store (advance-unpatched-children store previous-rev blocks children)
                     store (reduce-kv
                            (fn [store block-uuid block]
                              (apply-block-replacement store block-uuid block
                                                       seed-block-uuids
                                                       changed-blocks
                                                       seeded-blocks))
                            store
                            blocks)
                     store (reduce-kv
                            (fn [store block-uuid tombstone]
                              (apply-tombstone store rev block-uuid tombstone
                                               changed-blocks))
                            store
                            deleted)
                     store (reduce-kv
                            (fn [store parent-uuid patch]
                              (apply-child-patch store parent-uuid patch
                                                 (contains? seed-block-uuids parent-uuid)
                                                 (get-in blocks [parent-uuid :block/tx-id])
                                                 changed-children seeded-children
                                                 stale-children))
                            store
                            children)]
                 (vreset! applied? true)
                 (invalidate-resources store affected-keys deleted
                                       stale-resources changed-resources)))))
    (when @applied?
      (notify-keys! :children @changed-children)
      (notify-keys! :blocks @changed-blocks)
      (notify-keys! :resources @changed-resources)
      (when (or (seq @seeded-blocks) (seq @seeded-children))
        (schedule-seeded-slots-gc! @seeded-blocks @seeded-children rev))
      (doseq [parent-uuid @stale-children]
        (request-reload! [:children parent-uuid]
                         #(start-children-load! parent-uuid)))
      (doseq [resource-key @stale-resources]
        (schedule-resource-reload! resource-key)))
    @applied?))

(defn- bind-context
  [context f]
  (binding [*store (:store context)
            *listeners (:listeners context)
            *request-reload! (:request-reload! context)
            *start-children-load! (:start-children-load! context)
            *schedule-resource-reload! (:schedule-resource-reload! context)
            *set-seeded-block-gc-timeout! (:set-seeded-block-gc-timeout! context)]
    (f)))

(defn apply-block-load!
  [context generation block-uuid response]
  (bind-context context
                #(apply-block-load* generation block-uuid response)))

(defn apply-children-load!
  [context generation parent-uuid response]
  (bind-context context
                #(apply-children-load* generation parent-uuid response)))

(defn apply-resource-load!
  [context generation resource-key response]
  (bind-context context
                #(apply-resource-load* generation resource-key response)))

(defn apply-delta!
  [context delta]
  (bind-context context
                #(apply-delta* delta)))
