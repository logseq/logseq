(ns logseq.outliner.core
  "Provides the primary outliner operations and fns"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de :refer [Entity]]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.outliner.datascript :as ds]
            [logseq.outliner.tree :as otree]
            [logseq.common.util :as common-util]
            [malli.core :as m]
            [malli.util :as mu]
            [logseq.db :as ldb]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.db :as gp-db]
            [logseq.db.frontend.property.util :as db-property-util]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.common.marker :as common-marker]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [frontend.worker.batch-tx :include-macros true :as batch-tx]
            [logseq.db.frontend.order :as db-order]))

(def ^:private block-map
  (mu/optional-keys
   [:map
    [:db/id :int]
    ;; FIXME: tests use ints when they should use uuids
    [:block/uuid [:or :uuid :int]]
    [:block/order :string]
    [:block/parent :map]
    [:block/page :map]]))

(def ^:private block-map-or-entity
  [:or [:fn de/entity?] block-map])

(defn ^:api block-with-timestamps
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

(defn- filter-top-level-blocks
  [db blocks]
  (let [parent-ids (set/intersection (set (map (comp :db/id :block/parent) blocks))
                                     (set (map :db/id blocks)))]
    (->> blocks
         (remove (fn [e] (contains? parent-ids (:db/id (:block/parent e)))))
         (map (fn [block]
                (if (de/entity? block) block (d/entity db (:db/id block))))))))

(defn- remove-orphaned-page-refs!
  [db {db-id :db/id} txs-state *old-refs new-refs {:keys [db-graph?]}]
  (let [old-refs (if db-graph?
                   ;; remove class and property related refs because this fn is only meant
                   ;; to cleanup refs in content
                   (remove #(some #{"class" "property"} (:block/type %))
                           *old-refs)
                   *old-refs)]
    (when (not= old-refs new-refs)
      (let [new-refs (set (map (fn [ref]
                                 (or (:block/name ref)
                                     (and (:db/id ref)
                                          (:block/name (d/entity db (:db/id ref)))))) new-refs))
            old-pages (->> (keep :db/id old-refs)
                           (d/pull-many db '[*])
                           (remove (fn [e] (contains? new-refs (:block/name e))))
                           (map :block/name)
                           (remove nil?))
            orphaned-pages (when (seq old-pages)
                             (ldb/get-orphaned-pages db {:pages old-pages
                                                         :built-in-pages-names
                                                         (if db-graph?
                                                           sqlite-create-graph/built-in-pages-names
                                                           gp-db/built-in-pages-names)
                                                         :empty-ref-f (fn [page]
                                                                        (let [refs (:block/_refs page)]
                                                                          (and (or (zero? (count refs))
                                                                                   (= #{db-id} (set (map :db/id refs))))
                                                                               (not (some #{"class" "property"} (:block/type page))))))}))]
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
  [db txs-state block-entity m opts]
  (let [remove-self-page #(remove (fn [b]
                                    (= (:db/id b) (:db/id (:block/page block-entity)))) %)
        old-refs (remove-self-page (:block/refs block-entity))
        new-refs (remove-self-page (:block/refs m))]
    (remove-orphaned-page-refs! db block-entity txs-state old-refs new-refs opts)))

(defn- get-last-child-or-self
  [db block]
  (let [last-child (some->> (ldb/get-block-last-direct-child-id db (:db/id block) true)
                            (d/entity db))
        target (or last-child block)]
    [target (some? last-child)]))

(declare move-blocks)

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

(defn- ref->eid
  "ref: entity, map, int, eid"
  [ref]
  (cond
    (:db/id ref)
    (:db/id ref)

    (:block/uuid ref)
    [:block/uuid (:block/uuid ref)]

    (and (vector? ref)
         (= (count ref) 2)
         (= :block/uuid (first ref)))
    [:block/uuid (second ref)]

    (int? ref)
    ref

    :else (throw (js/Error. (str "invalid ref " ref)))))

(defn ^:api rebuild-block-refs
  [repo conn date-formatter block new-properties]
  (let [db @conn
        property-key-refs (keys new-properties)
        property-value-refs (->> (vals new-properties)
                                 (mapcat (fn [v]
                                           (cond
                                             (and (coll? v) (uuid? (first v)))
                                             v

                                             (uuid? v)
                                             (when-let [entity (d/entity db [:block/uuid v])]
                                               (let [from-property? (:logseq.property/created-from-property entity)]
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

        content-refs (when-let [content (:block/content block)]
                       (gp-block/extract-refs-from-text repo db content date-formatter))]
    (concat property-refs content-refs
            (when (sqlite-util/db-based-graph? repo)
              (map ref->eid (:block/tags block))))))

(defn- rebuild-refs
  [repo conn date-formatter txs-state block m]
  (when (sqlite-util/db-based-graph? repo)
    (let [content (:block/content m)
          block' (if (and (string? content) (not (re-find db-content/special-id-ref-pattern content))) ; not raw content
                   (assoc block :block/content content)
                   block)
          refs' (rebuild-block-refs repo conn date-formatter block' {})
          refs (->> refs'
                    (concat (:block/refs m))
                    (remove nil?))
          add-tag-type (map
                        (fn [t]
                          {:db/id (ref->eid t)
                           :block/type "class"})
                        (:block/tags m))
          refs (map (fn [ref]
                      (if (and (map? ref)
                               (:block/name ref))
                        (let [page-id (:db/id (ldb/get-page @conn (:block/name ref)))]
                          (cond-> ref
                            (some? page-id)
                            (assoc :db/id page-id)))
                        ref)) refs)]
      (swap! txs-state (fn [txs] (concat txs [{:db/id (:db/id block)
                                               :block/refs refs}]
                                         add-tag-type))))))

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

;; TODO: don't parse marker and deprecate typing marker to set status
(defn- db-marker-handle
  [conn m]
  (or
   (let [marker (:block/marker m)
         property (d/entity @conn :logseq.task/status)
         matched-status-id (when marker
                             (->> (get-in property [:block/schema :values])
                                  (some (fn [id]
                                          (let [value-e (d/entity @conn [:block/uuid id])
                                                value (get-in value-e [:block/schema :value])]
                                            (when (= (string/lower-case marker) (string/lower-case value))
                                              (:db/id value-e)))))))]
     (cond-> m
       matched-status-id
       (assoc (:db/ident property) matched-status-id)

       matched-status-id
       (update :block/content (fn [content]
                                (common-marker/clean-marker content (get m :block/format :markdown))))
       matched-status-id
       (update :db/other-tx (fn [tx]
                              (conj tx [:db/add (:db/id m) :block/tags :logseq.class/task])))

       true
       (dissoc :block/marker :block/priority)))
   m))

(extend-type Entity
  otree/INode
  (-save [this txs-state conn repo date-formatter {:keys [retract-attributes? retract-attributes]
                                                   :or {retract-attributes? true}}]
    (assert (ds/outliner-txs-state? txs-state)
            "db should be satisfied outliner-tx-state?")
    (let [data this
          db-based? (sqlite-util/db-based-graph? repo)
          data' (cond->
                 (if (de/entity? data)
                   (assoc (.-kv ^js data) :db/id (:db/id data))
                   data)
                  db-based?
                  (dissoc :block/properties))
          m (-> data'
                (dissoc :block/children :block/meta :block.temp/top? :block.temp/bottom? :block/unordered
                        :block/title :block/body :block/level :block.temp/fully-loaded?)
                common-util/remove-nils
                block-with-updated-at
                fix-tag-ids)
          db @conn
          db-id (:db/id this)
          block-uuid (:block/uuid this)
          eid (or db-id (when block-uuid [:block/uuid block-uuid]))
          block-entity (d/entity db eid)
          m (cond->> m
              db-based?
              (db-marker-handle conn))
          m (if db-based?
              (update m :block/tags (fn [tags]
                                      (concat (keep :db/id (:block/tags block-entity))
                                              (keep ref->eid tags))))
              m)]
      ;; Ensure block UUID never changes
      (let [e (d/entity db db-id)]
        (when (and e block-uuid)
          (let [uuid-not-changed? (= block-uuid (:block/uuid e))]
            (when-not uuid-not-changed?
              (js/console.error "Block UUID shouldn't be changed once created"))
            (assert uuid-not-changed? "Block UUID changed"))))

      (when eid
        ;; Retract attributes to prepare for tx which rewrites block attributes
        (when (or (and retract-attributes? (:block/content m))
                  (seq retract-attributes))
          (let [retract-attributes (concat
                                    (if db-based?
                                      (conj db-schema/db-version-retract-attributes :block/tags)
                                      db-schema/retract-attributes)
                                    retract-attributes)]
            (swap! txs-state (fn [txs]
                               (vec
                                (concat txs
                                        (map (fn [attribute]
                                               [:db/retract eid attribute])
                                             retract-attributes)))))))

        ;; Update block's page attributes
        (update-page-when-save-block txs-state block-entity m)
        ;; Remove orphaned refs from block
        (when (and (:block/content m) (not= (:block/content m) (:block/content block-entity)))
          (remove-orphaned-refs-when-save @conn txs-state block-entity m {:db-graph? db-based?})))

      ;; handle others txs
      (let [other-tx (:db/other-tx m)]
        (when (seq other-tx)
          (swap! txs-state (fn [txs]
                             (vec (concat txs other-tx)))))
        (swap! txs-state conj
               (dissoc m :db/other-tx)))

      (rebuild-refs repo conn date-formatter txs-state block-entity m)

      this))

  (-del [this txs-state conn]
    (assert (ds/outliner-txs-state? txs-state)
            "db should be satisfied outliner-tx-state?")
    (let [block-id (:block/uuid this)
          ids (->>
               (let [children (ldb/get-block-children @conn block-id)
                     children-ids (map :block/uuid children)]
                 (conj children-ids block-id))
               (remove nil?))
          txs (map (fn [id] [:db.fn/retractEntity [:block/uuid id]]) ids)
          page-tx (let [block (d/entity @conn [:block/uuid block-id])]
                    (when (:block/pre-block? block)
                      (let [id (:db/id (:block/page block))]
                        [[:db/retract id :block/properties]
                         [:db/retract id :block/properties-order]
                         [:db/retract id :block/properties-text-values]
                         [:db/retract id :block/alias]
                         [:db/retract id :block/tags]])))]
      (swap! txs-state concat txs page-tx)
      block-id)))

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
                                      :db/id db-id)]))
                          [(assoc block :db/id (dec (- idx)))]))) blocks)
       (apply concat)))


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
  [block parent target-block top-level? sibling? get-new-id outliner-op replace-empty-target? idx]
  (cond
    ;; replace existing block
    (and (contains? #{:paste :insert-blocks} outliner-op)
         replace-empty-target?
         (string/blank? (:block/content target-block))
         (zero? idx))
    (get-id (:block/parent target-block))

    top-level?
    (if sibling?
      (:db/id (:block/parent target-block))
      (:db/id target-block))

    :else
    (get-new-id block parent)))

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
  [repo conn date-formatter block opts]
  {:pre [(map? block)]}
  (let [txs-state (atom [])
        block' (if (de/entity? block)
                 block
                 (do
                   (assert (or (:db/id block) (:block/uuid block)) "save-block db/id not exists")
                   (when-let [eid (or (:db/id block) (when-let [id (:block/uuid block)] [:block/uuid id]))]
                     (merge (d/entity @conn eid) block))))]
    (otree/-save block' txs-state conn repo date-formatter opts)
    {:tx-data @txs-state}))

(defn- get-right-siblings
  "Get `node`'s right siblings."
  [node]
  (when-let [parent (:block/parent node)]
    (let [children (ldb/sort-by-order (:block/_parent parent))]
      (->> (split-with #(not= (:block/uuid node) (:block/uuid %)) children)
           last
           rest))))

(defn- blocks-with-ordered-list-props
  [repo conn blocks target-block sibling?]
  (let [db @conn
        target-block (if sibling? target-block (when target-block (ldb/get-down target-block)))
        list-type-fn (fn [block] (db-property-util/get-block-property-value repo db block :logseq.property/order-list-type))
        db-based? (sqlite-util/db-based-graph? repo)]
    (if-let [list-type (and target-block (list-type-fn target-block))]
      (mapv
       (fn [{:block/keys [content format] :as block}]
         (let [list? (and (some? (:block/uuid block))
                          (nil? (list-type-fn block)))]
           (cond-> block
             list?
             ((fn [b]
                (if db-based?
                  (assoc b :logseq.property/order-list-type list-type)
                  (update b :block/properties assoc (db-property-util/get-pid repo :logseq.property/order-list-type) list-type))))

             (not db-based?)
             (assoc :block/content (gp-property/insert-property repo format content :logseq.order-list-type list-type)))))
       blocks)
      blocks)))

;;; ### insert-blocks, delete-blocks, move-blocks

(defn- insert-blocks-aux
  [blocks target-block {:keys [sibling? replace-empty-target? keep-uuid? outliner-op]}]
  (let [block-uuids (map :block/uuid blocks)
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
        target-order (:block/order target-block)
        next-sibling-order (:block/order (ldb/get-right-sibling target-block))
        first-child (ldb/get-down target-block)
        first-child-order (:block/order first-child)
        start-order (when sibling? target-order)
        end-order (if sibling? next-sibling-order first-child-order)
        orders (db-order/gen-n-keys (count blocks) start-order end-order)]
    (map-indexed (fn [idx {:block/keys [parent] :as block}]
                   (when-let [uuid (get uuids (:block/uuid block))]
                     (let [top-level? (= (:block/level block) 1)
                           parent (compute-block-parent block parent target-block top-level? sibling? get-new-id outliner-op replace-empty-target? idx)

                           order (nth orders idx)
                           _ (assert (and parent order) (str "Parent or order is nil: " {:parent parent :order order}))
                           m {:db/id (:db/id block)
                              :block/uuid uuid
                              :block/page target-page
                              :block/parent parent
                              :block/order order}]
                       (->
                        (if (de/entity? block)
                          (assoc m :block/level (:block/level block))
                          (merge block m))
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
          [block sibling?] (cond
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
                             [block sibling?])
          sibling? (if (ldb/page? block) false sibling?)
          block (if (de/entity? block) block (d/entity db (:db/id block)))]
      [block sibling?])))


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
  (let [[target-block sibling?] (get-target-block @conn blocks target-block opts)
        _ (assert (some? target-block) (str "Invalid target: " target-block))
        sibling? (if (ldb/page? target-block) false sibling?)
        replace-empty-target? (if (and (some? replace-empty-target?)
                                       (:block/content target-block)
                                       (string/blank? (:block/content target-block)))
                                replace-empty-target?
                                (and sibling?
                                     (:block/content target-block)
                                     (string/blank? (:block/content target-block))
                                     (> (count blocks) 1)))
        blocks' (let [blocks' (blocks-with-level blocks)]
                  (cond->> (blocks-with-ordered-list-props repo conn blocks' target-block sibling?)
                    update-timestamps?
                    (mapv (fn [b] (block-with-timestamps (dissoc b :block/created-at :block/updated-at))))
                    true
                    (mapv block-with-timestamps)))
        insert-opts {:sibling? sibling?
                     :replace-empty-target? replace-empty-target?
                     :keep-uuid? keep-uuid?
                     :outliner-op outliner-op}
        tx' (insert-blocks-aux blocks' target-block insert-opts)]
    (if (some (fn [b] (or (nil? (:block/parent b)) (nil? (:block/order b)))) tx')
      (throw (ex-info "Invalid outliner data"
                      {:opts insert-opts
                       :tx (vec tx')
                       :blocks (vec blocks)
                       :target-block target-block}))
      (let [uuids-tx (->> (map :block/uuid tx')
                          (remove nil?)
                          (map (fn [uuid] {:block/uuid uuid})))
            tx (assign-temp-id tx' replace-empty-target? target-block)
            full-tx (common-util/concat-without-nil (if (and keep-uuid? replace-empty-target?) (rest uuids-tx) uuids-tx) tx)]
        {:tx-data full-tx
         :blocks  tx}))))

(defn- sort-non-consecutive-blocks
  [db blocks]
  (let [page-blocks (group-by :block/page blocks)]
    (mapcat (fn [[_page blocks]]
              (ldb/sort-page-random-blocks db blocks))
            page-blocks)))

(defn delete-block
  [_repo conn txs-state node {:keys [_date-formatter]}]
  (otree/-del node txs-state conn)
  @txs-state)

(defn- get-top-level-blocks
  [top-level-blocks non-consecutive?]
  (let [reversed? (and (not non-consecutive?)
                       (:block/order (first top-level-blocks))
                       (:block/order (second top-level-blocks))
                       (> (compare (:block/order (first top-level-blocks))
                                   (:block/order (second top-level-blocks))) 0))]
    (if reversed? (reverse top-level-blocks) top-level-blocks)))

(defn ^:api ^:large-vars/cleanup-todo delete-blocks
  "Delete blocks from the tree.
  `blocks` need to be sorted by left&parent(from top to bottom)"
  [repo conn date-formatter blocks delete-opts]
  [:pre [(seq blocks)]]
  (let [top-level-blocks (filter-top-level-blocks @conn blocks)
        non-consecutive? (and (> (count top-level-blocks) 1) (seq (ldb/get-non-consecutive-blocks @conn top-level-blocks)))
        top-level-blocks (get-top-level-blocks top-level-blocks non-consecutive?)
        txs-state (ds/new-outliner-txs-state)
        block-ids (map (fn [b] [:block/uuid (:block/uuid b)]) top-level-blocks)
        start-block (first top-level-blocks)
        end-block (last top-level-blocks)]
    (if (or
         (= 1 (count top-level-blocks))
         (= start-block end-block))
      (delete-block repo conn txs-state start-block (assoc delete-opts :date-formatter date-formatter))
      (doseq [id block-ids]
        (let [node (d/entity @conn id)]
          (otree/-del node txs-state conn))))
    {:tx-data @txs-state}))

(defn- move-to-original-position?
  [blocks target-block sibling? non-consecutive-blocks?]
  (and (not non-consecutive-blocks?)
       (= (:db/id (ldb/get-left-sibling (first blocks))) (:db/id target-block))
       (not= (= (:db/id (:block/parent (first blocks)))
                (:db/id target-block))
             sibling?)))

(defn- move-block
  [conn block target-block sibling?]
  (let [db @conn
        target-block (d/entity db (:db/id target-block))
        block (d/entity db (:db/id block))
        first-block-page (:db/id (:block/page block))
        target-page (or (:db/id (:block/page target-block))
                        (:db/id target-block))
        not-same-page? (not= first-block-page target-page)
        block-order (if sibling?
                      (db-order/gen-key (:block/order target-block)
                                        (:block/order (ldb/get-right-sibling target-block)))
                      (db-order/gen-key nil
                                        (:block/order (ldb/get-down target-block))))
        tx-data [(cond->
                  {:db/id (:db/id block)
                   :block/parent (if sibling?
                                   (:db/id (:block/parent target-block))
                                   (:db/id target-block))
                   :block/order block-order}
                   not-same-page?
                   (assoc :block/page target-page))]
        children-page-tx (when not-same-page?
                           (let [children-ids (ldb/get-block-children-ids db (:block/uuid block))]
                             (map (fn [id] {:block/uuid id
                                            :block/page target-page}) children-ids)))]
    (common-util/concat-without-nil tx-data children-page-tx)))

(defn- move-blocks
  "Move `blocks` to `target-block` as siblings or children."
  [_repo conn blocks target-block {:keys [_sibling? _up? outliner-op _indent?]
                                   :as opts}]
  {:pre [(seq blocks)
         (m/validate block-map-or-entity target-block)]}
  (let [db @conn
        top-level-blocks (filter-top-level-blocks db blocks)
        [target-block sibling?] (get-target-block db top-level-blocks target-block opts)
        non-consecutive? (and (> (count top-level-blocks) 1) (seq (ldb/get-non-consecutive-blocks db top-level-blocks)))
        top-level-blocks (get-top-level-blocks top-level-blocks non-consecutive?)
        blocks (->> (if non-consecutive?
                      (sort-non-consecutive-blocks db top-level-blocks)
                      top-level-blocks)
                    (map (fn [block]
                           (if (de/entity? block)
                             block
                             (d/entity db (:db/id block))))))
        original-position? (move-to-original-position? blocks target-block sibling? non-consecutive?)]
    (when (and (not (contains? (set (map :db/id blocks)) (:db/id target-block)))
               (not original-position?))
      (let [parents (->> (ldb/get-block-parents db (:block/uuid target-block) {})
                         (map :db/id)
                         (set))
            move-parents-to-child? (some parents (map :db/id blocks))]
        (when-not move-parents-to-child?
          (batch-tx/with-batch-tx-mode conn {:outliner-op :move-blocks}
            (doseq [[idx block] (map vector (range (count blocks)) blocks)]
              (let [first-block? (zero? idx)
                    sibling? (if first-block? sibling? true)
                    target-block (if first-block? target-block
                                     (d/entity @conn (:db/id (nth blocks (dec idx)))))
                    block (d/entity @conn (:db/id block))]
                (when-not (and (= (:db/id (ldb/get-left-sibling block)) (:db/id target-block))
                               (if sibling?
                                 (= (:db/id (:block/parent block)) (:db/id (:block/parent target-block)))
                                 (= (:db/id (:block/parent block)) (:db/id target-block))))
                  (let [tx-data (move-block conn block target-block sibling?)]
                    (ldb/transact! conn tx-data {:sibling? sibling?
                                                 :outliner-op (or outliner-op :move-blocks)}))))))
          nil)))))

(defn- move-blocks-up-down
  "Move blocks up/down."
  [repo conn blocks up?]
  {:pre [(seq blocks) (boolean? up?)]}
  (let [db @conn
        top-level-blocks (filter-top-level-blocks db blocks)
        opts {:outliner-op :move-blocks-up-down}]
    (if up?
      (let [first-block (d/entity db (:db/id (first top-level-blocks)))
            first-block-parent (:block/parent first-block)
            left-or-parent (or (ldb/get-left-sibling first-block)
                               first-block-parent)
            left-left (or (ldb/get-left-sibling left-or-parent)
                          first-block-parent)
            sibling? (= (:db/id (:block/parent left-left))
                        (:db/id first-block-parent))]
        (when (and left-left
                   (not= (:db/id (:block/page first-block-parent))
                         (:db/id left-left)))
          (move-blocks repo conn top-level-blocks left-left (merge opts {:sibling? sibling?
                                                                         :up? up?}))))

      (let [last-top-block (last top-level-blocks)
            last-top-block-right (ldb/get-right-sibling last-top-block)
            right (or
                   last-top-block-right
                   (let [parent (:block/parent last-top-block)
                         parent (when (:block/page (d/entity db (:db/id parent)))
                                  parent)]
                     (ldb/get-right-sibling parent)))
            sibling? (= (:db/id (:block/parent last-top-block))
                        (:db/id (:block/parent right)))]
        (when right
          (move-blocks repo conn blocks right (merge opts {:sibling? sibling?
                                                           :up? up?})))))))

(defn- ^:large-vars/cleanup-todo indent-outdent-blocks
  "Indent or outdent `blocks`."
  [repo conn blocks indent? & {:keys [parent-original logical-outdenting?]}]
  {:pre [(seq blocks) (boolean? indent?)]}
  (let [db @conn
        top-level-blocks (filter-top-level-blocks db blocks)
        non-consecutive? (and (> (count top-level-blocks) 1) (seq (ldb/get-non-consecutive-blocks @conn top-level-blocks)))
        top-level-blocks (get-top-level-blocks top-level-blocks non-consecutive?)]
    (when-not non-consecutive?
      (let [first-block (d/entity db (:db/id (first top-level-blocks)))
            left (ldb/get-left-sibling first-block)
            parent (:block/parent first-block)
            concat-tx-fn (fn [& results]
                           {:tx-data (->> (map :tx-data results)
                                          (apply common-util/concat-without-nil))
                            :tx-meta (:tx-meta (first results))})
            opts {:outliner-op :indent-outdent-blocks}]
        (if indent?
          (when left
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
          (if parent-original
            (let [blocks' (take-while (fn [b]
                                        (not= (:db/id (:block/parent b))
                                              (:db/id (:block/parent parent))))
                                      top-level-blocks)]
              (move-blocks repo conn blocks' parent-original (merge opts {:outliner-op :indent-outdent-blocks
                                                                          :sibling? true
                                                                          :indent? false})))

            (when (and parent (not (ldb/page? (d/entity db (:db/id parent)))))
              (let [blocks' (take-while (fn [b]
                                          (not= (:db/id (:block/parent b))
                                                (:db/id (:block/parent parent))))
                                        top-level-blocks)
                    result (move-blocks repo conn blocks' parent (merge opts {:sibling? true}))]
                (if logical-outdenting?
                  result
                  ;; direct outdenting (default behavior)
                  (let [last-top-block (d/entity db (:db/id (last blocks')))
                        right-siblings (get-right-siblings last-top-block)]
                    (if (seq right-siblings)
                      (if-let [last-direct-child-id (ldb/get-block-last-direct-child-id db (:db/id last-top-block))]
                        (move-blocks repo conn right-siblings (d/entity db last-direct-child-id) (merge opts {:sibling? true}))
                        (move-blocks repo conn right-siblings last-top-block (merge opts {:sibling? false})))
                      result)))))))))))

;;; ### write-operations have side-effects (do transactions) ;;;;;;;;;;;;;;;;

(defn- op-transact!
  [fn-var & args]
  {:pre [(var? fn-var)]}
  (let [result (apply @fn-var args)]
    (when result
      (ldb/transact! (second args) (:tx-data result) (:tx-meta result)))
    result))

(defn save-block!
  [repo conn date-formatter block & {:as opts}]
  (op-transact! #'save-block repo conn date-formatter block opts))

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
