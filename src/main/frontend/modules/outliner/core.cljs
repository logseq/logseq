(ns frontend.modules.outliner.core
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.impl.entity :as de]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [logseq.db.frontend.schema :as db-schema]
            [frontend.db.conn :as conn]
            [frontend.db.outliner :as db-outliner]
            [frontend.modules.outliner.datascript :as ds]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.outliner.utils :as outliner-u]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.config :as config]
            [logseq.graph-parser.util :as gp-util]
            [cljs.spec.alpha :as s]
            [frontend.format.block :as block]
            [frontend.handler.file-based.property.util :as property-util]
            [frontend.handler.property.util :as pu]
            [frontend.format.mldoc :as mldoc]
            [dommy.core :as dom]
            [goog.object :as gobj]
            [logseq.outliner.pipeline :as outliner-pipeline]))

(s/def ::block-map (s/keys :opt [:db/id :block/uuid :block/page :block/left :block/parent]))

(s/def ::block-map-or-entity (s/or :entity de/entity?
                                   :map ::block-map))

(defrecord Block [data])

(defn block
  [m]
  (assert (or (map? m) (de/entity? m)) (util/format "block data must be map or entity, got: %s %s" (type m) m))
  (if (de/entity? m)
    (->Block {:db/id (:db/id m)
              :block/uuid (:block/uuid m)
              :block/page (:block/page m)
              :block/left (:block/left m)
              :block/parent (:block/parent m)})
    (->Block m)))

(defn get-data
  [block]
  (:data block))

(defn get-block-by-id
  [id]
  (let [c (conn/get-db false)
        r (db-outliner/get-by-id c (outliner-u/->block-lookup-ref id))]
    (when r (->Block r))))

(defn- get-by-parent-&-left
  [parent-uuid left-uuid]
  (let [parent-id (:db/id (db/entity [:block/uuid parent-uuid]))
        left-id (:db/id (db/entity [:block/uuid left-uuid]))]
    (some->
     (db-model/get-by-parent-&-left (conn/get-db) parent-id left-id)
     :db/id
     db/pull
     block)))

(defn block-with-timestamps
  [block]
  (let [updated-at (util/time-ms)
        block (cond->
                (assoc block :block/updated-at updated-at)
                (nil? (:block/created-at block))
                (assoc :block/created-at updated-at))]
    block))

(defn block-with-updated-at
  [block]
  (let [updated-at (util/time-ms)]
    (assoc block :block/updated-at updated-at)))

