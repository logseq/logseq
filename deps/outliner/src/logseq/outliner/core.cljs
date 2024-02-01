(ns logseq.outliner.core
  "Provides the primary outliner operations and fns"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.outliner.datascript :as ds]
            [logseq.outliner.tree :as otree]
            [logseq.outliner.util :as outliner-u]
            [logseq.common.util :as common-util]
            [malli.core :as m]
            [malli.util :as mu]
            [logseq.db :as ldb]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.property :as gp-property]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.util :as sqlite-util]
            [cljs.pprint :as pprint]
            [logseq.db.frontend.content :as db-content]
            [logseq.common.marker :as common-marker]))

(def ^:private block-map
  (mu/optional-keys
   [:map
    [:db/id :int]
    ;; FIXME: tests use ints when they should use uuids
    [:block/uuid [:or :uuid :int]]
    [:block/left :map]
    [:block/parent :map]
    [:block/page :map]]))

(def ^:private block-map-or-entity
  [:or [:fn de/entity?] block-map])

(defrecord ^:api Block [data])

(defn ^:api block
  [db m]
  (assert (or (map? m) (de/entity? m)) (common-util/format "block data must be map or entity, got: %s %s" (type m) m))
  (let [e (if (or (de/entity? m)
                  (and (:block/uuid m) (:db/id m)))
            m
            (let [eid (if (:block/uuid m)
                        [:block/uuid (:block/uuid m)]
                        (:db/id m))]
              (assert eid "eid doesn't exist")
              (let [entity (d/entity db eid)]
                (assoc m :db/id (:db/id entity)
                       :block/uuid (:block/uuid entity)))))]
    (->Block e)))

(defn ^:api get-data
  [block]
  (:data block))

(defn- get-block-by-id
  [db id]
  (let [r (ldb/get-by-id db (outliner-u/->block-lookup-ref id))]
    (when r (->Block r))))

(defn- get-by-parent-&-left
  [db parent-uuid left-uuid]
  (let [parent-id (:db/id (d/entity db [:block/uuid parent-uuid]))
        left-id (:db/id (d/entity db [:block/uuid left-uuid]))
        entity (ldb/get-by-parent-&-left db parent-id left-id)]
    (when entity
      (block db entity))))

(defn- block-with-timestamps
  [block]
  (let [updated-at (common-util/time-ms)
        block (cond->
               (assoc block :block/updated-at updated-at)
                (nil? (:block/created-at block))
                (assoc :block/created-at updated-at))]
    block))

(defn ^:api block-with-updated-at
  [block]
  (let [updated-at (common-util/time-ms)]
    (assoc block :block/updated-at updated-at)))

