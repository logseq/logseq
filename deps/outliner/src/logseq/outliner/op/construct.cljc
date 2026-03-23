(ns logseq.outliner.op.construct
  "Construct canonical forward and reverse outliner ops for history actions."
  (:require #?(:org.babashka/nbb [logseq.common.log :as log]
               :default [lambdaisland.glogi :as log])
            [cljs.pprint :as pprint]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.property.type :as db-property-type]))

(def ^:private semantic-outliner-ops
  #{:save-block
    :insert-blocks
    :move-blocks
    :move-blocks-up-down
    :indent-outdent-blocks
    :delete-blocks
    :create-page
    :rename-page
    :delete-page
    :restore-recycled
    :set-block-property
    :remove-block-property
    :batch-set-property
    :batch-remove-property
    :delete-property-value
    :batch-delete-property-value
    :create-property-text-block
    :upsert-property
    :class-add-property
    :class-remove-property
    :upsert-closed-value
    :add-existing-values-to-closed-values
    :delete-closed-value})

(def ^:private transient-block-keys
  #{:db/id
    :block/tx-id
    :block/created-at
    :block/updated-at
    :block/meta
    :block/unordered
    :block/level
    :block.temp/ast-title
    :block.temp/ast-body
    :block.temp/load-status
    :block.temp/has-children?})

(def rebase-refs-key :db-sync.rebase/refs)
(def canonical-transact-op [[:transact nil]])

(defn- stable-entity-ref
  [db x]
  (cond
    (map? x) (let [eid (or (:db/id x)
                           (when-let [id (:block/uuid x)]
                             (:db/id (d/entity db [:block/uuid id]))))]
               (stable-entity-ref db eid))
    (and (integer? x) (not (neg? x)))
    (if-let [ent (d/entity db x)]
      (cond
        (:block/uuid ent) [:block/uuid (:block/uuid ent)]
        (:db/ident ent) (:db/ident ent)
        :else x)
      x)
    :else x))