(defn- remove-orphaned-page-refs!
  [db-id txs-state old-refs new-refs]
  (when (not= old-refs new-refs)
    (let [new-refs (set (map (fn [ref]
                               (or (:block/name ref)
                                   (and (:db/id ref)
                                        (:block/name (db/entity (:db/id ref)))))) new-refs))
          old-pages (->> (map :db/id old-refs)
                         (db-model/get-entities-by-ids)
                         (remove (fn [e] (contains? new-refs (:block/name e))))
                         (map :block/name)
                         (remove nil?))
          orphaned-pages (when (seq old-pages)
                           (db-model/get-orphaned-pages {:pages old-pages
                                                         :empty-ref-f (fn [page]
                                                                        (let [refs (:block/_refs page)]
                                                                          (or (zero? (count refs))
                                                                              (= #{db-id} (set (map :db/id refs))))))}))]
      (when (seq orphaned-pages)
        (let [tx (mapv (fn [page] [:db/retractEntity (:db/id page)]) orphaned-pages)]
          (swap! txs-state (fn [state] (vec (concat state tx)))))))))

(defn- update-page-when-save-block
  [txs-state block-entity m]
  (when-let [e (:block/page block-entity)]
          (let [m' (cond-> {:db/id (:db/id e)
                            :block/updated-at (util/time-ms)}
                     (not (:block/created-at e))
                     (assoc :block/created-at (util/time-ms)))
                txs (if (or (:block/pre-block? block-entity)
                            (:block/pre-block? m))
                      (let [properties (:block/properties m)
                            alias (set (:alias properties))
                            tags (set (:tags properties))
                            alias (map (fn [p] {:block/name (util/page-name-sanity-lc p)}) alias)
                            tags (map (fn [p] {:block/name (util/page-name-sanity-lc p)}) tags)
                            deleteable-page-attributes {:block/alias alias
                                                        :block/tags tags
                                                        :block/properties properties
                                                        :block/properties-text-values (:block/properties-text-values m)}
                            ;; Retract page attributes to allow for deletion of page attributes
                            page-retractions
                            (mapv #(vector :db/retract (:db/id e) %) (keys deleteable-page-attributes))]
                        (conj page-retractions (merge m' deleteable-page-attributes)))
                      [m'])]
            (swap! txs-state into txs))))

(defn- remove-orphaned-refs-when-save
  [txs-state block-entity m]
  (when-not (config/db-based-graph? (state/get-current-repo))
    (let [remove-self-page #(remove (fn [b]
                                      (= (:db/id b) (:db/id (:block/page block-entity)))) %)
          old-refs (remove-self-page (:block/refs block-entity))
          new-refs (remove-self-page (:block/refs m))]
      (remove-orphaned-page-refs! (:db/id block-entity) txs-state old-refs new-refs))))

(defn- get-last-child-or-self
  [block]
  (let [last-child (some-> (db-model/get-block-last-direct-child (conn/get-db) (:db/id block) true)
                           db/entity)
        target (or last-child block)]
    [target (some? last-child)]))

(declare move-blocks)

(defn- remove-macros-when-save
  [repo txs-state block-entity]
  (swap! txs-state (fn [txs]
                     (vec (concat txs
                                  ;; Only delete if last reference
                                  (keep #(when (<= (count (:block/_macros (db/entity repo (:db/id %))))
                                                   1)
                                           (vector :db.fn/retractEntity (:db/id %)))
                                        (:block/macros block-entity)))))))

(defn- create-object-when-save
  [txs-state block-entity m structured-tags?]
  (if structured-tags?
    (let [content (state/get-edit-content)
          linked-page (some-> content mldoc/extract-plain)
          sanity-linked-page (some-> linked-page util/page-name-sanity-lc)
          linking-page? (and (not (string/blank? sanity-linked-page))
                             @(:editor/create-page? @state/state))]
      (if linking-page?
        (let [existing-ref-id (some (fn [r]
                                      (when (= sanity-linked-page (:block/name r))
                                        (:block/uuid r)))
                                    (:block/refs m))
              page-m (block/page-name->map linked-page (or existing-ref-id true))
              _ (when-not (db/entity [:block/uuid (:block/uuid page-m)])
                  (db/transact! [page-m]))
              merge-tx (let [children (:block/_parent block-entity)
                             page (db/entity [:block/uuid (:block/uuid page-m)])
                             [target sibling?] (get-last-child-or-self page)]
                         (when (seq children)
                           (:tx-data
                            (move-blocks children target
                                         {:sibling? sibling?
                                          :outliner-op :move-blocks}))))]
          (swap! txs-state (fn [txs]
                             (concat txs
                                     [(assoc page-m
                                             :block/tags (:block/tags m)
                                             :block/format :markdown
                                             :block/type "object")
                                      {:db/id (:db/id block-entity)
                                       :block/content ""
                                       :block/refs []
                                       :block/link [:block/uuid (:block/uuid page-m)]}]
                                     merge-tx))))
        (swap! txs-state (fn [txs]
                           (concat txs
                                   [{:db/id (:db/id block-entity)
                                     :block/type "object"}])))))
    (reset! (:editor/create-page? @state/state) false)))

(defn rebuild-block-refs
  [repo block new-properties & {:keys [skip-content-parsing?]}]
  (let [property-key-refs (keys new-properties)
        property-value-refs (->> (vals new-properties)
                                 (mapcat (fn [v]
                                           (cond
                                             (and (coll? v) (uuid? (first v)))
                                             v

                                             (uuid? v)
                                             (if (get-in (db/entity repo [:block/uuid v]) [:block/metadata :created-from-property])
                                               ;; don't reference hidden block property values
                                               []
                                               [v])

                                             (and (coll? v) (string? (first v)))
                                             (mapcat block/extract-refs-from-text v)

                                             (string? v)
                                             (block/extract-refs-from-text v)

                                             :else
                                             nil))))
        property-refs (->> (concat property-key-refs property-value-refs)
                           (map (fn [id-or-map] (if (uuid? id-or-map) {:block/uuid id-or-map} id-or-map)))
                           (remove (fn [b] (nil? (db/entity [:block/uuid (:block/uuid b)])))))
        content-refs (when-not skip-content-parsing?
                       (some-> (:block/content block) block/extract-refs-from-text))]
    (concat property-refs content-refs)))

(defn- rebuild-refs
  [repo txs-state block m]
  (when (config/db-based-graph? repo)
    (let [refs (->> (rebuild-block-refs repo block (:block/properties block)
                                        :skip-content-parsing? true)
                    (concat (:block/refs m)))]
      (swap! txs-state (fn [txs] (concat txs [{:db/id (:db/id block)
                                               :block/refs refs}]))))))

(defn- fix-tag-ids
  [m]
  (let [refs (set (map :block/name (seq (:block/refs m))))
        tags (seq (:block/tags m))]
    (if (and refs tags)
      (update m :block/tags (fn [tags]
                              (map (fn [tag]
                                     (if (contains? refs (:block/name tag))
                                       (assoc tag :block/uuid
                                              (:block/uuid
                                               (first (filter (fn [r] (= (:block/name tag)
                                                                         (:block/name r)))
                                                              (:block/refs m)))))
                                       tag))
                                   tags)))
      m)))

;; -get-id, -get-parent-id, -get-left-id return block-id
;; the :block/parent, :block/left should be datascript lookup ref

(extend-type Block
  tree/INode
  (-get-id [this]
    (or
     (when-let [block-id (get-in this [:data :block/uuid])]
       block-id)
     (when-let [db-id (get-in this [:data :db/id])]
       (let [uuid (:block/uuid (db/pull db-id))]
         (if uuid
           uuid
           (let [new-id (db/new-block-id)]
             (db/transact! [{:db/id db-id
                             :block/uuid new-id}])
             new-id))))))

  (-get-parent-id [this]
    (-> (get-in this [:data :block/parent])
        (outliner-u/->block-id)))

  (-get-left-id [this]
    (-> (get-in this [:data :block/left])
        (outliner-u/->block-id)))

  (-set-left-id [this left-id]
    (outliner-u/check-block-id left-id)
    (update this :data assoc :block/left [:block/uuid left-id]))

  (-get-parent [this]
    (when-let [parent-id (tree/-get-parent-id this)]
      (get-block-by-id parent-id)))

  (-get-left [this]
    (let [left-id (tree/-get-left-id this)]
      (get-block-by-id left-id)))

  (-get-right [this]
    (let [left-id (tree/-get-id this)
          parent-id (tree/-get-parent-id this)]
      (get-by-parent-&-left parent-id left-id)))

  (-get-down [this]
    (let [parent-id (tree/-get-id this)]
      (get-by-parent-&-left parent-id parent-id)))

  (-save [this txs-state]
    (assert (ds/outliner-txs-state? txs-state)
            "db should be satisfied outliner-tx-state?")
    (let [m (-> (:data this)
                (dissoc :block/children :block/meta :block.temp/top? :block.temp/bottom?
                        :block/title :block/body :block/level)
                gp-util/remove-nils
                block-with-timestamps
                fix-tag-ids)
          repo (state/get-current-repo)
          db-based? (config/db-based-graph? repo)
          id (:db/id (:data this))
          block-entity (db/entity id)
          structured-tags? (and db-based? (seq (:block/tags m)))
          m (if (:block/content m)
              (update m :block/content
                      (fn [content]
                        (mldoc/content-without-tags content
                                                    (->>
                                                     (map
                                                      (fn [tag]
                                                        (when (:block/uuid tag)
                                                          (str config/page-ref-special-chars (:block/uuid tag))))
                                                      (:block/tags m))
                                                     (remove nil?)))))
              m)
          m-without-tags (if db-based? (dissoc m :block/tags) m)]
      (when id
        ;; Retract attributes to prepare for tx which rewrites block attributes
        (let [retract-attributes (when db-based?
                                   (remove #{:block/tags :block/properties} db-schema/retract-attributes))]
          (swap! txs-state (fn [txs]
                             (vec
                              (concat txs
                                      (map (fn [attribute]
                                             [:db/retract id attribute])
                                           retract-attributes))))))

        ;; Update block's page attributes
        (update-page-when-save-block txs-state block-entity m-without-tags)
        ;; Remove macros as they are replaced by new ones
        (remove-macros-when-save repo txs-state block-entity)

        ;; Remove orphaned refs from block
        (remove-orphaned-refs-when-save txs-state block-entity m-without-tags))

      ;; handle others txs
      (let [other-tx (:db/other-tx m)]
        (when (seq other-tx)
          (swap! txs-state (fn [txs]
                             (vec (concat txs other-tx)))))
        (swap! txs-state conj
               (dissoc m-without-tags :db/other-tx)))

      (create-object-when-save txs-state block-entity m structured-tags?)

      (rebuild-refs repo txs-state block-entity m)

      this))

  (-del [this txs-state children?]
    (assert (ds/outliner-txs-state? txs-state)
            "db should be satisfied outliner-tx-state?")
    (let [block-id (tree/-get-id this)
          ids (set (if children?
                     (let [children (db/get-block-children (state/get-current-repo) block-id)
                           children-ids (map :block/uuid children)]
                       (conj children-ids block-id))
                     [block-id]))
          txs (map (fn [id] [:db.fn/retractEntity [:block/uuid id]]) ids)
          txs (if-not children?
                (let [immediate-children (db/get-block-immediate-children (state/get-current-repo) block-id)]
                  (if (seq immediate-children)
                    (let [left-id (tree/-get-id (tree/-get-left this))]
                      (concat txs
                              (map-indexed (fn [idx child]
                                             (let [parent [:block/uuid left-id]]
                                               (cond->
                                                {:db/id (:db/id child)
                                                 :block/parent parent}
                                                 (zero? idx)
                                                 (assoc :block/left parent))))
                                           immediate-children)))
                    txs))
                txs)
          page-tx (let [block (db/entity [:block/uuid block-id])]
                    (when (:block/pre-block? block)
                      (let [id (:db/id (:block/page block))]
                        [[:db/retract id :block/properties]
                         [:db/retract id :block/properties-order]
                         [:db/retract id :block/properties-text-values]
                         [:db/retract id :block/alias]
                         [:db/retract id :block/tags]])))]
      (swap! txs-state concat txs page-tx)
      block-id))

  (-get-children [this]
    (let [parent-id (tree/-get-id this)
          children (db-model/get-block-immediate-children (state/get-current-repo) parent-id)]
      (map block children))))

(defn get-right-sibling
  [db-id]
  (when db-id
    (db-model/get-right-sibling (conn/get-db) db-id)))

(defn- assoc-level-aux
  [tree-vec children-key init-level]
  (map (fn [block]
         (let [children (get block children-key)
               children' (assoc-level-aux children children-key (inc init-level))]
           (cond-> (assoc block :block/level init-level)
             (seq children')
             (assoc children-key children')))) tree-vec))

(defn- assoc-level
  [children-key tree-vec]
  (assoc-level-aux tree-vec children-key 1))

(defn- assign-temp-id
  [blocks replace-empty-target? target-block]
  (map-indexed (fn [idx block]
                 (let [replacing-block? (and replace-empty-target? (zero? idx))
                       db-id (if replacing-block?
                               (:db/id target-block)
                               (dec (- idx)))]
                   (cond-> (assoc block :db/id db-id)
                     (and replacing-block? (:block/uuid target-block))
                     (assoc :block/uuid (:block/uuid target-block))))) blocks))

(defn- find-outdented-block-prev-hop
  [outdented-block blocks]
  (let [blocks (reverse
                (take-while #(not= (:db/id outdented-block)
                                   (:db/id %)) blocks))
        blocks (drop-while #(= (:db/id (:block/parent outdented-block)) (:db/id (:block/parent %))) blocks)]
    (when (seq blocks)
      (loop [blocks blocks
             matched (first blocks)]
        (if (= (:block/parent (first blocks)) (:block/parent matched))
          (recur (rest blocks) (first blocks))
          matched)))))

(defn- get-id
  [x]
  (cond
    (map? x)
    (:db/id x)

    (vector? x)
    (second x)

    :else
    x))

(defn- compute-block-parent
  [block parent target-block prev-hop top-level? sibling? get-new-id outliner-op replace-empty-target? idx]
  (cond
    ;; replace existing block
    (and (contains? #{:paste :insert-blocks} outliner-op)
         replace-empty-target?
         (string/blank? (:block/content target-block))
         (zero? idx))
    (get-id (:block/parent target-block))

    prev-hop
    (:db/id (:block/parent prev-hop))

    top-level?
    (if sibling?
      (:db/id (:block/parent target-block))
      (:db/id target-block))

    :else
    (get-new-id block parent)))

(defn- compute-block-left
  [blocks block left target-block prev-hop idx replace-empty-target? left-exists-in-blocks? get-new-id]
  (cond
    (zero? idx)
    (if replace-empty-target?
      (:db/id (:block/left target-block))
      (:db/id target-block))

    (and prev-hop (not left-exists-in-blocks?))
    (:db/id (:block/left prev-hop))

    :else
    (or (get-new-id block left)
        (get-new-id block (nth blocks (dec idx))))))

(defn- get-left-nodes
  [node limit]
  (let [parent (tree/-get-parent node)]
    (loop [node node
           limit limit
           result []]
      (if (zero? limit)
        result
        (if-let [left (tree/-get-left node)]
          (if-not (= left parent)
            (recur left (dec limit) (conj result (tree/-get-id left)))
            result)
          result)))))

(defn- page-first-child?
  [block]
  (= (:block/left block)
     (:block/page block)))

(defn- page-block?
  [block]
  (some? (:block/name block)))

;;; ### public utils

(defn tree-vec-flatten
  "Converts a `tree-vec` to blocks with `:block/level`.
  A `tree-vec` example:
  [{:id 1, :children [{:id 2,
                       :children [{:id 3}]}]}
   {:id 4, :children [{:id 5}
                      {:id 6}]}]"
  ([tree-vec]
   (tree-vec-flatten tree-vec :children))
  ([tree-vec children-key]
   (->> tree-vec
        (assoc-level children-key)
        (mapcat #(tree-seq map? children-key %))
        (map #(dissoc % :block/children)))))

(defn save-block
  "Save the `block`."
  [block']
  {:pre [(map? block')]}
  (let [txs-state (atom [])]
    (tree/-save (block block') txs-state)
    {:tx-data @txs-state}))

(defn blocks-with-level
  "Calculate `:block/level` for all the `blocks`. Blocks should be sorted already."
  [blocks]
  {:pre [(seq blocks)]}
  (let [blocks (if (sequential? blocks) blocks [blocks])
        root (assoc (first blocks) :block/level 1)]
    (loop [m [root]
           blocks (rest blocks)]
      (if (empty? blocks)
        m
        (let [block (first blocks)
              parent (:block/parent block)
              parent-level (when parent
                             (:block/level
                              (first
                               (filter (fn [x]
                                         (or
                                          (and (map? parent)
                                               (= (:db/id x) (:db/id parent)))
                                          ;; lookup
                                          (and (vector? parent)
                                               (= (:block/uuid x) (second parent))))) m))))
              level (if parent-level
                      (inc parent-level)
                      1)
              block (assoc block :block/level level)
              m' (vec (conj m block))]
          (recur m' (rest blocks)))))))

(defn- get-original-block-by-dom
  [node]
  (when-let [id (some-> node
                        (gobj/get "parentNode")
                        (util/rec-get-node "ls-block")
                        (dom/attr "originalblockid")
                        uuid)]
    (db/entity [:block/uuid id])))

(defn get-original-block
  "Get the original block from the current editing block or selected blocks"
  [linked-block]
  (cond
    (and
     (= (:block/uuid linked-block)
        (:block/uuid (state/get-edit-block)))
     (state/get-input)) ; editing block
    (get-original-block-by-dom (state/get-input))

    (seq (state/get-selection-blocks))
    (->> (state/get-selection-blocks)
         (remove nil?)
         (keep #(when-let [id (dom/attr % "blockid")]
                  (when (= (uuid id) (:block/uuid linked-block))
                    (when-let [original-id (some-> (dom/attr % "originalblockid") uuid)]
                      (db/entity [:block/uuid original-id])))))
         ;; FIXME: what if there're multiple same blocks in the selection
         first)))

(defn get-top-level-blocks
  "Get only the top level blocks."
  [blocks]
  {:pre [(seq blocks)]}
  (let [level-blocks (blocks-with-level blocks)]
    (->> (filter (fn [b] (= 1 (:block/level b))) level-blocks)
         (map (fn [b]
                (let [original (get-original-block b)]
                  (or (and original (db/pull (:db/id original))) b)))))))

(defn- get-right-siblings
  "Get `node`'s right siblings."
  [node]
  {:pre [(tree/satisfied-inode? node)]}
  (when-let [parent (tree/-get-parent node)]
    (let [children (tree/-get-children parent)]
      (->> (split-with #(not= (tree/-get-id node) (tree/-get-id %)) children)
           last
           rest))))

(defn- blocks-with-ordered-list-props
  [blocks target-block sibling?]
  (let [target-block (if sibling? target-block (some-> target-block :db/id db/pull block tree/-get-down :data))
        list-type-fn (fn [block] (pu/get-property block :logseq.order-list-type))
        k (pu/get-pid :logseq.order-list-type)]
    (if-let [list-type (and target-block (list-type-fn target-block))]
      (mapv
       (fn [{:block/keys [content format] :as block}]
         (cond-> block
           (and (some? (:block/uuid block))
                (nil? (list-type-fn block)))
           (update :block/properties assoc k list-type)

           (not (config/db-based-graph? (state/get-current-repo)))
           (assoc :block/content (property-util/insert-property format content :logseq.order-list-type list-type))))
       blocks)
      blocks)))

;;; ### insert-blocks, delete-blocks, move-blocks

(defn fix-top-level-blocks
  "Blocks with :block/level"
  [blocks]
  (let [top-level-blocks (filter #(= (:block/level %) 1) blocks)
        id->block (zipmap (map :db/id top-level-blocks) top-level-blocks)
        uuid->block (zipmap (map :block/uuid top-level-blocks) top-level-blocks)]
    (if (every? (fn [block]
                  (let [left (:block/left block)
                        id (if (map? left) (:db/id left) (second left))]
                    (some? (or (get id->block id) (get uuid->block id))))) (rest top-level-blocks))
      ;; no need to fix
      blocks
      (loop [blocks blocks
             last-top-level-block nil
             result []]
        (if-let [block (first blocks)]
          (if (= 1 (:block/level block))
            (let [block' (assoc block
                                :block/left {:db/id (:db/id last-top-level-block)}
                                :block/parent (:block/parent last-top-level-block))]
              (recur (rest blocks) block (conj result block')))
            (recur (rest blocks) last-top-level-block (conj result block)))
          result)))))

(defn- insert-blocks-aux
  [blocks target-block {:keys [sibling? replace-empty-target? keep-uuid? move? outliner-op]}]
  (let [block-uuids (map :block/uuid blocks)
        ids (set (map :db/id blocks))
        uuids (zipmap block-uuids
                      (if keep-uuid?
                        block-uuids
                        (repeatedly random-uuid)))
        uuids (if (and (not keep-uuid?) replace-empty-target?)
                (assoc uuids (:block/uuid (first blocks)) (:block/uuid target-block))
                uuids)
        id->new-uuid (->> (map (fn [block] (when-let [id (:db/id block)]
                                             [id (get uuids (:block/uuid block))])) blocks)
                          (into {}))
        target-page (or (:db/id (:block/page target-block))
                        ;; target block is a page itself
                        (:db/id target-block))
        get-new-id (fn [block lookup]
                     (cond
                       (or (map? lookup) (vector? lookup) (de/entity? lookup))
                       (when-let [uuid (if (and (vector? lookup) (= (first lookup) :block/uuid))
                                         (get uuids (last lookup))
                                         (get id->new-uuid (:db/id lookup)))]
                         [:block/uuid uuid])

                       (integer? lookup)
                       lookup

                       :else
                       (throw (js/Error. (str "[insert-blocks] illegal lookup: " lookup ", block: " block)))))
        indent-outdent? (= outliner-op :indent-outdent-blocks)]
    (map-indexed (fn [idx {:block/keys [parent left] :as block}]
                   (when-let [uuid (get uuids (:block/uuid block))]
                     (let [top-level? (= (:block/level block) 1)
                           outdented-block? (and indent-outdent?
                                                 top-level?
                                                 (not= (:block/parent block) (:block/parent target-block)))
                           prev-hop (if outdented-block? (find-outdented-block-prev-hop block blocks) nil)
                           left-exists-in-blocks? (contains? ids (:db/id (:block/left block)))
                           parent (compute-block-parent block parent target-block prev-hop top-level? sibling? get-new-id outliner-op replace-empty-target? idx)
                           left (compute-block-left blocks block left target-block prev-hop idx replace-empty-target? left-exists-in-blocks? get-new-id)]
                       (cond->
                        (merge block {:block/uuid uuid
                                      :block/page target-page
                                      :block/parent parent
                                      :block/left left})
                         ;; We'll keep the original `:db/id` if it's a move operation,
                         ;; e.g. internal cut or drag and drop shouldn't change the ids.
                         (not move?)
                         (dissoc :db/id)))))
                 blocks)))

(defn- get-target-block
  [blocks target-block {:keys [outliner-op indent? sibling? up?]}]
  (when-let [block (if (:db/id target-block)
                     (db/entity (:db/id target-block))
                     (when (:block/uuid target-block)
                       (db/entity [:block/uuid (:block/uuid target-block)])))]
    [block sibling?]
    (let [linked (:block/link block)
          up-down? (= outliner-op :move-blocks-up-down)
          result (cond
                   up-down?
                   (if sibling?
                     [block sibling?]
                     (let [target (or linked block)]
                       (if (and up?
                                ;; target is not any parent of the first block
                                (not= (:db/id (:block/parent (first blocks)))
                                      (:db/id target))
                                (not= (:db/id (:block/parent
                                               (db/entity (:db/id (:block/parent (first blocks))))))
                                      (:db/id target)))
                         (get-last-child-or-self target)
                         [target false])))

                   (and (= outliner-op :indent-outdent-blocks) (not indent?))
                   [block sibling?]

                   (contains? #{:insert-blocks :move-blocks} outliner-op)
                   [block sibling?]

                   linked
                   (get-last-child-or-self linked)

                   :else
                   [block sibling?])]
      result)))

(defn insert-blocks
  "Insert blocks as children (or siblings) of target-node.
  Args:
    `blocks`: blocks should be sorted already.
    `target-block`: where `blocks` will be inserted.
    Options:
      `sibling?`: as siblings (true) or children (false).
      `keep-uuid?`: whether to replace `:block/uuid` from the parameter `blocks`.
                    For example, if `blocks` are from internal copy, the uuids
                    need to be changed, but there's no need for internal cut or drag & drop.
      `outliner-op`: what's the current outliner operation.
      `replace-empty-target?`: If the `target-block` is an empty block, whether
                               to replace it, it defaults to be `false`.
      `update-timestamps?`: whether to update `blocks` timestamps.
    ``"
  [blocks target-block {:keys [_sibling? keep-uuid? outliner-op replace-empty-target? update-timestamps?] :as opts
                        :or {update-timestamps? true}}]
  {:pre [(seq blocks)
         (s/valid? ::block-map-or-entity target-block)]}
  (let [[target-block' sibling?] (get-target-block blocks target-block opts)
        _ (assert (some? target-block') (str "Invalid target: " target-block))
        sibling? (if (page-block? target-block') false sibling?)
        move? (contains? #{:move-blocks :move-blocks-up-down :indent-outdent-blocks} outliner-op)
        keep-uuid? (if move? true keep-uuid?)
        replace-empty-target? (if (and (some? replace-empty-target?)
                                       (:block/content target-block')
                                       (string/blank? (:block/content target-block')))
                                replace-empty-target?
                                (and sibling?
                                     (:block/content target-block')
                                     (string/blank? (:block/content target-block'))
                                     (> (count blocks) 1)
                                     (not move?)))
        blocks' (cond->>
                 (-> blocks
                     blocks-with-level
                     (blocks-with-ordered-list-props target-block sibling?))
                  (= outliner-op :paste)
                  fix-top-level-blocks
                  update-timestamps?
                  (mapv (fn [b] (block-with-timestamps (dissoc b :block/created-at :block/updated-at))))
                  true
                  (mapv block-with-timestamps))
        insert-opts {:sibling? sibling?
                     :replace-empty-target? replace-empty-target?
                     :keep-uuid? keep-uuid?
                     :move? move?
                     :outliner-op outliner-op}
        tx (insert-blocks-aux blocks' target-block' insert-opts)]
    (if (some (fn [b] (or (nil? (:block/parent b)) (nil? (:block/left b)))) tx)
      (do
        (state/pub-event! [:capture-error {:error "Outliner invalid structure"
                                           :payload {:type :outliner/invalid-structure
                                                     :opt opts
                                                     :data (mapv #(dissoc % :block/content) tx)}}])
        (throw (ex-info "Invalid outliner data"
                        {:opts insert-opts
                         :tx (vec tx)
                         :blocks (vec blocks)
                         :target-block target-block'})))
      (let [uuids-tx (->> (map :block/uuid tx)
                          (remove nil?)
                          (map (fn [uuid] {:block/uuid uuid})))
            tx (if move?
                 tx
                 (assign-temp-id tx replace-empty-target? target-block'))
            target-node (block target-block')
            next (if sibling?
                   (tree/-get-right target-node)
                   (tree/-get-down target-node))
            next-tx (when (and next
                               (if move? (not (contains? (set (map :db/id blocks)) (:db/id (:data next)))) true))
                      (when-let [left (last (filter (fn [b] (= 1 (:block/level b))) tx))]
                        [{:block/uuid (tree/-get-id next)
                          :block/left (:db/id left)}]))
            full-tx (util/concat-without-nil (if (and keep-uuid? replace-empty-target?) (rest uuids-tx) uuids-tx) tx next-tx)]
        (when (and replace-empty-target? (state/editing?))
          (state/set-edit-content! (state/get-edit-input-id) (:block/content (first blocks))))
        {:tx-data full-tx
         :blocks  tx}))))

(defn- build-move-blocks-next-tx
  [target-block blocks {:keys [sibling? _non-consecutive-blocks?]}]
  (let [top-level-blocks (get-top-level-blocks blocks)
        top-level-blocks-ids (set (map :db/id top-level-blocks))
        right-block (get-right-sibling (:db/id (last top-level-blocks)))]
    (when (and right-block
               (not (contains? top-level-blocks-ids (:db/id right-block))))
      (when-let [left (loop [block (:block/left right-block)]
                        (if (contains? top-level-blocks-ids (:db/id block))
                          (recur (:block/left (db/entity (:db/id block))))
                          (:db/id block)))]
        (when-not (and (= left (:db/id target-block)) sibling?)
          {:db/id (:db/id right-block)
           :block/left left})))))

(defn- find-new-left
  [block moved-ids target-block current-block sibling? near-by?]
  (if (= (:db/id target-block) (:db/id (:block/left current-block)))
    (if sibling?
      (db/entity (last moved-ids))
      target-block)
    (let [left (db/entity (:db/id (:block/left block)))]
      (if (contains? (set moved-ids) (:db/id left))
        (find-new-left left moved-ids target-block current-block sibling? near-by?)
        left))))

(defn- fix-non-consecutive-blocks
  [blocks target-block sibling?]
  (when (> (count blocks) 1)
    (let [page-blocks (group-by :block/page blocks)
          near-by? (= (:db/id target-block) (:db/id (:block/left (first blocks))))]
      (->>
       (mapcat (fn [[_page blocks]]
                 (let [blocks (db-model/sort-page-random-blocks blocks)
                       non-consecutive-blocks (->> (conj (db-model/get-non-consecutive-blocks blocks) (last blocks))
                                                   (util/distinct-by :db/id))]
                   (when (seq non-consecutive-blocks)
                     (map-indexed (fn [idx block]
                                    (when-let [right (get-right-sibling (:db/id block))]
                                      (if (and (zero? idx) near-by? sibling?)
                                        {:db/id (:db/id right)
                                         :block/left (:db/id (last blocks))}
                                        (when-let [new-left (find-new-left right (distinct (map :db/id blocks)) target-block block sibling? near-by?)]
                                          {:db/id      (:db/id right)
                                           :block/left (:db/id new-left)}))))
                                  non-consecutive-blocks)))) page-blocks)
       (remove nil?)))))

(defn delete-block
  "Delete block from the tree."
  [txs-state node {:keys [children? children-check?]
                   :or {children-check? true}}]
  (if (and children-check?
           (not children?)
           (first (:block/_parent (db/entity [:block/uuid (:block/uuid (get-data node))]))))
    (throw (ex-info "Block can't be deleted because it still has children left, you can pass `children?` equals to `true`."
                    {:block (get-data node)}))
    (let [right-node (tree/-get-right node)]
      (tree/-del node txs-state children?)
      (when (tree/satisfied-inode? right-node)
        (let [left-node (tree/-get-left node)
              new-right-node (tree/-set-left-id right-node (tree/-get-id left-node))]
          (tree/-save new-right-node txs-state)))
      @txs-state)))

(defn- delete-blocks
  "Delete blocks from the tree.
   Args:
    `children?`: whether to replace `blocks'` children too. "
  [blocks {:keys [children?]
           :or {children? true}
           :as delete-opts}]
  [:pre [(seq blocks)]]
  (let [txs-state (ds/new-outliner-txs-state)
        blocks (get-top-level-blocks blocks)
        block-ids (map (fn [b] [:block/uuid (:block/uuid b)]) blocks)
        start-block (first blocks)
        end-block (last blocks)
        start-node (block start-block)
        end-node (block end-block)
        end-node-parents (->>
                          (db/get-block-parents
                           (state/get-current-repo)
                           (tree/-get-id end-node)
                           {:depth 1000})
                          (map :block/uuid)
                          (set))
        self-block? (contains? end-node-parents (tree/-get-id start-node))]
    (if (or
         (= 1 (count blocks))
         (= start-node end-node)
         self-block?)
      (delete-block txs-state start-node (assoc delete-opts :children? children?))
      (let [sibling? (= (tree/-get-parent-id start-node)
                        (tree/-get-parent-id end-node))
            right-node (tree/-get-right end-node)]
        (when (tree/satisfied-inode? right-node)
          (let [non-consecutive? (seq (db-model/get-non-consecutive-blocks blocks))
                left-node-id (if sibling?
                               (tree/-get-id (tree/-get-left start-node))
                               (let [end-node-left-nodes (get-left-nodes end-node (count block-ids))
                                     parents (->>
                                              (db/get-block-parents
                                               (state/get-current-repo)
                                               (tree/-get-id start-node)
                                               {:depth 1000})
                                              (map :block/uuid)
                                              (set))
                                     result (first (set/intersection (set end-node-left-nodes) parents))]
                                 (when (and (not non-consecutive?) (not result))
                                   (util/pprint {:parents parents
                                                 :end-node-left-nodes end-node-left-nodes}))
                                 result))]
            (when (and (nil? left-node-id) (not non-consecutive?))
              (assert left-node-id
                      (str "Can't find the left-node-id: "
                           (pr-str {:start (db/entity [:block/uuid (tree/-get-id start-node)])
                                    :end (db/entity [:block/uuid (tree/-get-id end-node)])
                                    :right-node (db/entity [:block/uuid (tree/-get-id right-node)])}))))
            (when left-node-id
              (let [new-right-node (tree/-set-left-id right-node left-node-id)]
                (tree/-save new-right-node txs-state)))))
        (doseq [id block-ids]
          (let [node (block (db/pull id))]
            (tree/-del node txs-state true)))
        (let [fix-non-consecutive-tx (fix-non-consecutive-blocks blocks nil false)]
          (swap! txs-state concat fix-non-consecutive-tx))))
    {:tx-data @txs-state}))

(defn- move-to-original-position?
  [blocks target-block sibling? non-consecutive-blocks?]
  (and (not non-consecutive-blocks?)
       (= (:db/id (:block/left (first blocks))) (:db/id target-block))
       (not= (= (:db/id (:block/parent (first blocks)))
                (:db/id target-block))
             sibling?)))

(defn move-blocks
  "Move `blocks` to `target-block` as siblings or children."
  [blocks target-block {:keys [_sibling? _up? outliner-op _indent?]
                        :as opts}]
  [:pre [(seq blocks)
         (s/valid? ::block-map-or-entity target-block)]]
  (let [blocks (map (fn [b] (db/pull [:block/uuid (:block/uuid b)])) blocks)
        blocks (get-top-level-blocks blocks)
        [target-block sibling?] (get-target-block blocks target-block opts)
        non-consecutive-blocks? (seq (db-model/get-non-consecutive-blocks blocks))
        original-position? (move-to-original-position? blocks target-block sibling? non-consecutive-blocks?)]
    (when (and (not (contains? (set (map :db/id blocks)) (:db/id target-block)))
               (not original-position?))
      (let [parents (->> (db/get-block-parents (state/get-current-repo) (:block/uuid target-block) {})
                         (map :db/id)
                         (set))
            move-parents-to-child? (some parents (map :db/id blocks))]
        (when-not move-parents-to-child?
          (let [first-block (first blocks)
                {:keys [tx-data]} (insert-blocks blocks target-block {:sibling? sibling?
                                                                      :outliner-op (or outliner-op :move-blocks)
                                                                      :update-timestamps? false})]
            (when (seq tx-data)
              (let [first-block-page (:db/id (:block/page first-block))
                    target-page (or (:db/id (:block/page target-block))
                                    (:db/id target-block))
                    not-same-page? (not= first-block-page target-page)
                    move-blocks-next-tx [(build-move-blocks-next-tx target-block blocks {:sibling? sibling?
                                                                                         :non-consecutive-blocks? non-consecutive-blocks?})]
                    children-page-tx (when not-same-page?
                                       (let [children-ids (mapcat #(outliner-pipeline/get-block-children-ids (db/get-db (state/get-current-repo)) (:block/uuid %))
                                                                  blocks)]
                                         (map (fn [id] {:block/uuid id
                                                        :block/page target-page}) children-ids)))
                    fix-non-consecutive-tx (->> (fix-non-consecutive-blocks blocks target-block sibling?)
                                                (remove (fn [b]
                                                          (contains? (set (map :db/id move-blocks-next-tx)) (:db/id b)))))
                    full-tx (util/concat-without-nil tx-data move-blocks-next-tx children-page-tx fix-non-consecutive-tx)
                    tx-meta (cond-> {:move-blocks (mapv :db/id blocks)
                                     :move-op outliner-op
                                     :target (:db/id target-block)}
                              not-same-page?
                              (assoc :from-page first-block-page
                                     :target-page target-page))]
                {:tx-data full-tx
                 :tx-meta tx-meta}))))))))

(defn get-current-editing-original-block
  []
  (when-let [input (state/get-input)]
    (get-original-block-by-dom (util/rec-get-node input "ls-block"))))

(defn- get-first-block-original
  []
  (or
   (get-current-editing-original-block)
   (when-let [node (some-> (first (state/get-selection-blocks)))]
     (get-original-block-by-dom node))))

(defn- get-last-block-original
  [last-top-block]
  (or
   (get-current-editing-original-block)
   (when-let [last-block-node (->> (state/get-selection-blocks)
                                   (filter (fn [node]
                                             (= (dom/attr node "blockid") (str (:block/uuid last-top-block)))))
                                   last)]
     (get-original-block-by-dom last-block-node))))

(defn move-blocks-up-down
  "Move blocks up/down."
  [blocks up?]
  {:pre [(seq blocks) (boolean? up?)]}
  (let [top-level-blocks (get-top-level-blocks blocks)
        opts {:outliner-op :move-blocks-up-down}]
    (if up?
      (let [first-block (db/entity (:db/id (first top-level-blocks)))
            first-block-parent (:block/parent first-block)
            left (:block/left first-block)
            left-left (or (:block/left left)
                          (:block/left (get-first-block-original)))
            sibling? (= (:db/id (:block/parent left-left))
                        (:db/id first-block-parent))]
        (when (and left-left
                   (not= (:db/id (:block/page first-block-parent))
                         (:db/id left-left)))
          (move-blocks top-level-blocks left-left (merge opts {:sibling? sibling?
                                                               :up? up?}))))

      (let [last-top-block (last top-level-blocks)
            last-top-block-right (get-right-sibling (:db/id last-top-block))
            right (or
                   last-top-block-right
                   (let [parent (:block/parent last-top-block)
                         parent-id (if (:block/page (db/entity (:db/id parent)))
                                     (:db/id parent)
                                     (:db/id (get-last-block-original last-top-block)))]
                     (some-> parent-id get-right-sibling)))
            sibling? (= (:db/id (:block/parent last-top-block))
                        (:db/id (:block/parent right)))]
        (when right
          (move-blocks blocks right (merge opts {:sibling? sibling?
                                                 :up? up?})))))))

(defn indent-outdent-blocks
  "Indent or outdent `blocks`."
  [blocks indent?]
  {:pre [(seq blocks) (boolean? indent?)]}
  (let [top-level-blocks (get-top-level-blocks blocks)
        non-consecutive-blocks (db-model/get-non-consecutive-blocks top-level-blocks)]
    (when (empty? non-consecutive-blocks)
      (let [first-block (db/entity (:db/id (first top-level-blocks)))
            left (db/entity (:db/id (:block/left first-block)))
            parent (:block/parent first-block)
            db (db/get-db)
            concat-tx-fn (fn [& results]
                           {:tx-data (->> (map :tx-data results)
                                          (apply util/concat-without-nil))
                            :tx-meta (:tx-meta (first results))})
            opts {:outliner-op :indent-outdent-blocks}]
        (if indent?
          (when (and left (not (page-first-child? first-block)))
            (let [last-direct-child-id (db-model/get-block-last-direct-child db (:db/id left))
                  blocks' (drop-while (fn [b]
                                        (= (:db/id (:block/parent b))
                                           (:db/id left)))
                                      top-level-blocks)]
              (when (seq blocks')
                (if last-direct-child-id
                  (let [last-direct-child (db/entity last-direct-child-id)
                        result (move-blocks blocks' last-direct-child (merge opts {:sibling? true
                                                                                   :indent? true}))
                        ;; expand `left` if it's collapsed
                        collapsed-tx (when (:block/collapsed? left)
                                       {:tx-data [{:db/id (:db/id left)
                                                   :block/collapsed? false}]})]
                    (concat-tx-fn result collapsed-tx))
                  (move-blocks blocks' left (merge opts {:sibling? false
                                                         :indent? true}))))))
          (if-let [parent-original (get-first-block-original)]
            (let [blocks' (take-while (fn [b]
                                        (not= (:db/id (:block/parent b))
                                              (:db/id (:block/parent parent))))
                                      top-level-blocks)]
              (move-blocks blocks' parent-original (merge opts {:outliner-op :indent-outdent-blocks
                                                                :sibling? true
                                                                :indent? false})))

            (when (and parent (not (page-block? (db/entity (:db/id parent)))))
              (let [blocks' (take-while (fn [b]
                                          (not= (:db/id (:block/parent b))
                                                (:db/id (:block/parent parent))))
                                        top-level-blocks)
                    result (move-blocks blocks' parent (merge opts {:sibling? true}))]
                (if (state/logical-outdenting?)
                  result
                  ;; direct outdenting (default behavior)
                  (let [last-top-block (db/pull (:db/id (last blocks')))
                        right-siblings (->> (get-right-siblings (block last-top-block))
                                            (map :data))]
                    (if (seq right-siblings)
                      (let [result2 (if-let [last-direct-child-id (db-model/get-block-last-direct-child db (:db/id last-top-block))]
                                      (move-blocks right-siblings (db/entity last-direct-child-id) (merge opts {:sibling? true}))
                                      (move-blocks right-siblings last-top-block (merge opts {:sibling? false})))]
                        (concat-tx-fn result result2))
                      result)))))))))))

;;; ### write-operations have side-effects (do transactions) ;;;;;;;;;;;;;;;;

(def ^:private ^:dynamic *transaction-data*
  "Stores transaction-data that are generated by one or more write-operations,
  see also `frontend.modules.outliner.transaction/transact!`"
  nil)

(def ^:private ^:dynamic #_:clj-kondo/ignore *transaction-opts*
  "Stores transaction opts that are generated by one or more write-operations,
  see also `frontend.modules.outliner.transaction/transact!`"
  nil)

(def ^:private ^:dynamic #_:clj-kondo/ignore *transaction-args*
  "Stores transaction args which can be fetched in all op-transact functions."
  nil)

(defn- op-transact!
  [fn-var & args]
  {:pre [(var? fn-var)]}
  (when (nil? *transaction-data*)
    (throw (js/Error. (str (:name (meta fn-var)) " is not used in (transact! ...)"))))
  (let [result (apply @fn-var args)]
    (conj! *transaction-data* (select-keys result [:tx-data :tx-meta]))
    result))

(defn save-block!
  [block]
  (op-transact! #'save-block block))

(defn insert-blocks!
  [blocks target-block opts]
  (op-transact! #'insert-blocks blocks target-block (assoc opts :outliner-op :insert-blocks)))

(defn delete-blocks!
  [blocks opts]
  (op-transact! #'delete-blocks blocks (assoc opts :outliner-op :delete-blocks)))

(defn move-blocks!
  [blocks target-block sibling?]
  (op-transact! #'move-blocks blocks target-block {:sibling? sibling?
                                                   :outliner-op :move-blocks}))
(defn move-blocks-up-down!
  [blocks up?]
  (op-transact! #'move-blocks-up-down blocks up?))

(defn indent-outdent-blocks!
  [blocks indent?]
  (op-transact! #'indent-outdent-blocks blocks indent?))