(defn- remove-orphaned-page-refs!
  [db db-id txs-state old-refs new-refs]
  (let [old-refs (remove #(some #{"class" "property"} (:block/type %)) old-refs)]
    (when (not= old-refs new-refs)
      (let [new-refs (set (map (fn [ref]
                                 (or (:block/name ref)
                                     (and (:db/id ref)
                                          (:block/name (d/entity db (:db/id ref)))))) new-refs))
            old-pages (->> (map :db/id old-refs)
                           (d/pull-many db '[*])
                           (remove (fn [e] (contains? new-refs (:block/name e))))
                           (map :block/name)
                           (remove nil?))
            orphaned-pages (when (seq old-pages)
                             (ldb/get-orphaned-pages db {:pages old-pages
                                                         :empty-ref-f (fn [page]
                                                                        (let [refs (:block/_refs page)]
                                                                          (or (zero? (count refs))
                                                                              (= #{db-id} (set (map :db/id refs))))))}))]
        (when (seq orphaned-pages)
          (let [tx (mapv (fn [page] [:db/retractEntity (:db/id page)]) orphaned-pages)]
            (swap! txs-state (fn [state] (vec (concat state tx))))))))))

(defn- update-page-when-save-block
  [txs-state block-entity m]
  (when-let [e (:block/page block-entity)]
    (let [m' (cond-> {:db/id (:db/id e)
                      :block/updated-at (common-util/time-ms)}
               (not (:block/created-at e))
               (assoc :block/created-at (common-util/time-ms)))
          txs (if (or (:block/pre-block? block-entity)
                      (:block/pre-block? m))
                (let [properties (:block/properties m)
                      alias (set (:alias properties))
                      tags (set (:tags properties))
                      alias (map (fn [p] {:block/name (common-util/page-name-sanity-lc p)}) alias)
                      tags (map (fn [p] {:block/name (common-util/page-name-sanity-lc p)}) tags)
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
  [db txs-state block-entity m]
  (let [remove-self-page #(remove (fn [b]
                                    (= (:db/id b) (:db/id (:block/page block-entity)))) %)
        old-refs (remove-self-page (:block/refs block-entity))
        new-refs (remove-self-page (:block/refs m))]
    (remove-orphaned-page-refs! db (:db/id block-entity) txs-state old-refs new-refs)))

(defn- get-last-child-or-self
  [db block]
  (let [last-child (some->> (ldb/get-block-last-direct-child-id db (:db/id block) true)
                            (d/entity db))
        target (or last-child block)]
    [target (some? last-child)]))

(declare move-blocks)

(defn- remove-macros-when-save
  [db txs-state block-entity]
  (swap! txs-state (fn [txs]
                     (vec (concat txs
                                  ;; Only delete if last reference
                                  (keep #(when (<= (count (:block/_macros (d/entity db (:db/id %))))
                                                   1)
                                           (when (:db/id %) (vector :db.fn/retractEntity (:db/id %))))
                                        (:block/macros block-entity)))))))

(comment
  (defn- create-linked-page-when-save
   [repo conn db date-formatter txs-state block-entity m tags-has-class?]
   (if tags-has-class?
     (let [content (state/get-edit-content)
           linked-page (some-> content #(gp-block/extract-plain repo %))
           sanity-linked-page (some-> linked-page util/page-name-sanity-lc)
           linking-page? (and (not (string/blank? sanity-linked-page))
                              @(:editor/create-page? @state/state))]
       (when linking-page?
         (let [existing-ref-id (some (fn [r]
                                       (when (= sanity-linked-page (:block/name r))
                                         (:block/uuid r)))
                                     (:block/refs m))
               page-m (gp-block/page-name->map linked-page (or existing-ref-id true)
                                               db true date-formatter)
               _ (when-not (d/entity db [:block/uuid (:block/uuid page-m)])
                   (ldb/transact! conn [page-m]))
               merge-tx (let [children (:block/_parent block-entity)
                              page (d/entity db [:block/uuid (:block/uuid page-m)])
                              [target sibling?] (get-last-child-or-self db page)]
                          (when (seq children)
                            (:tx-data
                             (move-blocks repo conn children target
                                          {:sibling? sibling?
                                           :outliner-op :move-blocks}))))]
           (swap! txs-state (fn [txs]
                              (concat txs
                                      [(assoc page-m
                                              :block/tags (:block/tags m)
                                              :block/format :markdown)
                                       {:db/id (:db/id block-entity)
                                        :block/content ""
                                        :block/refs []
                                        :block/link [:block/uuid (:block/uuid page-m)]}]
                                      merge-tx))))))
     (reset! (:editor/create-page? @state/state) false))))

(defn ^:api rebuild-block-refs
  [repo conn date-formatter block new-properties & {:keys [skip-content-parsing?]}]
  (let [db @conn
        property-key-refs (keys new-properties)
        property-value-refs (->> (vals new-properties)
                                 (mapcat (fn [v]
                                           (cond
                                             (and (coll? v) (uuid? (first v)))
                                             v

                                             (uuid? v)
                                             (when-let [entity (d/entity db [:block/uuid v])]
                                               (let [from-property? (get-in entity [:block/metadata :created-from-property])]
                                                 (if (and from-property? (not (contains? (:block/type entity) "closed value")))
                                                   ;; don't reference hidden block property values except closed values
                                                   []
                                                   [v])))

                                             (and (coll? v) (string? (first v)))
                                             (mapcat #(gp-block/extract-refs-from-text repo db % date-formatter) v)

                                             (string? v)
                                             (gp-block/extract-refs-from-text repo db v date-formatter)

                                             :else
                                             nil))))
        property-refs (->> (concat property-key-refs property-value-refs)
                           (map (fn [id-or-map] (if (uuid? id-or-map) {:block/uuid id-or-map} id-or-map)))
                           (remove (fn [b] (nil? (d/entity db [:block/uuid (:block/uuid b)])))))
        content-refs (when-not skip-content-parsing?
                       (when-let [content (:block/content block)]
                         (gp-block/extract-refs-from-text repo db content date-formatter)))]
    (concat property-refs content-refs)))

(defn- rebuild-refs
  [repo conn date-formatter txs-state block m]
  (when (sqlite-util/db-based-graph? repo)
    (let [refs (->> (rebuild-block-refs repo conn date-formatter block (:block/properties block)
                                        :skip-content-parsing? true)
                    (concat (:block/refs m))
                    (concat (:block/tags m)))]
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

;; TODO: don't parse marker and deprecate typing marker to set status
(defn- db-marker-handle
  [conn m]
  (or
   (let [marker (:block/marker m)
         property (db-property/get-property @conn "status")
         matched-status-id (when marker
                             (->> (get-in property [:block/schema :values])
                                 (some (fn [id]
                                         (let [value-e (d/entity @conn [:block/uuid id])
                                               value (get-in value-e [:block/schema :value])]
                                           (when (= (string/lower-case marker) (string/lower-case value))
                                             id))))))]
     (cond-> m
       matched-status-id
       (update :block/properties assoc (:block/uuid property) matched-status-id)

       matched-status-id
       (update :block/content (fn [content]
                                (common-marker/clean-marker content (get m :block/format :markdown))))
       matched-status-id
       (update :db/other-tx (fn [tx]
                              (if-let [task (d/entity @conn [:block/name "task"])]
                                (conj tx [:db/add (:db/id m) :block/tags (:db/id task)])
                                tx)))

       true
       (dissoc :block/marker :block/priority)))
   m))

(extend-type Block
  otree/INode
  (-get-id [this conn]
    (or
     (when-let [block-id (get-in this [:data :block/uuid])]
       block-id)
     (when-let [data (:data this)]
       (let [uuid (:block/uuid data)]
         (if uuid
           uuid
           (let [new-id (ldb/new-block-id)]
             (ldb/transact! conn [{:db/id (:db/id data)
                                   :block/uuid new-id}])
             new-id))))))

  (-get-parent-id [this conn]
    (when-let [id (:db/id (get-in this [:data :block/parent]))]
      (:block/uuid (d/entity @conn id))))

  (-get-left-id [this conn]
    (when-let [id (:db/id (get-in this [:data :block/left]))]
      (:block/uuid (d/entity @conn id))))

  (-set-left-id [this left-id _conn]
    (outliner-u/check-block-id left-id)
    (update this :data assoc :block/left [:block/uuid left-id]))

  (-get-parent [this conn]
    (when-let [parent-id (otree/-get-parent-id this conn)]
      (get-block-by-id @conn parent-id)))

  (-get-left [this conn]
    (let [left-id (otree/-get-left-id this conn)]
      (get-block-by-id @conn left-id)))

  (-get-right [this conn]
    (let [left-id (otree/-get-id this conn)
          parent-id (otree/-get-parent-id this conn)]
      (get-by-parent-&-left @conn parent-id left-id)))

  (-get-down [this conn]
    (let [parent-id (otree/-get-id this conn)]
      (get-by-parent-&-left @conn parent-id parent-id)))

  (-save [this txs-state conn repo date-formatter]
    (assert (ds/outliner-txs-state? txs-state)
            "db should be satisfied outliner-tx-state?")
    (let [data (:data this)
          data' (if (de/entity? data)
                  (assoc (.-kv ^js data) :db/id (:db/id data))
                  data)
          m (-> data'
                (dissoc :block/children :block/meta :block.temp/top? :block.temp/bottom?
                        :block/title :block/body :block/level :block.temp/fully-loaded?)
                common-util/remove-nils
                block-with-updated-at
                fix-tag-ids)
          db @conn
          db-based? (sqlite-util/db-based-graph? repo)
          db-id (:db/id (:data this))
          block-uuid (:block/uuid (:data this))
          eid (or db-id (when block-uuid [:block/uuid block-uuid]))
          block-entity (d/entity db eid)
          m' (if (and (:block/content m) db-based?)
               (update m :block/content
                       (fn [content]
                         (db-content/content-without-tags
                          content
                          (->>
                           (map
                            (fn [tag]
                              (when (:block/uuid tag)
                                (str db-content/page-ref-special-chars (:block/uuid tag))))
                            (:block/tags m))
                           (remove nil?)))))
               m)
          m (cond->> m'
              db-based?
              (db-marker-handle conn))
          m (if db-based? (dissoc m :block/tags) m)]

      ;; Ensure block UUID never changes
      (when (and db-id block-uuid)
        (let [uuid-not-changed? (= block-uuid (:block/uuid (d/entity db db-id)))]
          (when-not uuid-not-changed?
            (js/console.error "Block UUID shouldn't be changed once created"))
          (assert uuid-not-changed? "Block UUID changed")))

      (when eid
        ;; Retract attributes to prepare for tx which rewrites block attributes
        (when (:block/content m)
          (let [retract-attributes (if db-based?
                                     db-schema/db-version-retract-attributes
                                     db-schema/retract-attributes)]
            (swap! txs-state (fn [txs]
                               (vec
                                (concat txs
                                        (map (fn [attribute]
                                               [:db/retract eid attribute])
                                             retract-attributes)))))))

        ;; Update block's page attributes
        (update-page-when-save-block txs-state block-entity m)
        ;; Remove macros as they are replaced by new ones
        (remove-macros-when-save db txs-state block-entity)
        ;; Remove orphaned refs from block
        (when (and (:block/content m) (not= (:block/content m) (:block/content block-entity)))
          (remove-orphaned-refs-when-save @conn txs-state block-entity m)))

      ;; handle others txs
      (let [other-tx (:db/other-tx m)]
        (when (seq other-tx)
          (swap! txs-state (fn [txs]
                             (vec (concat txs other-tx)))))
        (swap! txs-state conj
               (dissoc m :db/other-tx)))

      (rebuild-refs repo conn date-formatter txs-state block-entity m)

      this))

  (-del [this txs-state children? conn]
    (assert (ds/outliner-txs-state? txs-state)
            "db should be satisfied outliner-tx-state?")
    (let [block-id (otree/-get-id this conn)
          ids (->>
               (if children?
                 (let [children (ldb/get-block-children @conn block-id)
                       children-ids (map :block/uuid children)]
                   (conj children-ids block-id))
                 [block-id])
               (remove nil?))
          txs (map (fn [id] [:db.fn/retractEntity [:block/uuid id]]) ids)
          txs (if-not children?
                (let [immediate-children (ldb/get-block-immediate-children @conn block-id)]
                  (if (seq immediate-children)
                    (let [left-id (otree/-get-id (otree/-get-left this conn) conn)]
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
          page-tx (let [block (d/entity @conn [:block/uuid block-id])]
                    (when (:block/pre-block? block)
                      (let [id (:db/id (:block/page block))]
                        [[:db/retract id :block/properties]
                         [:db/retract id :block/properties-order]
                         [:db/retract id :block/properties-text-values]
                         [:db/retract id :block/alias]
                         [:db/retract id :block/tags]])))]
      (swap! txs-state concat txs page-tx)
      block-id))

  (-get-children [this conn]
    (let [parent-id (otree/-get-id this conn)
          children (ldb/get-block-immediate-children @conn parent-id)]
      (map #(block @conn %) children))))

(defn ^:api get-right-sibling
  [db db-id]
  (when db-id
    (ldb/get-right-sibling db db-id)))

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
  (->> (map-indexed (fn [idx block]
                      (let [replacing-block? (and replace-empty-target? (zero? idx))]
                        (if replacing-block?
                          (let [db-id (or (:db/id block) (dec (- idx)))]
                            (if (seq (:block/_parent target-block)) ; target-block has children
                              ;; update block properties
                              [(assoc block
                                      :db/id (:db/id target-block)
                                      :block/uuid (:block/uuid target-block))]
                              [[:db/retractEntity (:db/id target-block)] ; retract target-block first
                               (assoc block
                                      :db/id db-id
                                      :block/left (:db/id (:block/left target-block)))]))
                          [(assoc block :db/id (dec (- idx)))]))) blocks)
       (apply concat)))

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
  [conn node limit]
  (let [parent (otree/-get-parent node conn)]
    (loop [node node
           limit limit
           result []]
      (if (zero? limit)
        result
        (if-let [left (otree/-get-left node conn)]
          (if-not (= left parent)
            (recur left (dec limit) (conj result (otree/-get-id left conn)))
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

(defn ^:api save-block
  "Save the `block`."
  [repo conn date-formatter block']
  {:pre [(map? block')]}
  (let [txs-state (atom [])]
    (otree/-save (block @conn block') txs-state conn repo date-formatter)
    {:tx-data @txs-state}))

(defn- get-right-siblings
  "Get `node`'s right siblings."
  [conn node]
  {:pre [(otree/satisfied-inode? node)]}
  (when-let [parent (otree/-get-parent node conn)]
    (let [children (otree/-get-children parent conn)]
      (->> (split-with #(not= (otree/-get-id node conn) (otree/-get-id % conn)) children)
           last
           rest))))

(defn- blocks-with-ordered-list-props
  [repo conn blocks target-block sibling?]
  (let [db @conn
        tb (when target-block (block db target-block))
        target-block (if sibling? target-block (when tb (:block (otree/-get-down tb conn))))
        list-type-fn (fn [block] (db-property/get-block-property-value repo db block :logseq.order-list-type))
        k (db-property/get-pid repo db :logseq.order-list-type)]
    (if-let [list-type (and target-block (list-type-fn target-block))]
      (mapv
       (fn [{:block/keys [content format] :as block}]
         (cond-> block
           (and (some? (:block/uuid block))
                (nil? (list-type-fn block)))
           (update :block/properties assoc k list-type)

           (not (sqlite-util/db-based-graph? repo))
           (assoc :block/content (gp-property/insert-property repo format content :logseq.order-list-type list-type))))
       blocks)
      blocks)))

;;; ### insert-blocks, delete-blocks, move-blocks

(defn ^:api fix-top-level-blocks
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
                           left (compute-block-left blocks block left target-block prev-hop idx replace-empty-target? left-exists-in-blocks? get-new-id)
                           m {:db/id (:db/id block)
                              :block/uuid uuid
                              :block/page target-page
                              :block/parent parent
                              :block/left left}]
                       (cond-> (if (de/entity? block)
                                 (assoc m :block/level (:block/level block))
                                 (merge block m))
                           ;; We'll keep the original `:db/id` if it's a move operation,
                           ;; e.g. internal cut or drag and drop shouldn't change the ids.
                         (not move?)
                         (dissoc :db/id)))))
                 blocks)))

(defn- get-target-block
  [db blocks target-block {:keys [outliner-op indent? sibling? up?]}]
  (when-let [block (if (:db/id target-block)
                     (d/entity db (:db/id target-block))
                     (when (:block/uuid target-block)
                       (d/entity db [:block/uuid (:block/uuid target-block)])))]
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
                                               (d/entity db (:db/id (:block/parent (first blocks))))))
                                      (:db/id target)))
                         (get-last-child-or-self db target)
                         [target false])))

                   (and (= outliner-op :indent-outdent-blocks) (not indent?))
                   [block sibling?]

                   (contains? #{:insert-blocks :move-blocks} outliner-op)
                   [block sibling?]

                   linked
                   (get-last-child-or-self db linked)

                   :else
                   [block sibling?])]
      result)))


(defn ^:api blocks-with-level
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

(defn- ^:large-vars/cleanup-todo insert-blocks
  "Insert blocks as children (or siblings) of target-node.
  Args:
    `conn`: db connection.
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
  [repo conn blocks target-block {:keys [_sibling? keep-uuid? outliner-op replace-empty-target? update-timestamps?] :as opts
                                  :or {update-timestamps? true}}]
  {:pre [(seq blocks)
         (m/validate block-map-or-entity target-block)]}
  (let [[target-block' sibling?] (get-target-block @conn blocks target-block opts)
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
        blocks' (let [blocks' (blocks-with-level blocks)]
                  (cond->> (blocks-with-ordered-list-props repo conn blocks' target-block sibling?)
                    (= outliner-op :paste)
                    fix-top-level-blocks
                    update-timestamps?
                    (mapv (fn [b] (block-with-timestamps (dissoc b :block/created-at :block/updated-at))))
                    true
                    (mapv block-with-timestamps)))
        insert-opts {:sibling? sibling?
                     :replace-empty-target? replace-empty-target?
                     :keep-uuid? keep-uuid?
                     :move? move?
                     :outliner-op outliner-op}
        tx' (insert-blocks-aux blocks' target-block' insert-opts)]
    (if (some (fn [b] (or (nil? (:block/parent b)) (nil? (:block/left b)))) tx')
      (throw (ex-info "Invalid outliner data"
                      {:opts insert-opts
                       :tx (vec tx')
                       :blocks (vec blocks)
                       :target-block target-block'}))
      (let [uuids-tx (->> (map :block/uuid tx')
                          (remove nil?)
                          (map (fn [uuid] {:block/uuid uuid})))
            tx (if move?
                 tx'
                 (assign-temp-id tx' replace-empty-target? target-block'))
            target-node (block @conn target-block')
            next (if sibling?
                   (otree/-get-right target-node conn)
                   (otree/-get-down target-node conn))
            next-tx (when (and next
                               (if move? (not (contains? (set (map :db/id blocks)) (:db/id (:data next)))) true))
                      (when-let [left (last (filter (fn [b] (= 1 (:block/level b))) tx))]
                        [{:block/uuid (otree/-get-id next conn)
                          :block/left (:db/id left)}]))
            full-tx (common-util/concat-without-nil (if (and keep-uuid? replace-empty-target?) (rest uuids-tx) uuids-tx) tx next-tx)]
        {:tx-data full-tx
         :blocks  tx}))))

(defn- build-move-blocks-next-tx
  [db target-block blocks {:keys [sibling? _non-consecutive-blocks?]}]
  (let [top-level-blocks blocks
        top-level-blocks-ids (set (map :db/id top-level-blocks))
        right-block (get-right-sibling db (:db/id (last top-level-blocks)))]
    (when (and right-block
               (not (contains? top-level-blocks-ids (:db/id right-block))))
      (when-let [left (loop [block (:block/left right-block)]
                        (if (contains? top-level-blocks-ids (:db/id block))
                          (recur (:block/left (d/entity db (:db/id block))))
                          (:db/id block)))]
        (when-not (and (= left (:db/id target-block)) sibling?)
          {:db/id (:db/id right-block)
           :block/left left})))))

(defn- find-new-left
  [db block moved-ids target-block current-block sibling? near-by?]
  (if (= (:db/id target-block) (:db/id (:block/left current-block)))
    (if sibling?
      (d/entity db (last moved-ids))
      target-block)
    (let [left (d/entity db (:db/id (:block/left block)))]
      (if (contains? (set moved-ids) (:db/id left))
        (find-new-left db left moved-ids target-block current-block sibling? near-by?)
        left))))

(defn- fix-non-consecutive-blocks
  [db blocks target-block sibling?]
  (when (> (count blocks) 1)
    (let [page-blocks (group-by :block/page blocks)
          near-by? (= (:db/id target-block) (:db/id (:block/left (first blocks))))]
      (->>
       (mapcat (fn [[_page blocks]]
                 (let [blocks (ldb/sort-page-random-blocks db blocks)
                       non-consecutive-blocks (->> (conj (ldb/get-non-consecutive-blocks db blocks) (last blocks))
                                                   (common-util/distinct-by :db/id))]
                   (when (seq non-consecutive-blocks)
                     (map-indexed (fn [idx block]
                                    (when-let [right (get-right-sibling db (:db/id block))]
                                      (if (and (zero? idx) near-by? sibling?)
                                        {:db/id (:db/id right)
                                         :block/left (:db/id (last blocks))}
                                        (when-let [new-left (find-new-left db right (distinct (map :db/id blocks)) target-block block sibling? near-by?)]
                                          {:db/id      (:db/id right)
                                           :block/left (:db/id new-left)}))))
                                  non-consecutive-blocks)))) page-blocks)
       (remove nil?)))))

(defn ^:api delete-block
  "Delete block from the tree."
  [repo conn txs-state node {:keys [children? children-check? date-formatter]
                        :or {children-check? true}}]
  (if (and children-check?
           (not children?)
           (first (:block/_parent (d/entity @conn [:block/uuid (:block/uuid (get-data node))]))))
    (throw (ex-info "Block can't be deleted because it still has children left, you can pass `children?` equals to `true`."
                    {:block (get-data node)}))
    (let [right-node (otree/-get-right node conn)]
      (otree/-del node txs-state children? conn)
      (when (otree/satisfied-inode? right-node)
        (let [left-node (otree/-get-left node conn)
              new-right-node (otree/-set-left-id right-node (otree/-get-id left-node conn) conn)]
          (otree/-save new-right-node txs-state conn repo date-formatter)))
      @txs-state)))

(defn- ^:large-vars/cleanup-todo delete-blocks
  "Delete blocks from the tree.
   Args:
    `children?`: whether to replace `blocks'` children too. "
  [repo conn date-formatter blocks {:keys [children?]
                                    :or {children? true}
                                    :as delete-opts}]
  [:pre [(seq blocks)]]
  (let [txs-state (ds/new-outliner-txs-state)
        block-ids (map (fn [b] [:block/uuid (:block/uuid b)]) blocks)
        start-block (first blocks)
        end-block (last blocks)
        start-node (block @conn start-block)
        end-node (block @conn end-block)
        end-node-parents (->>
                          (ldb/get-block-parents
                           @conn
                           (otree/-get-id end-node conn)
                           {:depth 1000})
                          (map :block/uuid)
                          (set))
        self-block? (contains? end-node-parents (otree/-get-id start-node conn))]
    (if (or
         (= 1 (count blocks))
         (= start-node end-node)
         self-block?)
      (delete-block repo conn txs-state start-node (assoc delete-opts :children? children?
                                                          :date-formatter date-formatter))
      (let [sibling? (= (otree/-get-parent-id start-node conn)
                        (otree/-get-parent-id end-node conn))
            right-node (otree/-get-right end-node conn)]
        (when (otree/satisfied-inode? right-node)
          (let [non-consecutive? (seq (ldb/get-non-consecutive-blocks @conn blocks))
                left-node-id (if sibling?
                               (otree/-get-id (otree/-get-left start-node conn) conn)
                               (let [end-node-left-nodes (get-left-nodes conn end-node (count block-ids))
                                     parents (->>
                                              (ldb/get-block-parents
                                               @conn
                                               (otree/-get-id start-node conn)
                                               {:depth 1000})
                                              (map :block/uuid)
                                              (set))
                                     result (first (set/intersection (set end-node-left-nodes) parents))]
                                 (when (and (not non-consecutive?) (not result))
                                   (pprint/pprint {:parents parents
                                                   :end-node-left-nodes end-node-left-nodes}))
                                 result))]
            (when (and (nil? left-node-id) (not non-consecutive?))
              (assert left-node-id
                      (str "Can't find the left-node-id: "
                           (pr-str {:start (d/entity @conn [:block/uuid (otree/-get-id start-node conn)])
                                    :end (d/entity @conn [:block/uuid (otree/-get-id end-node conn)])
                                    :right-node (d/entity @conn [:block/uuid (otree/-get-id right-node conn)])}))))
            (when left-node-id
              (let [new-right-node (otree/-set-left-id right-node left-node-id conn)]
                (otree/-save new-right-node txs-state conn repo date-formatter)))))
        (doseq [id block-ids]
          (let [node (block @conn (d/entity @conn id))]
            (otree/-del node txs-state true conn)))
        (let [fix-non-consecutive-tx (fix-non-consecutive-blocks @conn blocks nil false)]
          (swap! txs-state concat fix-non-consecutive-tx))))
    {:tx-data @txs-state}))

(defn- move-to-original-position?
  [blocks target-block sibling? non-consecutive-blocks?]
  (and (not non-consecutive-blocks?)
       (= (:db/id (:block/left (first blocks))) (:db/id target-block))
       (not= (= (:db/id (:block/parent (first blocks)))
                (:db/id target-block))
             sibling?)))

(defn- move-blocks
  "Move `blocks` to `target-block` as siblings or children."
  [repo conn blocks target-block {:keys [_sibling? _up? outliner-op _indent?]
                                  :as opts}]
  {:pre [(seq blocks)
         (m/validate block-map-or-entity target-block)]}
  (let [db @conn
        [target-block sibling?] (get-target-block db blocks target-block opts)
        non-consecutive-blocks? (seq (ldb/get-non-consecutive-blocks db blocks))
        original-position? (move-to-original-position? blocks target-block sibling? non-consecutive-blocks?)]
    (when (and (not (contains? (set (map :db/id blocks)) (:db/id target-block)))
               (not original-position?))
      (let [parents (->> (ldb/get-block-parents db (:block/uuid target-block) {})
                         (map :db/id)
                         (set))
            move-parents-to-child? (some parents (map :db/id blocks))]
        (when-not move-parents-to-child?
          (let [first-block (first blocks)
                {:keys [tx-data]} (insert-blocks repo conn blocks target-block {:sibling? sibling?
                                                                                :outliner-op (or outliner-op :move-blocks)
                                                                                :update-timestamps? false})]
            (when (seq tx-data)
              (let [first-block-page (:db/id (:block/page first-block))
                    target-page (or (:db/id (:block/page target-block))
                                    (:db/id target-block))
                    not-same-page? (not= first-block-page target-page)
                    move-blocks-next-tx [(build-move-blocks-next-tx db target-block blocks {:sibling? sibling?
                                                                                            :non-consecutive-blocks? non-consecutive-blocks?})]
                    children-page-tx (when not-same-page?
                                       (let [children-ids (mapcat #(ldb/get-block-children-ids db (:block/uuid %))
                                                                  blocks)]
                                         (map (fn [id] {:block/uuid id
                                                        :block/page target-page}) children-ids)))
                    fix-non-consecutive-tx (->> (fix-non-consecutive-blocks db blocks target-block sibling?)
                                                (remove (fn [b]
                                                          (contains? (set (map :db/id move-blocks-next-tx)) (:db/id b)))))
                    full-tx (common-util/concat-without-nil tx-data move-blocks-next-tx children-page-tx fix-non-consecutive-tx)
                    tx-meta (cond-> {:move-blocks (mapv :db/id blocks)
                                     :move-op outliner-op
                                     :target (:db/id target-block)}
                              not-same-page?
                              (assoc :from-page first-block-page
                                     :target-page target-page))]
                {:tx-data full-tx
                 :tx-meta tx-meta}))))))))

(defn- move-blocks-up-down
  "Move blocks up/down."
  [repo conn blocks up?]
  {:pre [(seq blocks) (boolean? up?)]}
  (let [db @conn
        top-level-blocks blocks
        opts {:outliner-op :move-blocks-up-down}]
    (if up?
      (let [first-block (d/entity db (:db/id (first top-level-blocks)))
            first-block-parent (:block/parent first-block)
            left (:block/left first-block)
            left-left (:block/left left)
            sibling? (= (:db/id (:block/parent left-left))
                        (:db/id first-block-parent))]
        (when (and left-left
                   (not= (:db/id (:block/page first-block-parent))
                         (:db/id left-left)))
          (move-blocks repo conn top-level-blocks left-left (merge opts {:sibling? sibling?
                                                                         :up? up?}))))

      (let [last-top-block (last top-level-blocks)
            last-top-block-right (get-right-sibling db (:db/id last-top-block))
            right (or
                   last-top-block-right
                   (let [parent (:block/parent last-top-block)
                         parent-id (when (:block/page (d/entity db (:db/id parent)))
                                     (:db/id parent))]
                     (some->> parent-id (get-right-sibling db))))
            sibling? (= (:db/id (:block/parent last-top-block))
                        (:db/id (:block/parent right)))]
        (when right
          (move-blocks repo conn blocks right (merge opts {:sibling? sibling?
                                                           :up? up?})))))))

(defn- ^:large-vars/cleanup-todo indent-outdent-blocks
  "Indent or outdent `blocks`."
  [repo conn blocks indent? & {:keys [get-first-block-original logical-outdenting?]}]
  {:pre [(seq blocks) (boolean? indent?)]}
  (let [db @conn
        top-level-blocks (map (fn [b] (d/entity db (:db/id b))) blocks)
        non-consecutive-blocks (ldb/get-non-consecutive-blocks db top-level-blocks)]
    (when (empty? non-consecutive-blocks)
      (let [first-block (d/entity db (:db/id (first top-level-blocks)))
            left (d/entity db (:db/id (:block/left first-block)))
            parent (:block/parent first-block)
            concat-tx-fn (fn [& results]
                           {:tx-data (->> (map :tx-data results)
                                          (apply common-util/concat-without-nil))
                            :tx-meta (:tx-meta (first results))})
            opts {:outliner-op :indent-outdent-blocks}]
        (if indent?
          (when (and left (not (page-first-child? first-block)))
            (let [last-direct-child-id (ldb/get-block-last-direct-child-id db (:db/id left))
                  blocks' (drop-while (fn [b]
                                        (= (:db/id (:block/parent b))
                                           (:db/id left)))
                                      top-level-blocks)]
              (when (seq blocks')
                (if last-direct-child-id
                  (let [last-direct-child (d/entity db last-direct-child-id)
                        result (move-blocks repo conn blocks' last-direct-child (merge opts {:sibling? true
                                                                                             :indent? true}))
                        ;; expand `left` if it's collapsed
                        collapsed-tx (when (:block/collapsed? left)
                                       {:tx-data [{:db/id (:db/id left)
                                                   :block/collapsed? false}]})]
                    (concat-tx-fn result collapsed-tx))
                  (move-blocks repo conn blocks' left (merge opts {:sibling? false
                                                                   :indent? true}))))))
          (let [parent-original (when get-first-block-original (get-first-block-original))]
            (if parent-original
              (let [blocks' (take-while (fn [b]
                                          (not= (:db/id (:block/parent b))
                                                (:db/id (:block/parent parent))))
                                        top-level-blocks)]
                (move-blocks repo conn blocks' parent-original (merge opts {:outliner-op :indent-outdent-blocks
                                                                            :sibling? true
                                                                            :indent? false})))

              (when (and parent (not (page-block? (d/entity db (:db/id parent)))))
                (let [blocks' (take-while (fn [b]
                                            (not= (:db/id (:block/parent b))
                                                  (:db/id (:block/parent parent))))
                                          top-level-blocks)
                      result (move-blocks repo conn blocks' parent (merge opts {:sibling? true}))]
                  (if logical-outdenting?
                    result
                  ;; direct outdenting (default behavior)
                    (let [last-top-block (d/entity db (:db/id (last blocks')))
                          right-siblings (->> (get-right-siblings conn (block db last-top-block))
                                              (map :data))]
                      (if (seq right-siblings)
                        (let [result2 (if-let [last-direct-child-id (ldb/get-block-last-direct-child-id db (:db/id last-top-block))]
                                        (move-blocks repo conn right-siblings (d/entity db last-direct-child-id) (merge opts {:sibling? true}))
                                        (move-blocks repo conn right-siblings last-top-block (merge opts {:sibling? false})))]
                          (concat-tx-fn result result2))
                        result))))))))))))

;;; ### write-operations have side-effects (do transactions) ;;;;;;;;;;;;;;;;

(def *transaction-data
  "Stores transaction-data that are generated by one or more write-operations,
  see also `logseq.outliner.transaction/transact!`"
  (atom nil))

(def #_:clj-kondo/ignore *transaction-opts
  "Stores transaction opts that are generated by one or more write-operations,
  see also `logseq.outliner.transaction/transact!`"
  (atom nil))

(defn- op-transact!
  [fn-var & args]
  {:pre [(var? fn-var)]}
  (let [result (apply @fn-var args)]
    (swap! *transaction-data conj (select-keys result [:tx-data :tx-meta]))
    result))

(defn save-block!
  [repo conn date-formatter block]
  (op-transact! #'save-block repo conn date-formatter block))

(defn insert-blocks!
  [repo conn blocks target-block opts]
  (op-transact! #'insert-blocks repo conn blocks target-block (assoc opts :outliner-op :insert-blocks)))

(defn delete-blocks!
  [repo conn date-formatter blocks opts]
  (op-transact! #'delete-blocks repo conn date-formatter blocks (assoc opts :outliner-op :delete-blocks)))

(defn move-blocks!
  [repo conn blocks target-block sibling?]
  (op-transact! #'move-blocks repo conn blocks target-block {:sibling? sibling?
                                                             :outliner-op :move-blocks}))
(defn move-blocks-up-down!
  [repo conn blocks up?]
  (op-transact! #'move-blocks-up-down repo conn blocks up?))

(defn indent-outdent-blocks!
  [repo conn blocks indent? & {:as opts}]
  (op-transact! #'indent-outdent-blocks repo conn blocks indent? opts))