(defn- sanitize-ref-value
  [db v]
  (cond
    (vector? v) (stable-entity-ref db v)
    (or (set? v) (sequential? v)) (set (map #(stable-entity-ref db %) v))
    :else (stable-entity-ref db v)))

(defn- sanitize-block-refs
  [refs]
  (->> refs
       (keep (fn [ref]
               (when (:block/uuid ref)
                 (select-keys ref [:block/uuid :block/title]))))
       vec))

(defn- ref-attr?
  [db a]
  (and (keyword? a)
       (= :db.type/ref
          (:db/valueType (d/entity db a)))))

(defn- sanitize-block-payload
  [db block]
  (if (map? block)
    (let [refs (sanitize-block-refs (:block/refs block))
          m (reduce-kv
             (fn [m k v]
               (cond
                 (contains? transient-block-keys k) m
                 (= "block.temp" (namespace k)) m
                 (ref-attr? db k)
                 (assoc m k (sanitize-ref-value db v))
                 :else
                 (assoc m k v)))
             {}
             block)]
      (cond-> m
        (seq refs)
        (assoc rebase-refs-key refs)))
    block))

(defn rewrite-block-title-with-retracted-refs
  [db block]
  (let [refs (get block rebase-refs-key)
        retracted-refs (remove (fn [ref] (d/entity db [:block/uuid (:block/uuid ref)])) refs)
        block' (if (seq retracted-refs)
                 (update block :block/title
                         (fn [title]
                           (db-content/content-id-ref->page title retracted-refs)))
                 block)]
    (dissoc block' rebase-refs-key)))

(defn- sanitize-insert-block-payload
  [db block]
  (let [block' (sanitize-block-payload db block)]
    (if (map? block')
      (dissoc block' :block/parent :block/page :block/order)
      block')))

(defn- stable-id-coll
  [db ids]
  (mapv #(stable-entity-ref db %) ids))

(defn- resolve-move-target
  [db ids]
  (when-let [first-block (some->> ids first (d/entity db))]
    (if-let [left-sibling (ldb/get-left-sibling first-block)]
      [(:db/id left-sibling) true]
      (when-let [parent (:block/parent first-block)]
        [(:db/id parent) false]))))

(defn- stable-property-value
  [db property-id v]
  (let [property-type (some-> (d/entity db property-id) :logseq.property/type)]
    (if (contains? db-property-type/all-ref-property-types property-type)
      (sanitize-ref-value db v)
      v)))

(defn- created-block-uuids-from-tx-data
  [tx-data]
  (->> tx-data
       (keep (fn [item]
               (cond
                 (and (map? item) (:block/uuid item))
                 (:block/uuid item)

                 (and (some? (:a item))
                      (= :block/uuid (:a item))
                      (true? (:added item)))
                 (:v item)

                 (and (vector? item)
                      (= :db/add (first item))
                      (>= (count item) 4)
                      (= :block/uuid (nth item 2)))
                 (nth item 3)

                 :else
                 nil)))
       distinct
       vec))

(defn- created-page-uuid-from-tx-data
  [tx-data title]
  (or
   (some (fn [item]
           (when (and (map? item)
                      (= title (:block/title item))
                      (:block/uuid item))
             (:block/uuid item)))
         tx-data)
   (let [grouped (group-by :e tx-data)]
     (some (fn [[_ datoms]]
             (let [title' (some (fn [datom]
                                  (when (and (= :block/title (:a datom))
                                             (true? (:added datom)))
                                    (:v datom)))
                                datoms)
                   uuid' (some (fn [datom]
                                 (when (and (= :block/uuid (:a datom))
                                            (true? (:added datom)))
                                   (:v datom)))
                               datoms)]
               (when (and (= title title') (uuid? uuid'))
                 uuid')))
           grouped))))

(defn- created-db-ident-from-tx-data
  [tx-data]
  (or
   (some (fn [item]
           (when (and (map? item)
                      (qualified-keyword? (:db/ident item)))
             (:db/ident item)))
         tx-data)
   (some (fn [item]
           (when (and (map? item)
                      (= :db/ident (:a item))
                      (qualified-keyword? (:v item)))
             (:v item)))
         tx-data)
   (some (fn [item]
           (when (and (vector? item)
                      (keyword? (nth item 1 nil))
                      (= :db/ident (nth item 1 nil))
                      (qualified-keyword? (nth item 2 nil)))
             (nth item 2)))
         tx-data)
   (some (fn [item]
           (when (and (vector? item)
                      (= :db/add (first item))
                      (>= (count item) 4)
                      (= :db/ident (nth item 2))
                      (qualified-keyword? (nth item 3)))
             (nth item 3)))
         tx-data)))

(defn- property-ident-by-title
  [db property-name]
  (some-> (d/q '[:find ?ident .
                 :in $ ?title
                 :where
                 [?e :block/title ?title]
                 [?e :block/tags :logseq.class/Property]
                 [?e :db/ident ?ident]]
               db
               property-name)
          (as-> ident
                (when (qualified-keyword? ident)
                  ident))))

(defn- maybe-rewrite-delete-block-ids
  [db tx-data ids]
  (let [ids' (stable-id-coll db ids)
        created-uuids (created-block-uuids-from-tx-data tx-data)
        unresolved-created-lookups? (and (seq created-uuids)
                                         (= (count ids') (count created-uuids))
                                         (every? (fn [id]
                                                   (and (vector? id)
                                                        (= :block/uuid (first id))
                                                        (nil? (d/entity db id))))
                                                 ids'))]
    (if unresolved-created-lookups?
      (mapv (fn [uuid] [:block/uuid uuid]) created-uuids)
      ids')))

(defn- moved-block-ids-from-tx-data
  [tx-data]
  (->> tx-data
       (keep (fn [[e a _v _t added?]]
               (when (and (= :block/parent a) (true? added?))
                 e)))
       distinct
       vec))

(defn- canonical-move-op-for-block
  [db block-id opts]
  (when-let [[target-id sibling?] (resolve-move-target db [block-id])]
    [:move-blocks [[(stable-entity-ref db block-id)]
                   (stable-entity-ref db target-id)
                   (assoc (dissoc (or opts {}) :outliner-op)
                          :sibling? sibling?)]]))

(defn- canonicalize-indent-outdent-op
  [db tx-data ids indent? opts]
  (let [moved-ids (moved-block-ids-from-tx-data tx-data)]
    (if (seq moved-ids)
      (let [move-ops (->> moved-ids
                          (keep #(canonical-move-op-for-block db % opts))
                          vec)]
        (if (= (count moved-ids) (count move-ops))
          move-ops
          [[:indent-outdent-blocks [(stable-id-coll db ids)
                                    indent?
                                    opts]]]))
      [[:indent-outdent-blocks [(stable-id-coll db ids)
                                indent?
                                opts]]])))

(defn- ^:large-vars/cleanup-todo canonicalize-semantic-outliner-op
  [db tx-data [op args]]
  (case op
    :save-block
    (let [[block opts] args]
      [:save-block [(sanitize-block-payload db block) opts]])

    :insert-blocks
    (let [[blocks target-id opts] args
          created-uuids (created-block-uuids-from-tx-data tx-data)
          blocks' (mapv #(sanitize-insert-block-payload db %) blocks)
          target-ref (stable-entity-ref db target-id)
          target-uuid (when (and (vector? target-ref)
                                 (= :block/uuid (first target-ref)))
                        (second target-ref))
          blocks' (cond
                    (and (:replace-empty-target? opts)
                         target-uuid
                         (seq blocks'))
                    (let [[fst-block & rst-blocks] blocks']
                      (into [(assoc fst-block :block/uuid target-uuid)]
                            (if (and (not (:keep-uuid? opts))
                                     (= (count rst-blocks) (count created-uuids)))
                              (map (fn [block uuid]
                                     (assoc block :block/uuid uuid))
                                   rst-blocks
                                   created-uuids)
                              rst-blocks)))

                    (and (not (:keep-uuid? opts))
                         (= (count blocks') (count created-uuids)))
                    (mapv (fn [block uuid]
                            (assoc block :block/uuid uuid))
                          blocks'
                          created-uuids)

                    :else
                    blocks')]
      [:insert-blocks [blocks'
                       target-ref
                       (assoc (dissoc (or opts {}) :outliner-op)
                              :keep-uuid? true)]])

    :move-blocks-up-down
    (let [[ids up?] args]
      [:move-blocks-up-down
       [(stable-id-coll db ids)
        up?]])

    :indent-outdent-blocks
    (let [[ids indent? opts] args]
      (canonicalize-indent-outdent-op db tx-data ids indent? opts))

    :move-blocks
    (let [[ids target-id opts] args]
      [:move-blocks [(stable-id-coll db ids)
                     (stable-entity-ref db target-id)
                     opts]])

    :delete-blocks
    (let [[ids opts] args]
      [:delete-blocks [(maybe-rewrite-delete-block-ids db tx-data ids) opts]])

    :create-page
    (let [[title opts] args
          page-uuid (created-page-uuid-from-tx-data tx-data title)]
      [:create-page [title
                     (cond-> (or opts {})
                       page-uuid
                       (assoc :uuid page-uuid))]])

    :rename-page
    (let [[page-uuid new-title] args]
      [:save-block [{:block/uuid page-uuid
                     :block/title new-title}
                    {}]])

    :delete-page
    (let [[page-uuid opts] args]
      [:delete-page [page-uuid opts]])

    :restore-recycled
    (let [[root-id] args]
      [:restore-recycled [root-id]])

    :set-block-property
    (let [[block-eid property-id v] args]
      [:set-block-property [(stable-entity-ref db block-eid)
                            property-id
                            (stable-property-value db property-id v)]])

    :remove-block-property
    (let [[block-eid property-id] args]
      [:remove-block-property [(stable-entity-ref db block-eid) property-id]])

    :batch-set-property
    (let [[block-ids property-id v opts] args]
      [:batch-set-property [(stable-id-coll db block-ids)
                            property-id
                            (stable-property-value db property-id v)
                            opts]])

    :batch-remove-property
    (let [[block-ids property-id] args]
      [:batch-remove-property [(stable-id-coll db block-ids) property-id]])

    :delete-property-value
    (let [[block-eid property-id property-value] args]
      [:delete-property-value [(stable-entity-ref db block-eid)
                               property-id
                               (stable-property-value db property-id property-value)]])

    :batch-delete-property-value
    (let [[block-eids property-id property-value] args]
      [:batch-delete-property-value [(stable-id-coll db block-eids)
                                     property-id
                                     (stable-property-value db property-id property-value)]])

    :create-property-text-block
    (let [[block-id property-id value opts] args]
      [:create-property-text-block [(stable-entity-ref db block-id)
                                    (stable-entity-ref db property-id)
                                    value
                                    opts]])

    :upsert-property
    (let [[property-id schema opts] args
          property-id' (or (stable-entity-ref db property-id)
                           (property-ident-by-title db (:property-name opts))
                           (created-db-ident-from-tx-data tx-data))]
      [:upsert-property [property-id' schema opts]])

    :class-add-property
    (let [[class-id property-id] args]
      [:class-add-property [(stable-entity-ref db class-id) (stable-entity-ref db property-id)]])

    :class-remove-property
    (let [[class-id property-id] args]
      [:class-remove-property [(stable-entity-ref db class-id) (stable-entity-ref db property-id)]])

    :upsert-closed-value
    (let [[property-id opts] args]
      [:upsert-closed-value [property-id opts]])

    :add-existing-values-to-closed-values
    (let [[property-id values] args]
      [:add-existing-values-to-closed-values [property-id values]])

    :delete-closed-value
    (let [[property-id value-block-id] args]
      [:delete-closed-value [property-id (stable-entity-ref db value-block-id)]])

    [op args]))

(defn- save-block-keys
  [block]
  (->> (keys block)
       (remove transient-block-keys)
       (remove #(= :db/other-tx %))
       (remove nil?)))

(defn- worker-ref-attr?
  [db a]
  (and (keyword? a)
       (= :db.type/ref
          (:db/valueType (d/entity db a)))))

(defn- block-entity
  [db block]
  (cond
    (map? block)
    (or (when-let [uuid (:block/uuid block)]
          (d/entity db [:block/uuid uuid]))
        (when-let [db-id (:db/id block)]
          (d/entity db db-id)))

    (integer? block)
    (d/entity db block)

    (vector? block)
    (d/entity db block)

    :else
    nil))

(defn- build-inverse-save-block
  [db-before block opts]
  (when-let [before-ent (block-entity db-before block)]
    (let [keys-to-restore (save-block-keys block)
          inverse-block (reduce
                         (fn [m k]
                           (let [v (get before-ent k)]
                             (assoc m k
                                    (if (worker-ref-attr? db-before k)
                                      (sanitize-ref-value db-before v)
                                      v))))
                         {:block/uuid (:block/uuid before-ent)}
                         keys-to-restore)]
      [:save-block [inverse-block opts]])))

(defn- property-ref-value
  [db property-id value]
  (let [property-type (some-> (d/entity db property-id) :logseq.property/type)]
    (if (contains? db-property-type/all-ref-property-types property-type)
      (sanitize-ref-value db value)
      value)))

(defn- block-property-value
  [db block-id property-id]
  (when-let [value (some-> (d/entity db block-id)
                           (get property-id))]
    (property-ref-value db property-id value)))

(defn- inverse-property-op
  [db-before op args]
  (case op
    :set-block-property
    (let [[block-id property-id _value] args
          before-value (block-property-value db-before block-id property-id)
          block-ref (stable-entity-ref db-before block-id)]
      (if (nil? before-value)
        [:remove-block-property [block-ref property-id]]
        [:set-block-property [block-ref property-id before-value]]))

    :remove-block-property
    (let [[block-id property-id] args
          before-value (block-property-value db-before block-id property-id)
          block-ref (stable-entity-ref db-before block-id)]
      (when (some? before-value)
        [:set-block-property [block-ref property-id before-value]]))

    :batch-set-property
    (let [[block-ids property-id _value _opts] args]
      (->> block-ids
           (keep (fn [block-id]
                   (let [before-value (block-property-value db-before block-id property-id)
                         block-ref (stable-entity-ref db-before block-id)]
                     (if (nil? before-value)
                       [:remove-block-property [block-ref property-id]]
                       [:set-block-property [block-ref property-id before-value]]))))
           vec
           seq))

    :batch-remove-property
    (let [[block-ids property-id _opts] args]
      (->> block-ids
           (keep (fn [block-id]
                   (let [before-value (block-property-value db-before block-id property-id)
                         block-ref (stable-entity-ref db-before block-id)]
                     (when (some? before-value)
                       [:set-block-property [block-ref property-id before-value]]))))
           vec
           seq))

    nil))

(defn- build-insert-block-payload
  [db-before ent]
  (when-let [uuid (:block/uuid ent)]
    (->> (save-block-keys ent)
         (remove #(string/starts-with? (name %) "_"))
         (reduce (fn [m k]
                   (let [v (get ent k)]
                     (assoc m k
                            (if (worker-ref-attr? db-before k)
                              (sanitize-ref-value db-before v)
                              v))))
                 {:block/uuid uuid}))))

(defn- selected-block-roots
  [db-before ids]
  (let [entities (reduce (fn [acc id]
                           (if-let [ent (d/entity db-before id)]
                             (if (some #(= (:db/id %) (:db/id ent)) acc)
                               acc
                               (conj acc ent))
                             acc))
                         []
                         ids)
        selected-ids (set (map :db/id entities))
        has-selected-ancestor? (fn [ent]
                                 (loop [parent (:block/parent ent)]
                                   (if-let [parent-id (some-> parent :db/id)]
                                     (if (contains? selected-ids parent-id)
                                       true
                                       (recur (:block/parent parent)))
                                     false)))]
    (->> entities
         (remove has-selected-ancestor?)
         vec)))

(defn- block-restore-target
  [ent]
  (if-let [left-sibling (ldb/get-left-sibling ent)]
    [(:db/id left-sibling) true]
    (or
     (some-> ent :block/parent :db/id (#(vector % false)))
     (some-> ent :block/page :db/id (#(vector % false))))))

(defn- to-insert-op
  [db-before {:keys [blocks target-id sibling?]}]
  [:insert-blocks [blocks
                   (stable-entity-ref db-before target-id)
                   {:sibling? (boolean sibling?)
                    :keep-uuid? true
                    :keep-block-order? true}]])

(defn- delete-root->restore-plan
  [db-before root]
  (let [root-uuid (:block/uuid root)
        blocks (when root-uuid
                 (->> (ldb/get-block-and-children db-before root-uuid)
                      (keep #(build-insert-block-payload db-before %))
                      vec))
        [target-id sibling?] (block-restore-target root)]
    (when (and (seq blocks)
               (some? target-id))
      {:blocks blocks
       :target-id target-id
       :sibling? sibling?})))

(defn- build-inverse-delete-blocks
  [db-before ids]
  (let [roots (selected-block-roots db-before ids)
        plans (mapv #(delete-root->restore-plan db-before %) roots)]
    (when (and (seq roots)
               (every? some? plans))
      (->> plans
           (mapv #(to-insert-op db-before %))
           seq))))

(defn- move-root->restore-op
  [db-before root]
  (let [root-id (:db/id root)
        [target-id sibling?] (block-restore-target root)
        parent-id (some-> root :block/parent :db/id)
        page-id (some-> root :block/page :db/id)
        fallback-target (or (when parent-id (stable-entity-ref db-before parent-id))
                            (when page-id (stable-entity-ref db-before page-id)))]
    (when (and (some? root-id)
               (some? target-id))
      [:move-blocks
       [[(stable-entity-ref db-before root-id)]
        (stable-entity-ref db-before target-id)
        (cond-> {:sibling? (boolean sibling?)}
          sibling?
          (assoc :fallback-target fallback-target))]])))

(defn- build-inverse-move-blocks
  [db-before ids]
  (let [roots (selected-block-roots db-before ids)
        restore-ops (mapv #(move-root->restore-op db-before %) roots)]
    (when (and (seq roots)
               (every? some? restore-ops))
      (seq restore-ops))))

(defn- page-top-level-blocks
  [page]
  (let [page-id (:db/id page)]
    (->> (:block/_page page)
         (filter #(= page-id (some-> % :block/parent :db/id)))
         ldb/sort-by-order
         vec)))

(defn- entity->save-op
  [db-before ent]
  (build-inverse-save-block db-before (into {} ent) nil))

(defn- build-inverse-delete-page
  [db-before page-uuid]
  (when-let [page (d/entity db-before [:block/uuid page-uuid])]
    (let [page-save-op (entity->save-op db-before page)
          hard-retract? (or (ldb/class? page) (ldb/property? page))]
      (if hard-retract?
        (let [create-op [:create-page [(:block/title page)
                                       {:uuid page-uuid
                                        :redirect? false
                                        :split-namespace? true
                                        :tags ()}]]
              root-plans (mapv #(delete-root->restore-plan db-before %) (page-top-level-blocks page))]
          (when (every? some? root-plans)
            (cond-> [create-op]
              page-save-op
              (conj page-save-op)
              (seq root-plans)
              (into (mapv #(to-insert-op db-before %) root-plans)))))
        ;; Soft-deleted pages are moved to Recycle with recycle metadata.
        ;; Use restore semantics instead of save-block to retract recycle markers.
        [:restore-recycled [page-uuid]]))))

(defn- build-strict-inverse-outliner-ops
  [db-before forward-ops]
  (when (seq forward-ops)
    (let [inverse-entries
          (mapv (fn [[op args]]
                  (let [inverse-entry
                        (case op
                          :save-block
                          (let [[block opts] args]
                            (build-inverse-save-block db-before block opts))

                          :insert-blocks
                          (let [[blocks _target-id opts] args]
                            (if (:replace-empty-target? opts)
                              (let [[fst-block & rst-blocks] blocks
                                    delete-ids (->> rst-blocks
                                                    (keep (fn [block]
                                                            (when-let [u (:block/uuid block)]
                                                              [:block/uuid u])))
                                                    vec)
                                    restore-target-op (when fst-block
                                                        (build-inverse-save-block db-before fst-block nil))]
                                (concat
                                 (when (seq delete-ids)
                                   [[:delete-blocks [delete-ids {}]]])
                                 (when restore-target-op
                                   [restore-target-op])))
                              (let [ids (->> blocks
                                             (keep (fn [block]
                                                     (when-let [u (:block/uuid block)]
                                                       [:block/uuid u])))
                                             vec)]
                                (when (seq ids)
                                  [[:delete-blocks [ids {}]]]))))

                          :move-blocks
                          (let [[ids _target-id _opts] args]
                            (build-inverse-move-blocks db-before ids))

                          :indent-outdent-blocks
                          (let [[ids indent? opts] args]
                            [:indent-outdent-blocks [(stable-id-coll db-before ids)
                                                     (not indent?)
                                                     opts]])

                          :move-blocks-up-down
                          (let [[ids up?] args]
                            [:move-blocks-up-down
                             [(stable-id-coll db-before ids)
                              (not up?)]])

                          :delete-blocks
                          (let [[ids _opts] args]
                            (build-inverse-delete-blocks db-before ids))

                          :create-page
                          (let [[_title opts] args]
                            (when-let [page-uuid (:uuid opts)]
                              [:delete-page [page-uuid {}]]))

                          :delete-page
                          (let [[page-uuid _opts] args]
                            (build-inverse-delete-page db-before page-uuid))

                          :set-block-property
                          (inverse-property-op db-before op args)

                          :remove-block-property
                          (inverse-property-op db-before op args)

                          :batch-set-property
                          (inverse-property-op db-before op args)

                          :batch-remove-property
                          (inverse-property-op db-before op args)

                          :create-property-text-block
                          (let [[_block-id _property-id _value opts] args
                                new-block-id (:new-block-id opts)
                                new-block-ref (cond
                                                (vector? new-block-id)
                                                new-block-id

                                                (uuid? new-block-id)
                                                [:block/uuid new-block-id]

                                                :else
                                                (stable-entity-ref db-before new-block-id))]
                            (when new-block-ref
                              [:delete-blocks [[new-block-ref] {}]]))

                          :class-add-property
                          (let [[class-id property-id] args]
                            [:class-remove-property [(stable-entity-ref db-before class-id)
                                                     (stable-entity-ref db-before property-id)]])

                          :class-remove-property
                          (let [[class-id property-id] args]
                            [:class-add-property [(stable-entity-ref db-before class-id)
                                                  (stable-entity-ref db-before property-id)]])

                          :upsert-property
                          (let [[property-id _schema _opts] args]
                            (when (qualified-keyword? property-id)
                              [:delete-page [(common-uuid/gen-uuid :db-ident-block-uuid property-id) {}]]))

                          nil)]
                    (if (and (sequential? inverse-entry)
                             (empty? inverse-entry))
                      nil
                      inverse-entry)))
                forward-ops)]
      ;; Any missing inverse entry means the whole semantic inverse is incomplete.
      ;; Use raw reversed tx instead of partially replaying.
      (when (every? some? inverse-entries)
        (some->> inverse-entries
                 (mapcat #(if (and (sequential? %)
                                   (sequential? (first %)))
                            %
                            [%]))
                 vec
                 seq)))))

(defn- has-replace-empty-target-insert-op?
  [forward-ops]
  (some (fn [[op [_blocks _target-id opts]]]
          (and (= :insert-blocks op)
               (:replace-empty-target? opts)))
        forward-ops))

(defn contains-transact-op?
  [ops]
  (some (fn [[op]]
          (= :transact op))
        ops))

(defn- canonicalize-explicit-outliner-ops
  [db tx-data ops]
  (cond
    (nil? ops)
    nil

    (seq ops)
    (do
      (when-not (every? (fn [[op]]
                          (contains? semantic-outliner-ops op))
                        ops)
        (throw (ex-info "Not every op is semantic" {:ops ops})))
      (->> ops
           (mapcat (fn [op]
                     (let [canonicalized-op (canonicalize-semantic-outliner-op db tx-data op)]
                       (if (and (sequential? canonicalized-op)
                                (sequential? (first canonicalized-op))
                                (keyword? (ffirst canonicalized-op)))
                         canonicalized-op
                         [canonicalized-op]))))
           vec))

    :else
    nil))

(defn- patch-inverse-delete-block-ops
  [inverse-outliner-ops forward-outliner-ops]
  (let [forward-insert-ops* (atom (->> forward-outliner-ops
                                       reverse
                                       (filter #(= :insert-blocks (first %)))
                                       vec))]
    (mapv (fn [[op args :as inverse-op]]
            (if (and (= :delete-blocks op)
                     (seq @forward-insert-ops*))
              (let [[_ [blocks _target-id _opts]] (first @forward-insert-ops*)
                    ids (->> blocks
                             (keep (fn [block]
                                     (when-let [uuid (:block/uuid block)]
                                       [:block/uuid uuid])))
                             vec)]
                (swap! forward-insert-ops* subvec 1)
                (if (seq ids)
                  [:delete-blocks [ids (second args)]]
                  inverse-op))
              inverse-op))
          inverse-outliner-ops)))

(defn- patch-forward-delete-block-op-ids
  [db-before outliner-ops]
  (some->> outliner-ops
           (mapv (fn [[op args :as op-entry]]
                   (if (= :delete-blocks op)
                     (let [[ids opts] args]
                       [:delete-blocks [(stable-id-coll db-before ids) opts]])
                     op-entry)))
           seq
           vec))

(defn- canonicalize-outliner-ops
  [db tx-meta tx-data]
  (let [explicit-forward-ops (:db-sync/forward-outliner-ops tx-meta)
        outliner-ops (:outliner-ops tx-meta)]
    (cond
      (seq explicit-forward-ops)
      (canonicalize-explicit-outliner-ops db tx-data explicit-forward-ops)

      (seq outliner-ops)
      (if (every? (fn [[op]]
                    (contains? semantic-outliner-ops op))
                  outliner-ops)
        (canonicalize-explicit-outliner-ops db tx-data outliner-ops)
        canonical-transact-op)

      (contains? #{:transact :batch-import-edn} (:outliner-op tx-meta))
      canonical-transact-op)))

(defn derive-history-outliner-ops
  [db-before db-after tx-data tx-meta]
  (let [forward-outliner-ops (patch-forward-delete-block-op-ids
                              db-before
                              (canonicalize-outliner-ops db-after tx-meta tx-data))
        forward-outliner-ops (some-> forward-outliner-ops seq vec)
        forward-outliner-ops (when (seq forward-outliner-ops)
                               (if (and (> (count forward-outliner-ops) 1)
                                        (some (fn [[op]] (= :transact op)) forward-outliner-ops))
                                 canonical-transact-op
                                 forward-outliner-ops))
        built-inverse-outliner-ops (some-> (build-strict-inverse-outliner-ops db-before forward-outliner-ops)
                                           seq
                                           vec)
        explicit-inverse-outliner-ops (some-> (canonicalize-explicit-outliner-ops db-after tx-data (:db-sync/inverse-outliner-ops tx-meta))
                                              (patch-inverse-delete-block-ops forward-outliner-ops)
                                              seq
                                              vec)
        inverse-outliner-ops (if (has-replace-empty-target-insert-op? forward-outliner-ops)
                               built-inverse-outliner-ops
                               (cond
                                 (seq built-inverse-outliner-ops)
                                 built-inverse-outliner-ops

                                 (nil? explicit-inverse-outliner-ops)
                                 nil

                                 ;; Treat explicit transact placeholder as "no semantic inverse".
                                 ;; Keep nil so semantic replay must fail-fast when required.
                                 (= canonical-transact-op explicit-inverse-outliner-ops)
                                 nil

                                 :else
                                 explicit-inverse-outliner-ops))
        inverse-outliner-ops (some-> inverse-outliner-ops seq vec)]
    {:forward-outliner-ops forward-outliner-ops
     :inverse-outliner-ops inverse-outliner-ops}))

(defn build-history-action-metadata
  [{:keys [db-before db-after tx-data tx-meta] :as data}]
  (let [{:keys [forward-outliner-ops inverse-outliner-ops]}
        (derive-history-outliner-ops db-before db-after tx-data tx-meta)]
    (when (and (contains? semantic-outliner-ops (:outliner-op tx-meta))
               (not= :restore-recycled (:outliner-op tx-meta))
               (or
                (empty? forward-outliner-ops)
                (empty? inverse-outliner-ops)))
      (log/error ::invalid-outliner-ops {:tx-meta tx-meta
                                         :forward-outliner-ops forward-outliner-ops
                                         :inverse-outliner-ops inverse-outliner-ops})
      (throw (ex-info "Invalid outliner-ops" {:tx-meta tx-meta})))
    ;; (pprint/pprint
    ;;  {:forward-outliner-ops forward-outliner-ops
    ;;   :inverse-outliner-ops inverse-outliner-ops})

    (cond-> (-> data
                (dissoc :db-before :db-after)
                (assoc :db-sync/tx-id (or (:db-sync/tx-id tx-meta) (random-uuid))))
      (seq forward-outliner-ops)
      (assoc :db-sync/forward-outliner-ops forward-outliner-ops)

      (seq inverse-outliner-ops)
      (assoc :db-sync/inverse-outliner-ops inverse-outliner-ops))))
